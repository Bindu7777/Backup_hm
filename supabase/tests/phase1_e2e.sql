-- Phase 1 end-to-end check, run against the real database inside a transaction
-- that is ROLLED BACK at the end, so nothing is kept. Plays four people:
--   a customer, a second customer, the vendor (vendor 476) and a Super Vendor.
-- Any failed check stops the script with "FAIL: ...". Success prints ALL_PASSED.
--
--   npx supabase db query --remote --yes -f supabase/tests/phase1_e2e.sql

begin;

-- ---------- test people (rolled back) ----------
insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e2e-customer@example.test', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e2e-other@example.test', now(), now()),
  ('44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e2e-staff@example.test', now(), now());
insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
  select '33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         lower(trim(email)), now(), now()
  from public.vendors where vendor_id = 476;
insert into public.staff_roles (user_id, role, display_name) values ('44444444-4444-4444-8444-444444444444', 'super_vendor', 'E2E Staff');
select set_config('e2e.vendor_email', (select lower(trim(email)) from public.vendors where vendor_id = 476), true);
select set_config('e2e.vendor_phone', (select regexp_replace(coalesce(phone_number, ''), '\D', '', 'g') from public.vendors where vendor_id = 476), true);

-- ---------- 1. visitor (not signed in) fills the greeting card ----------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select set_config('e2e.enq', enquiry_id::text, true), set_config('e2e.tok', claim_token, true)
from public.create_enquiry('Wedding', (current_date + 60), 'Hyderabad', 'Madhapur', 250, '3l_5l',
                           array['makeup', 'decor'], array['traditional'], 'Evening reception', 'E2E Customer');

do $$ begin
  if current_setting('e2e.tok', true) is null or length(current_setting('e2e.tok')) < 20 then raise exception 'FAIL 1a: anonymous enquiry got no claim token'; end if;
  if (select count(*) from public.match_vendors(array['makeup'], 'Hyderabad', 'Madhapur', 250, '3l_5l', array['traditional'], 5)) = 0 then
    raise exception 'FAIL 1b: no makeup matches'; end if;
  if (select count(*) from public.match_vendors(array['makeup'], 'Hyderabad', null, null, null, null, 5)) > 5 then
    raise exception 'FAIL 1c: more than 5 matches per service'; end if;
end $$;

do $$ declare failed boolean := false; begin
  begin perform 1 from public.enquiries limit 1; exception when others then failed := true; end;
  if not failed then raise exception 'FAIL 1d: a visitor can read enquiries'; end if;
end $$;
do $$ declare failed boolean := false; begin
  begin perform public.open_chat_group(current_setting('e2e.enq')::uuid, 476); exception when others then failed := true; end;
  if not failed then raise exception 'FAIL 1e: a visitor could open a chat without signing up'; end if;
end $$;

-- ---------- 2. customer signs up, enquiry attaches, Request quote opens a group ----------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111","email":"e2e-customer@example.test"}', true);

do $$ declare failed boolean := false; begin
  begin perform public.open_chat_group(current_setting('e2e.enq')::uuid, 476); exception when others then failed := true; end;
  if not failed then raise exception 'FAIL 2a: chat opened before the enquiry was claimed / profile saved'; end if;
end $$;

insert into public.customer_profiles (user_id, full_name, mobile, email)
values ('11111111-1111-4111-8111-111111111111', 'E2E Customer', '9876543210', 'e2e-customer@example.test');

do $$ begin
  if not public.claim_enquiry(current_setting('e2e.enq')::uuid, current_setting('e2e.tok')) then raise exception 'FAIL 2b: claim failed'; end if;
end $$;

select set_config('e2e.group', public.open_chat_group(current_setting('e2e.enq')::uuid, 476)::text, true);

do $$ declare h record; begin
  if public.open_chat_group(current_setting('e2e.enq')::uuid, 476)::text <> current_setting('e2e.group') then
    raise exception 'FAIL 2c: a second Request quote created a duplicate group'; end if;
  if public.my_group_role(current_setting('e2e.group')::uuid) <> 'customer' then raise exception 'FAIL 2d: customer role wrong'; end if;
  select * into h from public.group_header(current_setting('e2e.group')::uuid);
  if h.event_type <> 'Wedding' or h.guests <> 250 then raise exception 'FAIL 2e: enquiry summary missing from group header'; end if;
  if h.vendor_phone_masked is not null and length(current_setting('e2e.vendor_phone')) >= 4
     and (h.vendor_phone_masked = current_setting('e2e.vendor_phone') or h.vendor_phone_masked !~ 'X') then
    raise exception 'FAIL 2f: vendor phone not masked for the customer'; end if;
