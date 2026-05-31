-- ════════════════════════════════════════════════════════════
-- Verda — Productos ocultos al portal de socios
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists hidden_from_members boolean not null default false;

drop policy if exists "member read club products" on public.products;
create policy "member read club products" on public.products
  for select to authenticated
  using (
    club_id = public.my_club_id()
    and not coalesce(hidden_from_members, false)
  );
