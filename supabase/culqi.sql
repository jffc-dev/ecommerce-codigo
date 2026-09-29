-- =====================================================================
-- Ajustes para la pasarela Culqi
-- Ejecutar en Supabase → SQL Editor (después de orders.sql)
-- =====================================================================

-- Culqi cobra en soles
alter table orders alter column currency set default 'PEN';

-- Último rechazo de la pasarela (merchant_message de Culqi), útil para soporte.
-- Lo escribe la Edge Function culqi-charge con la service role.
alter table orders add column if not exists payment_error text;
