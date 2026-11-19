-- Email notifications for group chats. The backend calls chat_email_targets() with
-- the sender's own sign-in token (no service role key), so the database decides who
-- may trigger emails and to whom. At most one "new message" email per recipient per
-- group every 30 minutes; a new enquiry always emails the vendor.

create table if not exists public.chat_email_log (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  recipient_role text not null,
  kind text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_email_log_idx on public.chat_email_log (group_id, recipient_role, created_at);
alter table public.chat_email_log enable row level security;
revoke all on public.chat_email_log from anon, authenticated;

create or replace function public.chat_email_targets(p_group_id uuid, p_kind text)
returns table (
  recipient_role text, recipient_email text, recipient_name text,
  event_type text, event_date date, vendor_name text, customer_name text
) language plpgsql security definer set search_path = public as $$
declare
  v_role text := public.my_group_role(p_group_id);
  v_last text;
  v_targets text[];
  t text;
begin
  if v_role is null then raise exception 'not allowed'; end if;
  if p_kind not in ('new_group', 'message') then raise exception 'bad kind'; end if;

  select g.last_message_sender_role into v_last from public.chat_groups g where g.id = p_group_id;

  if p_kind = 'new_group' then
    if v_role <> 'customer' then raise exception 'not allowed'; end if;
    v_targets := array['vendor'];
  elsif v_role = 'customer' then v_targets := array['vendor'];
  elsif v_role = 'vendor' then v_targets := array['customer'];
  else v_targets := array['vendor', 'customer'];
  end if;

  foreach t in array v_targets loop
    if p_kind = 'message' and exists (
      select 1 from public.chat_email_log l
      where l.group_id = p_group_id and l.recipient_role = t and l.created_at > now() - interval '30 minutes') then
      continue;
    end if;
    if p_kind = 'new_group' and exists (
      select 1 from public.chat_email_log l where l.group_id = p_group_id and l.kind = 'new_group') then
      continue;
    end if;

    return query
      select t,
             case when t = 'vendor' then nullif(trim(v.email), '') else coalesce(nullif(trim(p.email), ''), u.email) end,
             case when t = 'vendor' then v.brand_name else coalesce(p.full_name, e.customer_name) end,
             e.event_type, e.event_date, v.brand_name, coalesce(p.full_name, e.customer_name)
      from public.chat_groups g
      join public.enquiries e on e.id = g.enquiry_id
      join public.vendors v on v.vendor_id = g.vendor_id
      left join public.customer_profiles p on p.user_id = g.customer_user_id
      left join auth.users u on u.id = g.customer_user_id
      where g.id = p_group_id;

    insert into public.chat_email_log (group_id, recipient_role, kind) values (p_group_id, t, p_kind);
  end loop;
end $$;

revoke execute on function public.chat_email_targets(uuid, text) from public, anon;
grant execute on function public.chat_email_targets(uuid, text) to authenticated;
