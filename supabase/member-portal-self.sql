-- Portal socio: leer su propia solicitud de alta (documentos subidos).
-- Ejecuta en Supabase → SQL Editor.

drop policy if exists "member read own application" on public.member_applications;
create policy "member read own application" on public.member_applications
  for select to authenticated
  using (
    club_id = public.my_club_id()
    and lower(trim(email)) in (
      select lower(trim(email))
      from public.members
      where user_id = auth.uid()
        and email is not null
    )
  );
