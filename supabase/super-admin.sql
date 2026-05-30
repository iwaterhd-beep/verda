-- ════════════════════════════════════════════════════════════
-- Verda — Migración: Super Admin (ejecutar si ya tienes el esquema base)
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_club_id uuid;
  meta_role text := new.raw_user_meta_data->>'role';
  meta_club uuid := nullif(new.raw_user_meta_data->>'club_id', '')::uuid;
begin
  if meta_role = 'SUPER_ADMIN' then
    insert into public.profiles (id, club_id, name, email, role)
    values (
      new.id,
      null,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.email,
      'SUPER_ADMIN'
    );
    return new;
  end if;

  if meta_role = 'MEMBER' and meta_club is not null then
    insert into public.profiles (id, club_id, name, email, role)
    values (
      new.id,
      meta_club,
      new.raw_user_meta_data->>'name',
      new.email,
      'MEMBER'
    );
    return new;
  end if;

  insert into public.clubs (name)
  values (coalesce(new.raw_user_meta_data->>'club', 'Mi club'))
  returning id into new_club_id;

  insert into public.profiles (id, club_id, name, email, role)
  values (
    new.id,
    new_club_id,
    new.raw_user_meta_data->>'name',
    new.email,
    'CLUB_ADMIN'
  );
  return new;
end;
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'SUPER_ADMIN'::role, false)
$$;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "super admin profiles" on public.profiles;
create policy "super admin profiles" on public.profiles
  for select to authenticated
  using (public.is_super_admin());

drop policy if exists "own club" on public.clubs;
create policy "own club" on public.clubs
  for all using (id = public.my_club_id() or public.is_super_admin())
  with check (id = public.my_club_id() or public.is_super_admin());

drop policy if exists "super admin members" on public.members;
create policy "super admin members" on public.members
  for select to authenticated
  using (public.is_super_admin());

drop policy if exists "super admin orders" on public.orders;
create policy "super admin orders" on public.orders
  for select to authenticated
  using (public.is_super_admin());

-- Promover tu cuenta (cambia el email):
-- update public.profiles set role = 'SUPER_ADMIN', club_id = null where email = 'tu@email.com';
