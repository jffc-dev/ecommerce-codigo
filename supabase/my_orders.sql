-- =====================================================================
-- get_my_orders: devuelve los pedidos de un cliente con sus items.
-- Ejecutar en Supabase → SQL Editor (después de orders.sql)
--
-- ⚠ Mientras la app no use Supabase Auth, el cliente se identifica solo por
--   su email, así que cualquiera que conozca un email podría ver sus pedidos.
--   Al migrar a Supabase Auth, reemplazar p_email por auth.email() (o por
--   user_id = auth.uid()) y quitar el parámetro.
-- =====================================================================
create or replace function get_my_orders(p_email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(o.order_json order by o.created_at desc), '[]'::jsonb)
  from (
    select
      ord.created_at,
      jsonb_build_object(
        'id',         ord.id,
        'status',     ord.status,
        'subtotal',   ord.subtotal,
        'shipping',   ord.shipping,
        'total',      ord.total,
        'currency',   ord.currency,
        'shipping_address', ord.shipping_address,
        'shipping_city',    ord.shipping_city,
        'paid_at',    ord.paid_at,
        'created_at', ord.created_at,
        'items', (
          select coalesce(jsonb_agg(jsonb_build_object(
                   'id',           oi.id,
                   'product_name', oi.product_name,
                   'sku',          oi.sku,
                   'options',      oi.options,
                   'unit_price',   oi.unit_price,
                   'quantity',     oi.quantity,
                   'line_total',   oi.line_total,
                   'image_url', (
                     -- imagen de la variante; si no tiene, la del producto
                     select pi.url
                       from product_variant pv
                       join product_image pi
                         on pi.variant_id = pv.id or (pi.product_id = pv.product_id and pi.variant_id is null)
                      where pv.id = oi.product_variant_id
                      order by (pi.variant_id is null), pi.is_default desc, pi.position
                      limit 1
                   )
                 ) order by oi.product_name), '[]'::jsonb)
            from order_item oi
           where oi.order_id = ord.id
        )
      ) as order_json
    from orders ord
    where lower(ord.customer_email) = lower(trim(p_email))
  ) o;
$$;

revoke all on function get_my_orders(text) from public;
grant execute on function get_my_orders(text) to anon, authenticated;
