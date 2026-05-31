-- ════════════════════════════════════════════════════════════
-- Verda — Esquema Supabase (PostgreSQL)
-- Ejecuta este script en: Supabase → SQL Editor → New query → Run
-- Crea tablas, seguridad por filas (RLS) y el trigger de alta de usuario.
-- ════════════════════════════════════════════════════════════

-- ─── Tipos ──────────────────────────────────────────────────
do $$ begin
  create type role as enum ('SUPER_ADMIN','CLUB_ADMIN','EMPLOYEE','MEMBER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type membership_status as enum ('ACTIVE','PENDING','EXPIRED','SUSPENDED','BLOCKED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('PENDING','APPROVED','REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('PREPARING','READY','COMPLETED','CANCELLED');
exception when duplicate_object then null; end $$;

-- ─── Clubs (tenants) ────────────────────────────────────────
create table if not exists public.clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  city        text,
  brand_color text default '#22c55e',
  plan        text default 'PRO',
  created_at  timestamptz default now()
);

-- ─── Perfiles (1:1 con auth.users) ──────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  club_id    uuid references public.clubs(id) on delete set null,
  name       text,
  email      text,
  role       role default 'CLUB_ADMIN',
  created_at timestamptz default now()
);

-- ─── Socios ─────────────────────────────────────────────────
create table if not exists public.members (
  id                 uuid primary key default gen_random_uuid(),
  club_id            uuid references public.clubs(id) on delete cascade,
  user_id            uuid references auth.users(id) on delete set null,
  full_name          text not null,
  email              text,
  phone              text,
  document_id        text,
  birth_date         date,
  locality           text,
  address            text,
  status             membership_status default 'PENDING',
  plan               text default 'BASIC',
  qr_code            text unique,
  wallet_balance     numeric(10,2) default 0,
  consumption_limit  int default 40,
  consumed_this_month numeric(10,2) default 0,
  age_verified       boolean default false,
  joined_at          date default current_date,
  expires_at         date,
  created_at         timestamptz default now()
);

-- Migración: añade user_id si la tabla members ya existía.
alter table public.members
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- ─── Solicitudes de alta ────────────────────────────────────
create table if not exists public.member_applications (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid references public.clubs(id) on delete cascade,
  full_name       text not null,
  document_id     text,
  birth_date      date,
  locality        text,
  address         text,
  phone           text,
  email           text,
  face_photo      text,
  dni_front       text,
  dni_back        text,
  status          application_status default 'PENDING',
  rejection_reason text,
  submitted_at    timestamptz default now(),
  reviewed_at     timestamptz
);

-- ─── Movimientos de cartera ─────────────────────────────────
create table if not exists public.wallet_movements (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid references public.members(id) on delete cascade,
  amount        numeric(10,2) not null,
  type          text not null,
  reason        text,
  balance_after numeric(10,2),
  created_at    timestamptz default now()
);

-- ─── Pedidos (portal socios) ────────────────────────────────
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  club_id        uuid references public.clubs(id) on delete cascade,
  member_id      uuid references public.members(id) on delete cascade,
  code           text not null unique,
  total          numeric(10,2) not null,
  grams          numeric(10,2) default 0,
  payment_method text not null,
  status         order_status default 'PREPARING',
  created_at     timestamptz default now()
);

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid references public.orders(id) on delete cascade,
  product_id     text not null,
  name           text not null,
  category       text not null,
  unit           text not null,
  price_per_unit numeric(10,2) not null,
  qty            numeric(10,2) not null,
  actual_qty     numeric(10,2)
);

-- Migración: peso real servido y cantidades decimales.
alter table public.order_items
  alter column qty type numeric(10,2) using qty::numeric(10,2);
alter table public.order_items
  add column if not exists actual_qty numeric(10,2);

-- ─── Inventario (productos por club) ────────────────────────
create table if not exists public.products (
  id                   text not null,
  club_id              uuid not null references public.clubs(id) on delete cascade,
  name                 text not null,
  category             text not null default 'FLOR',
  sku                  text,
  stock                numeric(10,2) not null default 0,
  unit                 text not null default 'g',
  low_stock_threshold  numeric(10,2) not null default 10,
  price_per_unit       numeric(10,2) not null default 0,
  compare_at_price     numeric(10,2),
  batch                text,
  expires_at           date,
  photos               text[] not null default '{}',
  video_url            text,
  video_urls           text[] not null default '{}',
  grower               text,
  extractor            text,
  thc_percent          numeric(5,2),
  genetics             text,
  origin               text,
  description          text,
  hidden_from_members  boolean not null default false,
  created_at           timestamptz default now(),
  primary key (club_id, id)
);

create index if not exists products_club_id_idx on public.products(club_id);

-- ─── Categorías de producto por club ────────────────────────
create table if not exists public.product_categories (
  id          text not null,
  club_id     uuid not null references public.clubs(id) on delete cascade,
  label       text not null,
  emoji       text not null default '✨',
  sort_order  int not null default 0,
  is_cannabis boolean not null default false,
  created_at  timestamptz default now(),
  primary key (club_id, id)
);

create index if not exists product_categories_club_id_idx
  on public.product_categories(club_id);

