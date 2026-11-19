-- Hide-photo switch: Super Vendors can hide a vendor photo from customers (for
-- example a flyer with the vendor's phone number printed on it). The vendor and
-- admin edit screens still show every photo.
--
-- Photos are identified by their storage path ("vendor-images/71/catalog/x.jpg"),
-- so a photo is matched whether it's read from vendors.catalog_images_metadata or
-- listed straight from storage.

create table if not exists public.vendor_photo_flags (
  photo_key text primary key,
  vendor_id integer not null references public.vendors (vendor_id) on delete cascade,
  reason text,
  set_by uuid not null references auth.users (id),
  set_at timestamptz not null default now()
);
create index if not exists vendor_photo_flags_vendor_idx on public.vendor_photo_flags (vendor_id);
alter table public.vendor_photo_flags enable row level security;

-- Which photos are hidden isn't secret: customer pages need the list to skip them.
drop policy if exists "anyone reads hidden photo list" on public.vendor_photo_flags;
create policy "anyone reads hidden photo list" on public.vendor_photo_flags for select to anon, authenticated using (true);
revoke insert, update, delete on public.vendor_photo_flags from anon, authenticated;

-- "https://…/storage/v1/object/public/vendor-images/71/catalog/x.jpg?t=1" -> "vendor-images/71/catalog/x.jpg"
create or replace function public.photo_key(p_url text)
returns text language sql immutable as $$
  select case
    when p_url is null then null
    when position('/object/public/' in p_url) > 0
      then split_part(substring(p_url from position('/object/public/' in p_url) + 15), '?', 1)
    else split_part(p_url, '?', 1)
  end;
$$;

-- Staff-only switch. Every change is kept in the staff audit log.
create or replace function public.set_vendor_photo_hidden(p_vendor_id integer, p_url text, p_hidden boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_key text := public.photo_key(p_url);
begin
  if not public.is_staff() then raise exception 'only Happy Moments team members can hide photos'; end if;
  if coalesce(v_key, '') = '' then raise exception 'bad photo'; end if;
  if p_hidden then
    insert into public.vendor_photo_flags (photo_key, vendor_id, reason, set_by)
    values (v_key, p_vendor_id, nullif(trim(coalesce(p_reason, '')), ''), auth.uid())
    on conflict (photo_key) do update set reason = excluded.reason, set_by = excluded.set_by, set_at = now();
  else
    delete from public.vendor_photo_flags where photo_key = v_key;
  end if;
end $$;

revoke execute on function public.set_vendor_photo_hidden(integer, text, boolean, text) from public, anon, authenticated;
grant execute on function public.set_vendor_photo_hidden(integer, text, boolean, text) to authenticated;
grant execute on function public.photo_key(text) to anon, authenticated;

-- Matching: same as before, but hidden photos are skipped.
create or replace function public.match_vendors(
  p_services text[], p_city text, p_area text, p_guests integer, p_budget_range text,
  p_style_tags text[], p_per_service integer default 5
) returns table (
  service text, vendor_id integer, slug text, brand_name text, area_label text,
  categories text[], starting_price integer, good_for text, verified boolean, photos text[], score numeric
) language sql stable security definer set search_path = public as $$
  with req as (select unnest(coalesce(p_services, '{}')) as service),
  speed as (
    select g.vendor_id, percentile_cont(0.5) within group (
             order by extract(epoch from (r.created_at - m.created_at)) / 60) as median_reply_min
    from public.chat_messages m
    join public.chat_groups g on g.id = m.group_id
    join lateral (select min(x.created_at) created_at from public.chat_messages x
                  where x.group_id = m.group_id and x.sender_role = 'vendor' and x.created_at > m.created_at) r on r.created_at is not null
    where m.sender_role = 'customer'
    group by g.vendor_id
  ),
  cand as (
    select req.service, v.*,
      (select count(*) from unnest(v.style_tags) t where t = any (coalesce(p_style_tags, '{}'))) as style_overlap,
      (p_area is not null and p_area <> '' and (v.address ilike '%' || p_area || '%' or p_area = any (v.serves_areas))) as area_hit,
      (select array_agg(ph.url order by ph.highlighted desc, ph.ord) from (
         select x.item ->> 'media_url' as url, coalesce((x.item ->> 'is_highlighted')::boolean, false) as highlighted, x.ord
         from jsonb_array_elements(case when jsonb_typeof(v.catalog_images_metadata) = 'array'
                                        then v.catalog_images_metadata else '[]'::jsonb end) with ordinality as x(item, ord)
         where coalesce(x.item ->> 'media_url', '') <> ''
           and not exists (select 1 from public.vendor_photo_flags f where f.photo_key = public.photo_key(x.item ->> 'media_url'))
         order by coalesce((x.item ->> 'is_highlighted')::boolean, false) desc, x.ord
         limit 4) ph) as photo_urls,
      s.median_reply_min
    from req
    join public.vendors v on v.categories && public.service_categories(req.service)
    left join speed s on s.vendor_id = v.vendor_id
    where coalesce(v.currently_available, true)
      and (coalesce(p_city, '') = '' or v.address ilike '%' || p_city || '%')
      and (cardinality(v.budget_bands) = 0 or p_budget_range is null or p_budget_range = any (v.budget_bands))
      and (v.max_guests is null or p_guests is null or p_guests <= v.max_guests)
  ),
  ranked as (
    select c.*,
      ( c.style_overlap * 10
      + case when c.area_hit then 6 else 0 end
      + case when c.verified then 5 else 0 end
      + case when c.median_reply_min is null then 0
             when c.median_reply_min <= 60 then 4 when c.median_reply_min <= 240 then 2 else 0 end
      + least(coalesce(cardinality(c.photo_urls), 0), 4) * 0.5
      + case when coalesce(c.quick_intro, c.caption, c.description, '') <> '' then 1 else 0 end
      )::numeric as score_value,
      row_number() over (partition by c.service order by
        c.style_overlap desc, c.area_hit desc, c.verified desc nulls last,
        c.median_reply_min asc nulls last, coalesce(cardinality(c.photo_urls), 0) desc, c.vendor_id) as rn
    from cand c
  )
  select r.service, r.vendor_id, r.slug, r.brand_name,
         case when r.area_hit then initcap(p_area) else coalesce(nullif(p_city, ''), 'Hyderabad') end,
         r.categories, nullif(r.starting_price, 0),
         left(coalesce(nullif(r.quick_intro, ''), nullif(r.caption, ''), r.description), 120),
         coalesce(r.verified, false), coalesce(r.photo_urls, '{}'), r.score_value
  from ranked r
  where r.rn <= least(greatest(coalesce(p_per_service, 5), 1), 5)
  order by r.service, r.rn;
$$;
revoke execute on function public.match_vendors(text[], text, text, integer, text, text[], integer) from public;
grant execute on function public.match_vendors(text[], text, text, integer, text, text[], integer) to anon, authenticated;
