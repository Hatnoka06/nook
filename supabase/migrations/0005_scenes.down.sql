update public.profiles set background_id = 'alpine' where background_id not in ('alpine','plain');
alter table public.profiles drop constraint if exists profiles_background_id_check;
alter table public.profiles add constraint profiles_background_id_check check (background_id in ('alpine','plain'));
