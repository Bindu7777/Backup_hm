-- Team-only list of every vendor photo customers could see, with its hidden state,
-- for the photo review page (/team/photos). Combines photos saved on the vendor
-- (catalog_images_metadata) and photos in storage under <vendor_id>/catalog/.

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
      and o.name ~ '^[0-9]+/catalog/'
      and o.name !~* '\.emptyFolderPlaceholder$'
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
