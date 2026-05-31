
-- ════════════════════════════════════════════════════════════
-- Verda — Categorías de producto por club
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

create table if not exists public.product_categories (
  id          text not null,
  club_id     uuid not null references public.clubs(id) on delete cascade,
  label       text not null,
  emoji       text not null default '✨',
  sort_order  int not null default 0,
  is_cannabis boolean not null default false,
  color       text,
  created_at  timestamptz default now(),
  primary key (club_id, id)
);

create index if not exists product_categories_club_id_idx
  on public.product_categories(club_id);

alter table public.product_categories enable row level security;

drop policy if exists "club product categories staff" on public.product_categories;
create policy "club product categories staff" on public.product_categories
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

drop policy if exists "member read product categories" on public.product_categories;
create policy "member read product categories" on public.product_categories
  for select to authenticated
  using (club_id = public.my_club_id());
