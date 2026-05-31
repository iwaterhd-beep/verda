-- ════════════════════════════════════════════════════════════
-- Verda — Farms y genéticas por club
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

create table if not exists public.product_farms (
  id          text not null,
  club_id     uuid not null references public.clubs(id) on delete cascade,
  name        text not null,
  description text,
  photos      text[] not null default '{}',
  video_urls  text[] not null default '{}',
  sort_order  int not null default 0,
  created_at  timestamptz default now(),
  primary key (club_id, id)
);

create index if not exists product_farms_club_id_idx
  on public.product_farms(club_id);

create table if not exists public.farm_genetics (
  id               text not null,
  club_id          uuid not null references public.clubs(id) on delete cascade,
  farm_id          text not null,
  name             text not null,
  description      text,
  photos           text[] not null default '{}',
  video_urls       text[] not null default '{}',
  price_per_unit   numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  genetics         text,
  thc_percent      numeric(5,2),
  origin           text,
  sort_order       int not null default 0,
  created_at       timestamptz default now(),
  primary key (club_id, id),
  foreign key (club_id, farm_id)
    references public.product_farms(club_id, id) on delete cascade
);

create index if not exists farm_genetics_farm_idx
  on public.farm_genetics(club_id, farm_id);

alter table public.products
  add column if not exists farm_id text,
  add column if not exists genetic_id text;

alter table public.product_farms enable row level security;
alter table public.farm_genetics enable row level security;

drop policy if exists "club product farms staff" on public.product_farms;
create policy "club product farms staff" on public.product_farms
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

drop policy if exists "member read product farms" on public.product_farms;
create policy "member read product farms" on public.product_farms
  for select to authenticated
  using (club_id = public.my_club_id());

drop policy if exists "club farm genetics staff" on public.farm_genetics;
create policy "club farm genetics staff" on public.farm_genetics
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

drop policy if exists "member read farm genetics" on public.farm_genetics;
create policy "member read farm genetics" on public.farm_genetics
  for select to authenticated
  using (club_id = public.my_club_id());
