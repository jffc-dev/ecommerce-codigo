-- =====================================================================
-- Pedidos (orders) + items + función create_order
-- Ejecutar en Supabase → SQL Editor
-- =====================================================================

-- Estado del pedido. Pensado para una pasarela futura:
--   pending   → creado, esperando pago
--   paid      → pago confirmado (lo marcará el webhook de la pasarela)
--   failed    → el pago fue rechazado
--   cancelled → cancelado antes de pagar (se devuelve el stock)
--   refunded  → pagado y luego reembolsado
create type order_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded');

create table orders (
  id                uuid primary key default gen_random_uuid(),

  -- Cliente (la app aún no usa Supabase Auth, así que se guarda el email)
  customer_email    text not null,
  customer_name     text not null,
  customer_phone    text,

  -- Envío
  shipping_address  text not null,
  shipping_city     text not null,
  shipping_notes    text,

  -- Montos (calculados en el servidor por create_order)
  subtotal          numeric(10, 2) not null check (subtotal >= 0),
  shipping          numeric(10, 2) not null check (shipping >= 0),
  total             numeric(10, 2) not null check (total >= 0),
  currency          text not null default 'USD',

  -- Pago
  status            order_status not null default 'pending',
  payment_provider  text,          -- 'stripe', 'culqi', 'mercadopago'...
  payment_reference text unique,   -- id del cargo / payment intent en la pasarela
  paid_at           timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index orders_customer_email_idx on orders (customer_email);
create index orders_status_idx on orders (status);

create table order_item (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders (id) on delete cascade,
  product_variant_id uuid references product_variant (id) on delete set null,

  -- Copia de los datos al momento de la compra (por si el producto cambia luego)
  product_name       text not null,
  sku                text not null,
  options            text,                         -- ej. "Celeste · 42"
  unit_price         numeric(10, 2) not null check (unit_price >= 0),
  quantity           int not null check (quantity > 0),
  line_total         numeric(10, 2) generated always as (unit_price * quantity) stored
);

create index order_item_order_id_idx on order_item (order_id);

-- updated_at automático
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- =====================================================================
-- RLS: nadie escribe directo en las tablas con la anon key.
-- Los pedidos solo se crean mediante create_order (security definer).
-- =====================================================================
alter table orders enable row level security;
alter table order_item enable row level security;

-- =====================================================================
-- create_order: crea el pedido de forma atómica.
--   - Recalcula precios desde product_variant/product (no confía en el cliente)
--   - Verifica y descuenta stock (con bloqueo de fila)
--   - Si algo falla, no se guarda nada
--
-- p_customer: { "email", "name", "phone", "address", "city", "notes" }
-- p_items:    [ { "variant_id": "uuid", "quantity": 2 }, ... ]
-- =====================================================================
create or replace function create_order(p_customer jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id  uuid;
  v_item      jsonb;
  v_qty       int;
  v_variant   record;
  v_price     numeric(10, 2);
  v_options   text;
  v_subtotal  numeric(10, 2) := 0;
  v_shipping  numeric(10, 2);
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  if coalesce(trim(p_customer ->> 'email'), '') = ''
     or coalesce(trim(p_customer ->> 'name'), '') = ''
     or coalesce(trim(p_customer ->> 'address'), '') = ''
     or coalesce(trim(p_customer ->> 'city'), '') = '' then
    raise exception 'Faltan datos del cliente';
  end if;

  insert into orders (customer_email, customer_name, customer_phone,
                      shipping_address, shipping_city, shipping_notes,
                      subtotal, shipping, total)
  values (trim(p_customer ->> 'email'), trim(p_customer ->> 'name'), nullif(trim(p_customer ->> 'phone'), ''),
          trim(p_customer ->> 'address'), trim(p_customer ->> 'city'), nullif(trim(p_customer ->> 'notes'), ''),
          0, 0, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 then
      raise exception 'Cantidad inválida';
    end if;

    select pv.id, pv.sku, pv.stock, pv.price, p.base_price, p.name
      into v_variant
      from product_variant pv
      join product p on p.id = pv.product_id
     where pv.id = (v_item ->> 'variant_id')::uuid
       for update of pv;

    if not found then
      raise exception 'Producto no encontrado';
    end if;

    if v_variant.stock < v_qty then
      raise exception 'Stock insuficiente para % (disponible: %)', v_variant.name, v_variant.stock;
    end if;

    v_price := coalesce(v_variant.price, v_variant.base_price);

    select string_agg(vov.value, ' · ' order by vov.option_id)
      into v_options
      from product_variant_option_value pvov
      join variant_option_value vov on vov.id = pvov.option_value_id
     where pvov.variant_id = v_variant.id;

    insert into order_item (order_id, product_variant_id, product_name, sku, options, unit_price, quantity)
    values (v_order_id, v_variant.id, v_variant.name, v_variant.sku, v_options, v_price, v_qty);

    update product_variant set stock = stock - v_qty where id = v_variant.id;

    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  -- Misma regla que CartService.shipping
  v_shipping := case when v_subtotal > 50 then 0 else 6.99 end;

  update orders
     set subtotal = v_subtotal,
         shipping = v_shipping,
         total    = v_subtotal + v_shipping
   where id = v_order_id;

  return v_order_id;
end;
$$;

revoke all on function create_order(jsonb, jsonb) from public;
grant execute on function create_order(jsonb, jsonb) to anon, authenticated;
