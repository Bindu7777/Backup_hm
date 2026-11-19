-- Vendor photos everywhere: the matches page used only photos saved on the vendor
-- (catalog_images_metadata), but most real vendors' work is in storage under
-- vendor-images/<id>/catalog/ and /portfolio/. Read all of them, still skipping
-- photos the team has hidden, and fall back to the brand logo.

-- Up to p_limit photos: highlighted saved photos first, then saved, then storage.
-- Saved photos come back as their URL; storage photos as "vendor-images/<path>"
-- (the app turns that into a public URL).
create or replace function public.vendor_photos(p_vendor_id integer, p_limit integer default 4)
returns text[] language sql stable security definer set search_path = public, storage as $$
  with saved as (
    select x.item ->> 'media_url' as url, public.photo_key(x.item ->> 'media_url') as k,
           case when coalesce((x.item ->> 'is_highlighted')::boolean, false) then 0 else 1 end as rank_group, x.ord
    from public.vendors v,
         jsonb_array_elements(case when jsonb_typeof(v.catalog_images_metadata) = 'array'
                                   then v.catalog_images_metadata else '[]'::jsonb end) with ordinality as x(item, ord)
    where v.vendor_id = p_vendor_id and coalesce(x.item ->> 'media_url', '') <> ''
  ),
  stored as (
    select 'vendor-images/' || o.name as url, 'vendor-images/' || o.name as k,
           case when o.name like '%/catalog/%' then 2 else 3 end as rank_group,
           row_number() over (order by o.created_at, o.name) as ord
    from storage.objects o
    where o.bucket_id = 'vendor-images'
      and (o.name like p_vendor_id || '/catalog/%' or o.name like p_vendor_id || '/portfolio/%')
      and o.name ~* '\.(jpe?g|png|webp)$'
  ),
  allp as (
    select distinct on (k) url, k, rank_group, ord from (select * from saved union all select * from stored) a
    order by k, rank_group, ord
  )
  select coalesce(array_agg(url order by rank_group, ord), '{}') from (
    select * from allp
    where not exists (select 1 from public.vendor_photo_flags f where f.photo_key = allp.k)
    order by rank_group, ord
    limit greatest(coalesce(p_limit, 4), 1)
  ) p;
$$;
revoke execute on function public.vendor_photos(integer, integer) from public;
grant execute on function public.vendor_photos(integer, integer) to anon, authenticated;

-- The vendor's brand logo in storage, if any, as "vendor-images/<path>".
create or replace function public.vendor_logo(p_vendor_id integer)
returns text language sql stable security definer set search_path = public, storage as $$
  select 'vendor-images/' || o.name from storage.objects o
  where o.bucket_id = 'vendor-images'
    and (o.name like p_vendor_id || '/brand_logo/%' or o.name like p_vendor_id || '/brand-logo/%')
    and o.name ~* '\.(jpe?g|png|webp)$'
  order by o.created_at desc limit 1;
$$;
revoke execute on function public.vendor_logo(integer) from public;
grant execute on function public.vendor_logo(integer) to anon, authenticated;

-- Team photo review also covers portfolio photos.
create or replace function public.staff_vendor_photos()
returns table (vendor_id integer, brand_name text, photo_key text, hidden boolean, reason text, hidden_at timestamptz)
language plpgsql stable security definer set search_path = public, storage as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  return query
  with photos as (
    select v.vendor_id, public.photo_key(x.item ->> 'media_url') as k
    from public.vendors v,
         jsonb_array_elements(case when jsonb_typeof(v.catalog_images_metadata) = 'array'
                                   then v.catalog_images_metadata else '[]'::jsonb end) as x(item)
    where coalesce(x.item ->> 'media_url', '') <> ''
    union
    select split_part(o.name, '/', 1)::integer, o.bucket_id || '/' || o.name
    from storage.objects o
    where o.bucket_id in ('vendor-images', 'catalog-images')
      and o.name ~ '^[0-9]+/(catalog|portfolio)/'
      and o.name ~* '\.(jpe?g|png|webp)$'
  )
  select p.vendor_id, v.brand_name, p.k, f.photo_key is not null, f.reason, f.set_at
  from photos p
  join public.vendors v on v.vendor_id = p.vendor_id
  left join public.vendor_photo_flags f on f.photo_key = p.k
  where p.k is not null
  order by v.brand_name, p.vendor_id, p.k;
end $$;
revoke execute on function public.staff_vendor_photos() from public, anon, authenticated;
grant execute on function public.staff_vendor_photos() to authenticated;

-- Matching: real vendors only; photos from every source; vendors with real photos rank higher.
drop function if exists public.match_vendors(text[], text, text, integer, text, text[], integer);
create function public.match_vendors(
  p_services text[], p_city text, p_area text, p_guests integer, p_budget_range text,
  p_style_tags text[], p_per_service integer default 5
) returns table (
  service text, vendor_id integer, slug text, brand_name text, area_label text,
  categories text[], starting_price integer, good_for text, verified boolean, photos text[], score numeric,
  rating numeric, review_count integer, review_source text, events_done integer,
  experience text, price_min integer, price_max integer, highlights text[], logo text
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
      public.vendor_photos(v.vendor_id, 4) as photo_urls,
      s.median_reply_min
    from req
    join public.vendors v on v.categories && public.service_categories(req.service)
    left join speed s on s.vendor_id = v.vendor_id
    where coalesce(v.currently_available, true)
      and not v.is_demo
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
      + case when coalesce(cardinality(c.photo_urls), 0) > 0 then 4 else 0 end
      + least(coalesce(cardinality(c.photo_urls), 0), 4) * 0.5
      + case when coalesce(c.quick_intro, c.caption, c.description, '') <> '' then 1 else 0 end
      )::numeric as score_value,
      row_number() over (partition by c.service order by
        c.style_overlap desc, (coalesce(cardinality(c.photo_urls), 0) > 0) desc, c.area_hit desc, c.verified desc nulls last,
        c.median_reply_min asc nulls last, coalesce(cardinality(c.photo_urls), 0) desc, c.vendor_id) as rn
    from cand c
  )
  select r.service, r.vendor_id, r.slug, r.brand_name,
         case when r.area_hit then initcap(p_area) else coalesce(nullif(p_city, ''), 'Hyderabad') end,
         r.categories, nullif(r.starting_price, 0),
         left(coalesce(nullif(r.quick_intro, ''), nullif(r.caption, ''), r.description), 120),
         coalesce(r.verified, false), coalesce(r.photo_urls, '{}'), r.score_value,
         st.rating, st.review_count, st.review_source, st.events_done,
         st.experience, st.price_min, st.price_max, st.highlights, public.vendor_logo(r.vendor_id)
  from ranked r
  cross join lateral public.vendor_card_stats(r.vendor_id) st
  where r.rn <= least(greatest(coalesce(p_per_service, 5), 1), 5)
  order by r.service, r.rn;
$$;
revoke execute on function public.match_vendors(text[], text, text, integer, text, text[], integer) from public;
grant execute on function public.match_vendors(text[], text, text, integer, text, text[], integer) to anon, authenticated;