end $$;

insert into public.chat_messages (group_id, sender_user_id, sender_role, body)
values (current_setting('e2e.group')::uuid, '11111111-1111-4111-8111-111111111111', 'customer', 'Hi! Can you share a quote for bridal makeup?');

do $$ declare failed boolean := false; begin
  begin update public.chat_messages set body = 'edited' where group_id = current_setting('e2e.group')::uuid; exception when others then failed := true; end;
  if not failed and exists (select 1 from public.chat_messages where body = 'edited') then raise exception 'FAIL 2g: customer edited a sent message'; end if;
end $$;
do $$ declare failed boolean := false; begin
  begin delete from public.chat_messages where group_id = current_setting('e2e.group')::uuid; exception when others then failed := true; end;
  if not failed and not exists (select 1 from public.chat_messages where group_id = current_setting('e2e.group')::uuid and sender_role = 'customer') then
    raise exception 'FAIL 2h: customer deleted a sent message'; end if;
end $$;
do $$ declare failed boolean := false; begin
  begin
    insert into public.chat_messages (group_id, sender_user_id, sender_role, body)
    values (current_setting('e2e.group')::uuid, '11111111-1111-4111-8111-111111111111', 'vendor', 'pretending to be the vendor');
  exception when others then failed := true; end;
  if not failed then raise exception 'FAIL 2i: customer posted as the vendor'; end if;
end $$;
do $$ declare failed boolean := false; begin
  begin perform * from public.staff_group_overview(); exception when others then failed := true; end;
  if not failed then raise exception 'FAIL 2j: customer opened the Super Vendor dashboard'; end if;
end $$;

select public.request_call(current_setting('e2e.group')::uuid);

do $$ begin
  if (select count(*) from public.chat_email_targets(current_setting('e2e.group')::uuid, 'message')) <> 1 then
    raise exception 'FAIL 2k: new message did not target the vendor email'; end if;
  if (select count(*) from public.chat_email_targets(current_setting('e2e.group')::uuid, 'message')) <> 0 then
    raise exception 'FAIL 2l: second email within 30 minutes was not throttled'; end if;
end $$;

-- ---------- 3. another customer can't see any of it ----------
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"22222222-2222-4222-8222-222222222222","email":"e2e-other@example.test"}', true);
do $$ declare failed boolean := false; begin
  if exists (select 1 from public.chat_groups where id = current_setting('e2e.group')::uuid) then raise exception 'FAIL 3a: other customer sees the group'; end if;
  if exists (select 1 from public.chat_messages where group_id = current_setting('e2e.group')::uuid) then raise exception 'FAIL 3b: other customer reads the messages'; end if;
  if exists (select 1 from public.enquiries where id = current_setting('e2e.enq')::uuid) then raise exception 'FAIL 3c: other customer reads the enquiry'; end if;
  if exists (select 1 from public.group_header(current_setting('e2e.group')::uuid)) then raise exception 'FAIL 3d: other customer gets the group header'; end if;
  if exists (select 1 from public.customer_profiles where user_id = '11111111-1111-4111-8111-111111111111') then raise exception 'FAIL 3e: other customer reads the first customer''s phone'; end if;
  begin
    insert into public.chat_messages (group_id, sender_user_id, sender_role, body)
    values (current_setting('e2e.group')::uuid, '22222222-2222-4222-8222-222222222222', 'customer', 'intruder');
  exception when others then failed := true; end;
  if not failed then raise exception 'FAIL 3f: other customer posted into the group'; end if;
end $$;

-- ---------- 4. the customer has waited 3 hours: Super Vendor sees a flag and nudges ----------
reset role;
update public.chat_groups set last_message_at = now() - interval '3 hours' where id = current_setting('e2e.group')::uuid;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"44444444-4444-4444-8444-444444444444","email":"e2e-staff@example.test"}', true);

