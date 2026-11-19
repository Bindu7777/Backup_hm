-- Happy Moments Phase 1: enquiries, vendor matching, group chats, Super Vendors.
--
-- Additive only: new tables, functions and a few new vendor columns. Nothing the
-- current site uses is changed or locked.
--
-- Who is who (all decided in the database, never in the browser):
--   customer     a Supabase Auth user who owns the enquiry / group
--   vendor       a Supabase Auth user whose email matches vendors.email
--   super_vendor a Supabase Auth user listed in staff_roles (role 'super_vendor' or 'admin')
-- Every Super Vendor can read and post in every group, so each group always
-- "contains" all of them without copying rows when staff join or leave.

-- ============================================================ roles

create table if not exists public.staff_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'super_vendor')),
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.staff_roles enable row level security;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_roles where user_id = auth.uid());
$$;

-- Vendor ids the signed-in user may act for (matched on their verified login email).
create or replace function public.my_vendor_ids()
returns setof integer language sql stable security definer set search_path = public as $$
  select v.vendor_id from public.vendors v
  where auth.uid() is not null
    and coalesce(auth.jwt() ->> 'email', '') <> ''
    and lower(trim(v.email)) = lower(auth.jwt() ->> 'email');
$$;

drop policy if exists "staff see staff" on public.staff_roles;
create policy "staff see staff" on public.staff_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- ============================================================ customer profile

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  mobile text not null,
  email text,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customer_profiles enable row level security;

drop policy if exists "own profile read" on public.customer_profiles;
create policy "own profile read" on public.customer_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
drop policy if exists "own profile insert" on public.customer_profiles;
create policy "own profile insert" on public.customer_profiles for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "own profile update" on public.customer_profiles;
create policy "own profile update" on public.customer_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================ vendor matching fields

-- Filled in by the team over time. Empty means "not set yet", and matching treats
-- an empty value as "no restriction" so vendors aren't hidden for missing data.
alter table public.vendors
  add column if not exists style_tags text[] not null default '{}',
  add column if not exists budget_bands text[] not null default '{}',
  add column if not exists serves_areas text[] not null default '{}',
  add column if not exists max_guests integer;

-- ============================================================ enquiries

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid references auth.users (id) on delete set null,
  claim_token_hash text,                       -- lets the anonymous author attach it after sign-up
  event_type text not null,
  event_date date,
  city text not null default 'Hyderabad',
  area text,
  guests integer check (guests is null or guests between 1 and 100000),
  budget_range text,
  services text[] not null default '{}',
  style_tags text[] not null default '{}',
  notes text check (notes is null or length(notes) <= 2000),
  customer_name text,
  created_at timestamptz not null default now()
);
create index if not exists enquiries_customer_idx on public.enquiries (customer_user_id);
alter table public.enquiries enable row level security;
-- Reads: the owner, staff, and vendors who have a group on it. Writes only through functions.
-- (policy defined after chat_groups exists)

