-- Vendor card facts for the matches page: rating, events done, experience, price
-- range and highlights. Only shows numbers that hold up:
--   rating: from published Happy Moments customer reviews first; otherwise the
--           vendor's own listed rating, but only when they list a review count
--           (a star rating with zero reviews is not shown).
--   events / experience: as entered by the vendor (the card says so).
--   price range: lowest and highest of starting_price and package prices.

create or replace function public.vendor_card_stats(p_vendor_id integer)
returns table (
  rating numeric, review_count integer, review_source text, events_done integer,
  experience text, price_min integer, price_max integer, highlights text[]
) language sql stable security definer set search_path = public as $$
  with v as (select * from public.vendors where vendor_id = p_vendor_id),
  hm as (
    select count(*)::int as n, round(avg(r.rating)::numeric, 1) as avg_rating
    from public.customer_reviews r
    where r.vendor_id = p_vendor_id and coalesce(r.is_published, false)
  ),
  prices as (
    select nullif(regexp_replace(p ->> 'price', '[^0-9]', '', 'g'), '')::bigint as amount
    from v, jsonb_array_elements(case when jsonb_typeof(v.packages) = 'array' then v.packages else '[]'::jsonb end) p
    union all
    select v.starting_price::bigint from v
  ),
  pr as (
    select min(amount) filter (where amount between 100 and 100000000) lo,
           max(amount) filter (where amount between 100 and 100000000) hi
    from prices
  )
  select
    case when hm.n > 0 then hm.avg_rating
         when coalesce(v.review_count, 0) > 0 and v.rating > 0 then round(v.rating, 1) end,
    case when hm.n > 0 then hm.n when coalesce(v.review_count, 0) > 0 and v.rating > 0 then v.review_count end,
    case when hm.n > 0 then 'happy_moments' when coalesce(v.review_count, 0) > 0 and v.rating > 0 then 'vendor' end,
    nullif(v.events_completed, 0),
    case when v.experience ~ '[0-9]' then trim(v.experience) end,
    pr.lo::int,
    case when pr.hi > pr.lo then pr.hi::int end,
    coalesce((select array_agg(h) from (select h from unnest(v.highlight_features) h where coalesce(h, '') <> '' limit 2) x), '{}')
  from v cross join hm cross join pr;
$$;
revoke execute on function public.vendor_card_stats(integer) from public;
grant execute on function public.vendor_card_stats(integer) to anon, authenticated;

-- match_vendors gains the card facts (return type changes, so drop and recreate).
drop function if exists public.match_vendors(text[], text, text, integer, text, text[], integer);
create function public.match_vendors(
  p_services text[], p_city text, p_area text, p_guests integer, p_budget_range text,
  p_style_tags text[], p_per_service integer default 5
) returns table (
  service text, vendor_id integer, slug text, brand_name text, area_label text,
  categories text[], starting_price integer, good_for text, verified boolean, photos text[], score numeric,
  rating numeric, review_count integer, review_source text, events_done integer,
  experience text, price_min integer, price_max integer, highlights text[]
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
         coalesce(r.verified, false), coalesce(r.photo_urls, '{}'), r.score_value,
         st.rating, st.review_count, st.review_source, st.events_done,
         st.experience, st.price_min, st.price_max, st.highlights
  from ranked r
  cross join lateral public.vendor_card_stats(r.vendor_id) st
  where r.rn <= least(greatest(coalesce(p_per_service, 5), 1), 5)
  order by r.service, r.rn;
$$;
revoke execute on function public.match_vendors(text[], text, text, integer, text, text[], integer) from public;
grant execute on function public.match_vendors(text[], text, text, integer, text, text[], integer) to anon, authenticated;
