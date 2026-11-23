-- The app validates the scene name itself, so new themes no longer need a database change.
alter table public.profiles drop constraint if exists profiles_background_id_check;
