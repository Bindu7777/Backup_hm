-- Customer accounts with email + password (no email verification: the project
-- auto-confirms sign-ups).
--
-- Guard: vendor access in group chats is granted by matching the login email to
-- vendors.email (my_vendor_ids). Without email verification anyone could create a
-- password account with a vendor's email and read that vendor's chats. So a
-- password account can't be created with, or switched to, a vendor's email.
-- Vendors keep signing in with the emailed sign-in link, which proves the email is theirs.

create or replace function public.guard_vendor_email_accounts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.encrypted_password, '') <> ''
     and coalesce(new.email, '') <> ''
     and (tg_op = 'INSERT' or lower(coalesce(old.email, '')) <> lower(new.email))
     and exists (select 1 from public.vendors v where lower(trim(v.email)) = lower(trim(new.email))) then
    raise exception 'hm_vendor_email: this email belongs to a Happy Moments vendor' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists hm_guard_vendor_email_accounts on auth.users;
create trigger hm_guard_vendor_email_accounts
  before insert or update of email on auth.users
  for each row execute function public.guard_vendor_email_accounts();

-- A customer's history: every card they made, newest first, each with its group
-- chats (vendor, last message, unread). Only the signed-in customer's own cards.
create or replace function public.my_celebrations()
returns table (
  enquiry_id uuid, event_type text, event_date date, city text, area text, guests integer,
  budget_range text, services text[], style_tags text[], created_at timestamptz, chats jsonb
) language sql stable security definer set search_path = public as $$
  select e.id, e.event_type, e.event_date, e.city, e.area, e.guests, e.budget_range, e.services, e.style_tags, e.created_at,
    coalesce((
      select jsonb_agg(jsonb_build_object(
               'group_id', g.id,
               'vendor_name', v.brand_name,
               'last_message_at', g.last_message_at,
               'last_message_sender_role', g.last_message_sender_role,
               'unread', exists (select 1 from public.chat_messages m
                                 where m.group_id = g.id and m.sender_user_id <> auth.uid() and m.deleted_at is null
                                   and m.created_at > coalesce((select r.last_read_at from public.chat_reads r
                                                                where r.group_id = g.id and r.user_id = auth.uid()), 'epoch')))
             order by coalesce(g.last_message_at, g.created_at) desc)
      from public.chat_groups g join public.vendors v on v.vendor_id = g.vendor_id
      where g.enquiry_id = e.id and g.customer_user_id = auth.uid()
    ), '[]'::jsonb)
  from public.enquiries e
  where auth.uid() is not null and e.customer_user_id = auth.uid()
  order by e.created_at desc;
$$;
revoke execute on function public.my_celebrations() from public, anon;
grant execute on function public.my_celebrations() to authenticated;