-- Anyone (signed in or not) can create an enquiry. Returns the id and a one-time
-- claim token the browser keeps until the customer signs up.
create or replace function public.create_enquiry(
  p_event_type text, p_event_date date, p_city text, p_area text, p_guests integer,
  p_budget_range text, p_services text[], p_style_tags text[], p_notes text, p_customer_name text
) returns table (enquiry_id uuid, claim_token text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_token text := encode(gen_random_bytes(24), 'hex');
  v_id uuid;
begin
  if coalesce(trim(p_event_type), '') = '' then raise exception 'event type is required'; end if;
  if coalesce(array_length(p_services, 1), 0) = 0 then raise exception 'pick at least one service'; end if;
  insert into public.enquiries (customer_user_id, claim_token_hash, event_type, event_date, city, area, guests,
                                budget_range, services, style_tags, notes, customer_name)
  values (auth.uid(), case when auth.uid() is null then encode(digest(v_token, 'sha256'), 'hex') end,
          left(trim(p_event_type), 60), p_event_date, coalesce(nullif(trim(p_city), ''), 'Hyderabad'),
          nullif(left(trim(coalesce(p_area, '')), 80), ''), p_guests, left(p_budget_range, 40),
          coalesce(p_services, '{}'), coalesce(p_style_tags, '{}'), nullif(left(trim(coalesce(p_notes, '')), 2000), ''),
          nullif(left(trim(coalesce(p_customer_name, '')), 80), ''))
  returning id into v_id;
  return query select v_id, case when auth.uid() is null then v_token end;
end $$;

-- After sign-up: attach an anonymous enquiry to the signed-in customer.
create or replace function public.claim_enquiry(p_enquiry_id uuid, p_claim_token text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  update public.enquiries
     set customer_user_id = auth.uid(), claim_token_hash = null
   where id = p_enquiry_id
     and customer_user_id is null
     and claim_token_hash = encode(digest(coalesce(p_claim_token, ''), 'sha256'), 'hex');
  return found or exists (select 1 from public.enquiries where id = p_enquiry_id and customer_user_id = auth.uid());
end $$;

-- ============================================================ chat

create table if not exists public.chat_groups (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  customer_user_id uuid not null references auth.users (id) on delete cascade,
  vendor_id integer not null references public.vendors (vendor_id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  assigned_staff_id uuid references auth.users (id) on delete set null,
  last_message_at timestamptz,
  last_message_sender_role text check (last_message_sender_role in ('customer', 'vendor', 'super_vendor')),
  created_at timestamptz not null default now(),
  unique (enquiry_id, vendor_id)
);
create index if not exists chat_groups_customer_idx on public.chat_groups (customer_user_id);
create index if not exists chat_groups_vendor_idx on public.chat_groups (vendor_id);
create index if not exists chat_groups_last_idx on public.chat_groups (last_message_at);
alter table public.chat_groups enable row level security;

create or replace function public.can_access_group(p_group_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_groups g
    where g.id = p_group_id
      and (g.customer_user_id = auth.uid()
           or g.vendor_id in (select public.my_vendor_ids())
           or public.is_staff()));
$$;

-- Role of the signed-in user inside a group ('customer' | 'vendor' | 'super_vendor' | null).
create or replace function public.my_group_role(p_group_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when g.customer_user_id = auth.uid() then 'customer'
    when g.vendor_id in (select public.my_vendor_ids()) then 'vendor'
    when public.is_staff() then 'super_vendor'
  end
  from public.chat_groups g where g.id = p_group_id;
$$;

drop policy if exists "group members read" on public.chat_groups;
create policy "group members read" on public.chat_groups for select to authenticated
  using (customer_user_id = auth.uid() or vendor_id in (select public.my_vendor_ids()) or public.is_staff());
-- No insert/update/delete policies: groups are created by open_chat_group() and
-- changed by staff functions only.

drop policy if exists "enquiry readers" on public.enquiries;
create policy "enquiry readers" on public.enquiries for select to authenticated
  using (customer_user_id = auth.uid()
         or public.is_staff()
         or exists (select 1 from public.chat_groups g
                    where g.enquiry_id = enquiries.id and g.vendor_id in (select public.my_vendor_ids())));

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id),
  sender_role text not null check (sender_role in ('customer', 'vendor', 'super_vendor', 'system')),
  body text check (body is null or length(body) <= 4000),
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  check (coalesce(length(trim(body)), 0) > 0 or jsonb_array_length(attachments) > 0)
);
create index if not exists chat_messages_group_idx on public.chat_messages (group_id, created_at);
alter table public.chat_messages enable row level security;

drop policy if exists "members read messages" on public.chat_messages;
create policy "members read messages" on public.chat_messages for select to authenticated
  using (public.can_access_group(group_id));
drop policy if exists "members send messages" on public.chat_messages;
create policy "members send messages" on public.chat_messages for insert to authenticated
  with check (sender_user_id = auth.uid()
              and deleted_at is null
              and sender_role = public.my_group_role(group_id));
-- No update/delete policies: nobody can edit or delete a sent message from the
-- browser. Staff hide messages with soft_delete_message(), which is audited.

-- Keeps group "last message" fields current and rate-limits senders.
create or replace function public.on_chat_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.chat_messages
      where sender_user_id = new.sender_user_id and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'You are sending messages too quickly. Please wait a minute.';
  end if;
  if new.sender_role <> 'system' then
    update public.chat_groups
       set last_message_at = new.created_at, last_message_sender_role = new.sender_role
     where id = new.group_id;
  end if;
  return new;
end $$;
drop trigger if exists chat_message_before on public.chat_messages;
create trigger chat_message_before before insert on public.chat_messages
  for each row execute function public.on_chat_message();

create table if not exists public.chat_reads (
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.chat_reads enable row level security;
drop policy if exists "members read receipts" on public.chat_reads;
create policy "members read receipts" on public.chat_reads for select to authenticated
  using (public.can_access_group(group_id));

create or replace function public.mark_group_read(p_group_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_group(p_group_id) then raise exception 'not allowed'; end if;
  insert into public.chat_reads (group_id, user_id, last_read_at) values (p_group_id, auth.uid(), now())
  on conflict (group_id, user_id) do update set last_read_at = excluded.last_read_at;
end $$;

-- Staff opening a group is logged (privacy requirement).
create table if not exists public.staff_access_log (
  id bigint generated always as identity primary key,
  staff_user_id uuid not null references auth.users (id),
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.staff_access_log enable row level security;
drop policy if exists "staff read access log" on public.staff_access_log;
create policy "staff read access log" on public.staff_access_log for select to authenticated using (public.is_staff());

create or replace function public.log_group_open(p_group_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.is_staff() and public.my_group_role(p_group_id) = 'super_vendor' then
    insert into public.staff_access_log (staff_user_id, group_id, action) values (auth.uid(), p_group_id, 'open');
  end if;
end $$;

create or replace function public.soft_delete_message(p_message_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_group uuid;
begin
  if not public.is_staff() then raise exception 'only Super Vendors can remove messages'; end if;
  update public.chat_messages set deleted_at = now(), deleted_by = auth.uid()
   where id = p_message_id and deleted_at is null returning group_id into v_group;
  if v_group is null then raise exception 'message not found'; end if;
  insert into public.staff_access_log (staff_user_id, group_id, action, detail)
  values (auth.uid(), v_group, 'soft_delete', jsonb_build_object('message_id', p_message_id, 'reason', p_reason));
end $$;

-- Create (or reopen) the group for this customer + vendor + enquiry.
create or replace function public.open_chat_group(p_enquiry_id uuid, p_vendor_id integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_group uuid;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if not exists (select 1 from public.enquiries where id = p_enquiry_id and customer_user_id = auth.uid()) then
    raise exception 'enquiry not found';
  end if;
  if not exists (select 1 from public.customer_profiles where user_id = auth.uid()) then
    raise exception 'finish sign-up first';
  end if;
  if not exists (select 1 from public.vendors where vendor_id = p_vendor_id) then
    raise exception 'vendor not found';
  end if;
  insert into public.chat_groups (enquiry_id, customer_user_id, vendor_id)
  values (p_enquiry_id, auth.uid(), p_vendor_id)
  on conflict (enquiry_id, vendor_id) do nothing
  returning id into v_group;
  if v_group is null then
    select id into v_group from public.chat_groups where enquiry_id = p_enquiry_id and vendor_id = p_vendor_id;
  else
    insert into public.chat_messages (group_id, sender_user_id, sender_role, body)
    values (v_group, auth.uid(), 'system', 'Enquiry shared with the vendor. Happy Moments team members are in this group to help.');
  end if;
  return v_group;
end $$;

-- ============================================================ matching

-- Form service keys -> the category names actually used in vendors.categories.
create or replace function public.service_categories(p_service text)
returns text[] language sql immutable as $$
  select case p_service
    when 'decor'       then array['Decorators','Decorations','Decoration','Event Decoration']
    when 'photography' then array['Photography/Videography','Photography and videography']
    when 'makeup'      then array['Makeup Artists','Makeup and hair']
    when 'venue'       then array['Venues','Venue','College Auditorium','College Event Space','Boutique Space']
    when 'gifting'     then array['Return gifts for all occasions','Photo/Fridge Magnet']
    when 'planning'    then array['Event Planners','Event management']
    else array[]::text[] end;
$$;

-- Top matches per requested service. Only real vendors, no padding, no contact details.
-- Hard filters: active, offers the service, in the city, within the budget band and
-- guest limit when the vendor has set them. Ranking: style overlap, area, verified,
-- reply speed, profile completeness.
create or replace function public.match_vendors(
  p_services text[], p_city text, p_area text, p_guests integer, p_budget_range text,
  p_style_tags text[], p_per_service integer default 5
) returns table (
  service text, vendor_id integer, slug text, brand_name text, area_label text,
  categories text[], starting_price integer, good_for text, verified boolean, photos text[], score numeric
) language sql stable security definer set search_path = public as $$
  with req as (select unnest(coalesce(p_services, '{}')) as service),
  speed as (
    -- median minutes from a customer message to the vendor's next reply, per vendor
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

-- ============================================================ call requests

create table if not exists public.call_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  requested_by uuid not null references auth.users (id),
  status text not null default 'pending' check (status in ('pending', 'called', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.call_requests enable row level security;
drop policy if exists "members read call requests" on public.call_requests;
create policy "members read call requests" on public.call_requests for select to authenticated
  using (public.can_access_group(group_id));

create or replace function public.request_call(p_group_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if public.my_group_role(p_group_id) <> 'customer' then raise exception 'only the customer can request a call'; end if;
  select id into v_id from public.call_requests where group_id = p_group_id and status = 'pending';
  if v_id is not null then return v_id; end if;
  insert into public.call_requests (group_id, requested_by) values (p_group_id, auth.uid()) returning id into v_id;
  insert into public.chat_messages (group_id, sender_user_id, sender_role, body)
  values (p_group_id, auth.uid(), 'system', 'The customer asked for a call. The vendor can see their number on the call request.');
  return v_id;
end $$;

create or replace function public.set_call_status(p_request_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_group uuid;
begin
  select group_id into v_group from public.call_requests where id = p_request_id;
  if v_group is null or public.my_group_role(v_group) not in ('vendor', 'super_vendor', 'customer') then raise exception 'not allowed'; end if;
  if p_status not in ('called', 'cancelled') then raise exception 'bad status'; end if;
  update public.call_requests set status = p_status, updated_at = now() where id = p_request_id;
end $$;

-- The vendor (and staff) see the customer's number only through a call request.
create or replace function public.call_request_contact(p_request_id uuid)
returns table (customer_name text, customer_mobile text)
language sql stable security definer set search_path = public as $$
  select p.full_name, p.mobile
  from public.call_requests cr
  join public.chat_groups g on g.id = cr.group_id
  join public.customer_profiles p on p.user_id = g.customer_user_id
  where cr.id = p_request_id
    and public.my_group_role(g.id) in ('vendor', 'super_vendor');
$$;

-- Masked vendor number for customers, e.g. "98XXXXXXXX". Never the full number.
create or replace function public.vendor_masked_phone(p_vendor_id integer)
returns text language sql stable security definer set search_path = public as $$
  select case when length(d) >= 4 then left(d, 2) || repeat('X', length(d) - 2) end
  from (select regexp_replace(coalesce(phone_number, ''), '\D', '', 'g') d from public.vendors where vendor_id = p_vendor_id) x;
$$;

-- Group header for members: enquiry summary plus the other side's display details.
create or replace function public.group_header(p_group_id uuid)
returns table (
  group_id uuid, my_role text, status text, assigned_staff_id uuid, created_at timestamptz,
  event_type text, event_date date, city text, area text, guests integer, budget_range text,
  services text[], style_tags text[], notes text,
  vendor_id integer, vendor_name text, vendor_slug text, vendor_phone_masked text,
  customer_name text, last_message_at timestamptz, last_message_sender_role text
) language sql stable security definer set search_path = public as $$
  select g.id, public.my_group_role(g.id), g.status, g.assigned_staff_id, g.created_at,
         e.event_type, e.event_date, e.city, e.area, e.guests, e.budget_range, e.services, e.style_tags, e.notes,
         v.vendor_id, v.brand_name, v.slug, public.vendor_masked_phone(v.vendor_id),
         coalesce(p.full_name, e.customer_name), g.last_message_at, g.last_message_sender_role
  from public.chat_groups g
  join public.enquiries e on e.id = g.enquiry_id
  join public.vendors v on v.vendor_id = g.vendor_id
  left join public.customer_profiles p on p.user_id = g.customer_user_id
  where g.id = p_group_id and public.can_access_group(g.id);
$$;

-- Groups for the signed-in user (customer or vendor side), newest activity first.
create or replace function public.my_groups()
returns table (group_id uuid, my_role text, event_type text, event_date date, vendor_name text,
               customer_name text, last_message_at timestamptz, last_message_sender_role text, unread boolean)
language sql stable security definer set search_path = public as $$
  select g.id, public.my_group_role(g.id), e.event_type, e.event_date, v.brand_name,
         coalesce(p.full_name, e.customer_name), g.last_message_at, g.last_message_sender_role,
         exists (select 1 from public.chat_messages m
                 where m.group_id = g.id and m.sender_user_id <> auth.uid() and m.deleted_at is null
                   and m.created_at > coalesce((select r.last_read_at from public.chat_reads r
                                                where r.group_id = g.id and r.user_id = auth.uid()), 'epoch'))
  from public.chat_groups g
  join public.enquiries e on e.id = g.enquiry_id
  join public.vendors v on v.vendor_id = g.vendor_id
  left join public.customer_profiles p on p.user_id = g.customer_user_id
  where g.customer_user_id = auth.uid() or g.vendor_id in (select public.my_vendor_ids())
  order by coalesce(g.last_message_at, g.created_at) desc;
$$;

-- ============================================================ Super Vendor dashboard

create table if not exists public.chat_settings (
  key text primary key,
  value integer not null
);
insert into public.chat_settings (key, value) values
  ('vendor_wait_minutes', 120),
  ('customer_wait_minutes', 360)
on conflict (key) do nothing;
alter table public.chat_settings enable row level security;
drop policy if exists "staff read settings" on public.chat_settings;
create policy "staff read settings" on public.chat_settings for select to authenticated using (public.is_staff());

create or replace function public.set_chat_setting(p_key text, p_value integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  if p_key not in ('vendor_wait_minutes', 'customer_wait_minutes') or p_value < 5 then raise exception 'bad setting'; end if;
  update public.chat_settings set value = p_value where key = p_key;
end $$;

create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  sent_by uuid not null references auth.users (id),
  target_role text not null check (target_role in ('vendor', 'customer')),
  channel text not null default 'whatsapp_link',
  created_at timestamptz not null default now()
);
alter table public.nudges enable row level security;
drop policy if exists "staff read nudges" on public.nudges;
create policy "staff read nudges" on public.nudges for select to authenticated using (public.is_staff());

create or replace function public.log_nudge(p_group_id uuid, p_target_role text, p_channel text default 'whatsapp_link')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  insert into public.nudges (group_id, sent_by, target_role, channel)
  values (p_group_id, auth.uid(), p_target_role, coalesce(p_channel, 'whatsapp_link')) returning id into v_id;
  return v_id;
end $$;

create or replace function public.claim_group(p_group_id uuid, p_release boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  update public.chat_groups
     set assigned_staff_id = case when p_release then null else auth.uid() end
   where id = p_group_id
     and (p_release = false and assigned_staff_id is null
          or p_release = true and assigned_staff_id = auth.uid()
          or p_release = false and assigned_staff_id = auth.uid());
  if not found then raise exception 'already claimed by someone else'; end if;
end $$;

-- Everything the dashboard needs, including contact numbers for the reminder
-- links (staff only) and who is waiting on whom.
create or replace function public.staff_group_overview()
returns table (
  group_id uuid, created_at timestamptz, status text,
  customer_name text, customer_mobile text, customer_email text,
  vendor_id integer, vendor_name text, vendor_whatsapp text, vendor_email text,
  event_type text, event_date date,
  last_message_at timestamptz, last_message_sender_role text, minutes_since_last numeric,
  waiting_on text, flagged boolean,
  assigned_staff_id uuid, assigned_staff_name text, last_nudge_at timestamptz, pending_call boolean
) language plpgsql stable security definer set search_path = public as $$
declare
  v_vendor_wait integer := coalesce((select value from public.chat_settings where key = 'vendor_wait_minutes'), 120);
  v_customer_wait integer := coalesce((select value from public.chat_settings where key = 'customer_wait_minutes'), 360);
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  return query
  select g.id, g.created_at, g.status,
         coalesce(p.full_name, e.customer_name), p.mobile, p.email,
         v.vendor_id, v.brand_name, coalesce(nullif(v.whatsapp_number, ''), v.phone_number), v.email,
         e.event_type, e.event_date,
         g.last_message_at, g.last_message_sender_role,
         round(extract(epoch from (now() - coalesce(g.last_message_at, g.created_at))) / 60),
         case when g.last_message_sender_role = 'customer' or g.last_message_sender_role is null then 'vendor'
              when g.last_message_sender_role = 'vendor' then 'customer' end,
         g.status = 'open' and (
           ((g.last_message_sender_role = 'customer' or g.last_message_sender_role is null)
             and now() - coalesce(g.last_message_at, g.created_at) > make_interval(mins => v_vendor_wait))
           or (g.last_message_sender_role = 'vendor'
             and now() - g.last_message_at > make_interval(mins => v_customer_wait))),
         g.assigned_staff_id, s.display_name,
         (select max(n.created_at) from public.nudges n where n.group_id = g.id),
         exists (select 1 from public.call_requests c where c.group_id = g.id and c.status = 'pending')
  from public.chat_groups g
  join public.enquiries e on e.id = g.enquiry_id
  join public.vendors v on v.vendor_id = g.vendor_id
  left join public.customer_profiles p on p.user_id = g.customer_user_id
  left join public.staff_roles s on s.user_id = g.assigned_staff_id
  order by 17 desc, 15 desc nulls last;
end $$;

-- ============================================================ attachments

insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-attachments', 'chat-attachments', false, 10485760)
on conflict (id) do nothing;

-- Files live at <group_id>/<file>; only that group's members can read or upload.
create or replace function public.can_access_group_path(p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_part text := split_part(coalesce(p_name, ''), '/', 1);
begin
  if v_part !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  return public.can_access_group(v_part::uuid);
end $$;

drop policy if exists "chat members read files" on storage.objects;
create policy "chat members read files" on storage.objects for select to authenticated
  using (bucket_id = 'chat-attachments'
         and public.can_access_group_path(name));
drop policy if exists "chat members upload files" on storage.objects;
create policy "chat members upload files" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-attachments'
              and public.can_access_group_path(name));

-- ============================================================ realtime + grants

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chat_groups') then
    alter publication supabase_realtime add table public.chat_groups;
  end if;
end $$;

-- Lock everything down to what the policies and functions allow.
revoke all on public.staff_roles, public.customer_profiles, public.enquiries, public.chat_groups,
              public.chat_messages, public.chat_reads, public.staff_access_log, public.call_requests,
              public.chat_settings, public.nudges from anon;
revoke insert, update, delete on public.staff_roles, public.enquiries, public.chat_groups, public.chat_reads,
              public.staff_access_log, public.call_requests, public.chat_settings, public.nudges from authenticated;
revoke update, delete on public.chat_messages from authenticated;
revoke delete on public.customer_profiles from authenticated;

-- Only this migration's functions are changed here. New functions are executable by
-- anon and authenticated by default in Supabase, so take that away first, then grant.
revoke execute on function
  public.is_staff(), public.my_vendor_ids(), public.can_access_group(uuid), public.can_access_group_path(text),
  public.my_group_role(uuid), public.claim_enquiry(uuid, text), public.open_chat_group(uuid, integer),
  public.mark_group_read(uuid), public.log_group_open(uuid), public.soft_delete_message(uuid, text),
  public.request_call(uuid), public.set_call_status(uuid, text), public.call_request_contact(uuid),
  public.vendor_masked_phone(integer), public.group_header(uuid), public.my_groups(),
  public.set_chat_setting(text, integer), public.log_nudge(uuid, text, text), public.claim_group(uuid, boolean),
  public.staff_group_overview(), public.on_chat_message(),
  public.create_enquiry(text, date, text, text, integer, text, text[], text[], text, text),
  public.match_vendors(text[], text, text, integer, text, text[], integer), public.service_categories(text)
  from public, anon, authenticated;

grant execute on function public.create_enquiry(text, date, text, text, integer, text, text[], text[], text, text) to anon, authenticated;
grant execute on function public.match_vendors(text[], text, text, integer, text, text[], integer) to anon, authenticated;
grant execute on function public.service_categories(text) to anon, authenticated;
grant execute on function
  public.is_staff(), public.my_vendor_ids(), public.can_access_group(uuid), public.can_access_group_path(text),
  public.my_group_role(uuid), public.claim_enquiry(uuid, text), public.open_chat_group(uuid, integer),
  public.mark_group_read(uuid), public.log_group_open(uuid), public.soft_delete_message(uuid, text),
  public.request_call(uuid), public.set_call_status(uuid, text), public.call_request_contact(uuid),
  public.vendor_masked_phone(integer), public.group_header(uuid), public.my_groups(),
  public.set_chat_setting(text, integer), public.log_nudge(uuid, text, text), public.claim_group(uuid, boolean),
  public.staff_group_overview()
  to authenticated;
