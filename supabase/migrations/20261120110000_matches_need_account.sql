-- Vendor matches are for signed-in customers only: a free account is needed to
-- see them. The page asks people to sign up or sign in first; this makes the
-- database refuse anonymous calls too.
revoke execute on function public.match_vendors(text[], text, text, integer, text, text[], integer) from anon, public;
grant execute on function public.match_vendors(text[], text, text, integer, text, text[], integer) to authenticated;
