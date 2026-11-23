-- Newer Supabase projects do not auto-grant new tables to API roles. RLS still limits every row to its owner.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;
-- anon (not signed in) gets nothing.
revoke all on all tables in schema public from anon;
