-- create profile table linked to auth users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_premium boolean default false
);

-- auto create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();