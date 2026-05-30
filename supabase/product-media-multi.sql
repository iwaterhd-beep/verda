-- ════════════════════════════════════════════════════════════
-- Verda — Varios vídeos por producto
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists video_urls text[] not null default '{}';

update public.products
set video_urls = array[video_url]
where coalesce(video_url, '') <> ''
  and (video_urls is null or video_urls = '{}');
