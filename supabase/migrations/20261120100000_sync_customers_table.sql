-- New customer accounts (Supabase Auth + customer_profiles) also appear in the
-- site's existing customers table, which the header login, liked/contacted
-- vendors and the admin screens use.
--
-- The password is NOT copied: customers.password_hash holds base64 (not a hash)
-- and the table is readable by anyone. New accounts get a placeholder that can
-- never equal base64 output ('!' is not a base64 character), and the header login
-- checks these accounts through Supabase Auth instead.

create or replace function public.sync_customer_from_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(coalesce(new.email, (select email from auth.users where id = new.user_id))));
begin
  if coalesce(v_email, '') = '' then return new; end if;
  update public.customers
     set full_name = new.full_name,
         mobile_number = new.mobile,
         status = 'verified',
         updated_at = now()
   where lower(email) = v_email;
  if not found then
    insert into public.customers (full_name, email, password_hash, mobile_number, status)
    values (new.full_name, v_email, '!supabase-auth', new.mobile, 'verified');
  end if;
  return new;
end $$;

drop trigger if exists hm_sync_customer_from_profile on public.customer_profiles;
create trigger hm_sync_customer_from_profile
  after insert or update of full_name, mobile, email on public.customer_profiles
  for each row execute function public.sync_customer_from_profile();

-- Backfill accounts created before this trigger existed.
update public.customer_profiles set email = email;
