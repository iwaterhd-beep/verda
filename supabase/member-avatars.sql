-- ════════════════════════════════════════════════════════════
-- Verda — Foto de perfil del socio
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

alter table public.members
  add column if not exists avatar_url text;

-- Bucket público: {club_id}/{member_id}/avatar.jpg
insert into storage.buckets (id, name, public)
values ('member-avatars', 'member-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "public read member avatars" on storage.objects;
create policy "public read member avatars"
  on storage.objects for select
  using (bucket_id = 'member-avatars');

drop policy if exists "member upload own avatar" on storage.objects;
create policy "member upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.my_club_id()::text
    and (storage.foldername(name))[2] in (
      select id::text from public.members where user_id = auth.uid()
    )
  );

drop policy if exists "member update own avatar" on storage.objects;
create policy "member update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.my_club_id()::text
    and (storage.foldername(name))[2] in (
      select id::text from public.members where user_id = auth.uid()
    )
  );

drop policy if exists "member delete own avatar" on storage.objects;
create policy "member delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.my_club_id()::text
    and (storage.foldername(name))[2] in (
      select id::text from public.members where user_id = auth.uid()
    )
  );

-- Staff puede subir avatares al aprobar solicitudes
drop policy if exists "staff upload member avatars" on storage.objects;
create policy "staff upload member avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'member-avatars'
    and public.is_staff()
    and (storage.foldername(name))[1] = public.my_club_id()::text
  );

drop policy if exists "staff update member avatars" on storage.objects;
create policy "staff update member avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'member-avatars'
    and public.is_staff()
    and (storage.foldername(name))[1] = public.my_club_id()::text
  );
