-- ════════════════════════════════════════════════════════════
-- Verda — Fotos y vídeo en productos + menú para socios
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists photos text[] not null default '{}',
  add column if not exists video_url text;

-- Socios pueden ver el menú de su club
drop policy if exists "member read club products" on public.products;
create policy "member read club products" on public.products
  for select to authenticated
  using (club_id = public.my_club_id());

-- Bucket público para vídeos de productos
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do update set public = true;

drop policy if exists "public read product media" on storage.objects;
create policy "public read product media"
  on storage.objects for select
  using (bucket_id = 'product-media');
