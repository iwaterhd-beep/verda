-- Packs de producto: precio fijo con una o varias cantidades.
-- Ejecuta en Supabase → SQL Editor.

alter table public.products
  add column if not exists is_pack boolean not null default false;

create table if not exists public.product_pack_items (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  pack_id     text not null,
  product_id  text not null,
  qty         numeric(10,2) not null check (qty > 0),
  unit        text not null default 'g' check (unit in ('g', 'ud')),
  sort_order  int not null default 0,
  foreign key (club_id, pack_id) references public.products(club_id, id) on delete cascade,
  foreign key (club_id, product_id) references public.products(club_id, id) on delete restrict
);

create index if not exists product_pack_items_pack_idx
  on public.product_pack_items(club_id, pack_id);

-- Snapshot en pedidos (para marcar listo y consumo histórico).
alter table public.order_items
  add column if not exists pack_items jsonb;
alter table public.order_items
  add column if not exists grams_per_pack numeric(10,2);

alter table public.product_pack_items enable row level security;

drop policy if exists "club pack items staff" on public.product_pack_items;
create policy "club pack items staff" on public.product_pack_items
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

drop policy if exists "member read pack items" on public.product_pack_items;
create policy "member read pack items" on public.product_pack_items
  for select to authenticated
  using (club_id = public.my_club_id());
