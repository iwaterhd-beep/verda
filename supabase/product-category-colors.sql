-- ════════════════════════════════════════════════════════════
-- Verda — Color por categoría de producto
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

alter table public.product_categories
  add column if not exists color text;
