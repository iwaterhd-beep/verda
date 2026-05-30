-- ════════════════════════════════════════════════════════════
-- Verda — Ficha de flor / extracto / hash en productos
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists grower text,
  add column if not exists extractor text,
  add column if not exists thc_percent numeric(5,2),
  add column if not exists genetics text,
  add column if not exists origin text,
  add column if not exists description text;
