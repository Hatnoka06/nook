-- Allow the ten themed scenes as a background choice.
alter table public.profiles drop constraint if exists profiles_background_id_check;
alter table public.profiles add constraint profiles_background_id_check
  check (background_id in ('plain','alpine','autumn','forest','cosmos','sakura','ocean','desert','lavender','arctic','ink'));
