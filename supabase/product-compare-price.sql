-- ════════════════════════════════════════════════════════════
-- Verda — Precio tachado (oferta) en productos
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists compare_at_price numeric(10,2);
