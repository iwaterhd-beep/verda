-- ════════════════════════════════════════════════════════════
-- Verda — Cartera cripto del club (pagos CRYPTO)
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

alter table public.clubs
  add column if not exists crypto_wallet_address text,
  add column if not exists crypto_wallet_network text;

-- Socios pueden leer datos básicos de su club (p. ej. cartera cripto en checkout)
drop policy if exists "member read own club" on public.clubs;
create policy "member read own club" on public.clubs
  for select to authenticated
  using (
    id = public.my_club_id()
    or id in (
      select club_id from public.members where user_id = auth.uid()
    )
  );