create index if not exists orders_member_id_idx on public.orders(member_id);
create index if not exists orders_club_id_idx on public.orders(club_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- ════════════════════════════════════════════════════════════
-- Trigger: al registrarse un usuario, crea su club y su perfil
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
  -- Super admin de plataforma: perfil sin club.
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

  -- Alta de SOCIO (creada por el staff): se une a un club existente, sin crear club.
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

  -- Alta de ADMIN de club: crea su club y su perfil.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════
alter table public.clubs               enable row level security;
alter table public.profiles            enable row level security;
alter table public.members             enable row level security;
alter table public.member_applications enable row level security;
alter table public.wallet_movements    enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.products            enable row level security;
alter table public.product_categories  enable row level security;

-- Helper: club_id del usuario autenticado
create or replace function public.my_club_id()
returns uuid language sql stable security definer set search_path = public as $$
  select club_id from public.profiles where id = auth.uid()
$$;

-- Helper: rol del usuario autenticado
create or replace function public.my_role()
returns role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Helper: ¿es staff (no socio)?
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() <> 'MEMBER', false)
$$;

-- Helper: ¿es super admin de plataforma?
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'SUPER_ADMIN'::role, false)
$$;

-- Perfil propio (+ super admin lee todos)
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "super admin profiles" on public.profiles;
create policy "super admin profiles" on public.profiles
  for select to authenticated
  using (public.is_super_admin());

-- Club propio (+ super admin ve todos)
drop policy if exists "own club" on public.clubs;
create policy "own club" on public.clubs
  for all using (id = public.my_club_id() or public.is_super_admin())
  with check (id = public.my_club_id() or public.is_super_admin());

-- Socios del club: el STAFF gestiona todos los del club.
drop policy if exists "club members" on public.members;
create policy "club members" on public.members
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

-- Cada SOCIO puede leer su propia ficha.
drop policy if exists "member self" on public.members;
create policy "member self" on public.members
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "super admin members" on public.members;
create policy "super admin members" on public.members
  for select to authenticated
  using (public.is_super_admin());

-- Cartera: el STAFF gestiona la de los socios de su club.
drop policy if exists "club wallet" on public.wallet_movements;
create policy "club wallet" on public.wallet_movements
  for all using (
    public.is_staff()
    and member_id in (select id from public.members where club_id = public.my_club_id())
  );

-- Cada SOCIO puede leer sus propios movimientos de cartera.
drop policy if exists "member wallet self" on public.wallet_movements;
create policy "member wallet self" on public.wallet_movements
  for select to authenticated
  using (
    member_id in (select id from public.members where user_id = auth.uid())
  );

-- Solicitudes: cualquiera puede CREAR (alta pública); el staff del club las gestiona
drop policy if exists "public can apply" on public.member_applications;
create policy "public can apply" on public.member_applications
  for insert with check (true);

-- Solo usuarios autenticados (staff) pueden leer/gestionar solicitudes.
-- Ven las de su club y las aún sin asignar (alta pública).
drop policy if exists "club reviews applications" on public.member_applications;
create policy "club reviews applications" on public.member_applications
  for select to authenticated
  using (public.is_staff() and (club_id = public.my_club_id() or club_id is null));

drop policy if exists "club updates applications" on public.member_applications;
create policy "club updates applications" on public.member_applications
  for update to authenticated
  using (public.is_staff() and (club_id = public.my_club_id() or club_id is null));

-- Pedidos: el staff gestiona los del club; cada socio lee los suyos.
drop policy if exists "club orders" on public.orders;
create policy "club orders" on public.orders
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

drop policy if exists "member orders self" on public.orders;
create policy "member orders self" on public.orders
  for select to authenticated
  using (
    member_id in (select id from public.members where user_id = auth.uid())
  );

drop policy if exists "super admin orders" on public.orders;
create policy "super admin orders" on public.orders
  for select to authenticated
  using (public.is_super_admin());

drop policy if exists "club order items" on public.order_items;
create policy "club order items" on public.order_items
  for all using (
    public.is_staff()
    and order_id in (
      select id from public.orders where club_id = public.my_club_id()
    )
  );

drop policy if exists "member order items self" on public.order_items;
create policy "member order items self" on public.order_items
  for select to authenticated
  using (
    order_id in (
      select o.id from public.orders o
      join public.members m on m.id = o.member_id
      where m.user_id = auth.uid()
    )
  );

-- Inventario: el staff gestiona los productos de su club.
drop policy if exists "club products" on public.products;
create policy "club products" on public.products
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

drop policy if exists "member read club products" on public.products;
create policy "member read club products" on public.products
  for select to authenticated
  using (
    club_id = public.my_club_id()
    and not coalesce(hidden_from_members, false)
  );

drop policy if exists "club product categories staff" on public.product_categories;
create policy "club product categories staff" on public.product_categories
  for all using (club_id = public.my_club_id() and public.is_staff())
  with check (club_id = public.my_club_id() and public.is_staff());

drop policy if exists "member read product categories" on public.product_categories;
create policy "member read product categories" on public.product_categories
  for select to authenticated
  using (club_id = public.my_club_id());
