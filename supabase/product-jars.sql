-- ════════════════════════════════════════════════════════════
-- Verda — Jars e ítems por club
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

create table if not exists public.product_jars (
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

create index if not exists product_jars_club_id_idx
  on public.product_jars(club_id);

create table if not exists public.jar_items (
  id               text not null,
  club_id          uuid not null references public.clubs(id) on delete cascade,
  jar_id           text not null,
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
  foreign key (club_id, jar_id)
    references public.product_jars(club_id, id) on delete cascade
);

create index if not exists jar_items_jar_idx
  on public.jar_items(club_id, jar_id);

alter table public.products
  add column if not exists jar_id text,
  add column if not exists jar_item_id text;

alter table public.product_jars enable row level security;
alter table public.jar_items enable row level security;

drop policy if exists "club product jars staff" on public.product_jars;
create policy "club product jars staff" on public.product_jars
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

drop policy if exists "member read product jars" on public.product_jars;
create policy "member read product jars" on public.product_jars
  for select to authenticated
  using (club_id = public.my_club_id());

drop policy if exists "club jar items staff" on public.jar_items;
create policy "club jar items staff" on public.jar_items
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

drop policy if exists "member read jar items" on public.jar_items;
create policy "member read jar items" on public.jar_items
  for select to authenticated
  using (club_id = public.my_club_id());

drop policy if exists "member read product jars via member" on public.product_jars;
create policy "member read product jars via member" on public.product_jars
  for select to authenticated
  using (
    club_id in (
      select club_id from public.members where user_id = auth.uid()
    )
  );

drop policy if exists "member read jar items via member" on public.jar_items;
create policy "member read jar items via member" on public.jar_items
  for select to authenticated
  using (
    club_id in (
      select club_id from public.members where user_id = auth.uid()
    )
  );

grant select on public.product_jars to authenticated;
grant select on public.jar_items to authenticated;
