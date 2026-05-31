-- Permite eliminar productos que forman parte de packs (quita la línea del pack).
-- Supabase → SQL Editor → Run

alter table public.product_pack_items
  drop constraint if exists product_pack_items_club_id_product_id_fkey;

alter table public.product_pack_items
  add constraint product_pack_items_club_id_product_id_fkey
  foreign key (club_id, product_id)
  references public.products(club_id, id)
  on delete cascade;