do $$ declare r record; begin
  select * into r from public.staff_group_overview() o where o.group_id = current_setting('e2e.group')::uuid;
  if r.group_id is null then raise exception 'FAIL 4a: Super Vendor does not see the group'; end if;
  if not r.flagged or r.waiting_on <> 'vendor' then raise exception 'FAIL 4b: 3h without a vendor reply is not flagged (flagged=%, waiting_on=%)', r.flagged, r.waiting_on; end if;
  if r.vendor_whatsapp is null and r.vendor_email is null then raise exception 'FAIL 4c: no vendor contact for the reminder link'; end if;
  if not r.pending_call then raise exception 'FAIL 4d: call request not shown'; end if;
  if public.my_group_role(current_setting('e2e.group')::uuid) <> 'super_vendor' then raise exception 'FAIL 4e: staff role wrong'; end if;
  if (select count(*) from public.chat_messages where group_id = current_setting('e2e.group')::uuid) < 2 then raise exception 'FAIL 4f: staff cannot read the messages'; end if;
end $$;

select public.claim_group(current_setting('e2e.group')::uuid);
select public.log_nudge(current_setting('e2e.group')::uuid, 'vendor', 'whatsapp_link');
select public.log_group_open(current_setting('e2e.group')::uuid);

do $$ declare r record; begin
  select * into r from public.staff_group_overview() o where o.group_id = current_setting('e2e.group')::uuid;
  if r.assigned_staff_id <> '44444444-4444-4444-8444-444444444444' then raise exception 'FAIL 4g: claim not recorded'; end if;
  if r.last_nudge_at is null then raise exception 'FAIL 4h: nudge not logged'; end if;
  if not exists (select 1 from public.staff_access_log where group_id = current_setting('e2e.group')::uuid and action = 'open') then
    raise exception 'FAIL 4i: staff access not logged'; end if;
end $$;

-- ---------- 5. the vendor signs in with their profile email and replies ----------
select set_config('request.jwt.claims',
  json_build_object('role', 'authenticated', 'sub', '33333333-3333-4333-8333-333333333333', 'email', current_setting('e2e.vendor_email'))::text, true);

do $$ declare c record; begin
  if public.my_group_role(current_setting('e2e.group')::uuid) <> 'vendor' then raise exception 'FAIL 5a: vendor not recognised from their email'; end if;
  if not exists (select 1 from public.enquiries where id = current_setting('e2e.enq')::uuid) then raise exception 'FAIL 5b: vendor cannot read the enquiry'; end if;
  if exists (select 1 from public.customer_profiles) then raise exception 'FAIL 5c: vendor reads customer profiles directly'; end if;
  select * into c from public.call_request_contact((select id from public.call_requests where group_id = current_setting('e2e.group')::uuid limit 1));
  if c.customer_mobile <> '9876543210' then raise exception 'FAIL 5d: vendor did not get the number through the call request'; end if;
  if exists (select 1 from public.staff_group_overview()) then raise exception 'FAIL 5e: vendor opened the dashboard'; end if;
exception when insufficient_privilege or raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  -- staff_group_overview() refusing the vendor is the expected outcome for 5e
end $$;

insert into public.chat_messages (group_id, sender_user_id, sender_role, body)
values (current_setting('e2e.group')::uuid, '33333333-3333-4333-8333-333333333333', 'vendor', 'Hello! Sharing our bridal package shortly.');

do $$ declare failed boolean := false; begin
  begin perform public.soft_delete_message((select id from public.chat_messages where group_id = current_setting('e2e.group')::uuid and sender_role = 'customer' limit 1), 'test');
  exception when others then failed := true; end;
  if not failed then raise exception 'FAIL 5f: vendor removed a message'; end if;
end $$;

-- ---------- 6. back to the Super Vendor: flag cleared, now waiting on the customer ----------
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"44444444-4444-4444-8444-444444444444","email":"e2e-staff@example.test"}', true);
do $$ declare r record; begin
  select * into r from public.staff_group_overview() o where o.group_id = current_setting('e2e.group')::uuid;
  if r.flagged or r.waiting_on <> 'customer' or r.last_message_sender_role <> 'vendor' then
    raise exception 'FAIL 6a: after the vendor replied: flagged=%, waiting_on=%, last=%', r.flagged, r.waiting_on, r.last_message_sender_role; end if;
end $$;
select public.soft_delete_message((select id from public.chat_messages where group_id = current_setting('e2e.group')::uuid and sender_role = 'vendor' limit 1), 'e2e check');
do $$ begin
  if not exists (select 1 from public.staff_access_log where action = 'soft_delete' and group_id = current_setting('e2e.group')::uuid) then
    raise exception 'FAIL 6b: removal not audited'; end if;
end $$;

reset role;
select 'ALL_PASSED' as result;
rollback;
