-- ════════════════════════════════════════════════════════════
-- Verda — Borrar datos de prueba (deja clubs y cuentas admin)
-- Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

-- Pedidos e inventario transaccional
delete from public.order_items;
delete from public.orders;
delete from public.wallet_movements;
delete from public.member_applications;
delete from public.members;
delete from public.products;

-- Cuentas de socios (auth + perfil). Conserva SUPER_ADMIN, CLUB_ADMIN y EMPLOYEE.
delete from auth.users
where id in (
  select id from public.profiles where role = 'MEMBER'
);

-- Verificación rápida (todo debería ser 0)
select 'order_items' as tabla, count(*) as filas from public.order_items
union all select 'orders', count(*) from public.orders
union all select 'wallet_movements', count(*) from public.wallet_movements
union all select 'member_applications', count(*) from public.member_applications
union all select 'members', count(*) from public.members
union all select 'products', count(*) from public.products
union all select 'profiles (MEMBER)', count(*) from public.profiles where role = 'MEMBER';
