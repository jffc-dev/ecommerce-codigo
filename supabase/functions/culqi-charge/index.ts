// =====================================================================
// culqi-charge: cobra un pedido pendiente con un token de Culqi.
//
// POST { order_id, token_id, device_finger_print_id?, authentication_3DS? }
//
// Respuestas 200 (resultado del pago):
//   { status: 'paid', charge_id }        → cargo creado, pedido marcado como pagado
//   { status: '3ds_required' }           → el front debe autenticar con Culqi3DS y reintentar
//   { status: 'declined', message }      → rechazo; el pedido sigue pendiente para reintentar
// Respuestas 4xx/5xx: { message } con un texto apto para el cliente.
//
// Secrets: CULQI_SECRET_KEY (supabase secrets set). SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY las inyecta Supabase automáticamente.
// =====================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CULQI_CHARGES_URL = 'https://api.culqi.com/v2/charges';
const GENERIC_ERROR_MESSAGE = 'No pudimos procesar el pago. Intenta nuevamente en unos minutos.';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, datointerno',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChargeRequest {
  order_id?: string;
  token_id?: string;
  device_finger_print_id?: string;
  authentication_3DS?: Record<string, string>;
}

interface CulqiResponse {
  object?: string;
  id?: string;
  action_code?: string;
  user_message?: string;
  merchant_message?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ message: 'Método no permitido' }, 405);
  }

  let input: ChargeRequest;
  try {
    input = await req.json();
  } catch {
    return json({ message: 'Solicitud inválida' }, 400);
  }
  if (!input.order_id || !input.token_id) {
    return json({ message: 'Solicitud inválida' }, 400);
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, total, currency, customer_email, customer_name, customer_phone, shipping_address, shipping_city')
    .eq('id', input.order_id)
    .maybeSingle();

  if (orderError) {
    console.error('Error al leer el pedido', orderError);
    return json({ message: GENERIC_ERROR_MESSAGE }, 500);
  }
  if (!order) {
    return json({ message: 'Pedido no encontrado' }, 404);
  }
  // Evita cobrar dos veces el mismo pedido
  if (order.status !== 'pending') {
    return json({ message: 'Este pedido ya no está pendiente de pago' }, 409);
  }

  const [firstName, ...lastNames] = order.customer_name.trim().split(/\s+/);
  const phone = order.customer_phone?.replace(/\D/g, '');

  // El monto sale siempre del pedido guardado, nunca del cliente
  const chargeBody = {
    amount: Math.round(Number(order.total) * 100),
    currency_code: order.currency,
    email: order.customer_email,
    source_id: input.token_id,
    capture: true,
    description: `Pedido ${order.id.slice(0, 8).toUpperCase()}`,
    metadata: { order_id: order.id },
    antifraud_details: {
      first_name: firstName,
      last_name: lastNames.join(' ') || firstName,
      address: order.shipping_address,
      address_city: order.shipping_city,
      country_code: 'PE',
      ...(phone ? { phone_number: phone } : {}),
      ...(input.device_finger_print_id ? { device_finger_print_id: input.device_finger_print_id } : {}),
    },
    ...(input.authentication_3DS ? { authentication_3DS: input.authentication_3DS } : {}),
  };

  let culqiStatus: number;
  let culqi: CulqiResponse | null;
  try {
    const response = await fetch(CULQI_CHARGES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('CULQI_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargeBody),
    });
    culqiStatus = response.status;
    culqi = await response.json().catch(() => null);
  } catch (error) {
    console.error('No se pudo conectar con Culqi', error);
    return json({ message: GENERIC_ERROR_MESSAGE }, 502);
  }

  // 201 → cargo creado
  if (culqiStatus === 201 && culqi?.id) {
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_provider: 'culqi',
        payment_reference: culqi.id,
        paid_at: new Date().toISOString(),
        payment_error: null,
      })
      .eq('id', order.id)
      .eq('status', 'pending');

    if (updateError) {
      // El cliente YA pagó: no se le muestra error, pero hay que conciliar a mano
      console.error(`Cargo ${culqi.id} creado pero no se pudo actualizar el pedido ${order.id}`, updateError);
    }
    return json({ status: 'paid', charge_id: culqi.id });
  }

  // 200 + REVIEW → el antifraude pide autenticación 3DS
  if (culqiStatus === 200 && culqi?.action_code === 'REVIEW') {
    return json({ status: '3ds_required' });
  }

  // Rechazo de la tarjeta / token inválido o vencido
  if (culqiStatus >= 400 && culqiStatus < 500 && culqi?.object === 'error') {
    await supabase.from('orders').update({ payment_error: culqi.merchant_message ?? null }).eq('id', order.id);
    return json({ status: 'declined', message: culqi.user_message ?? 'Tu pago fue rechazado. Intenta con otro medio de pago.' });
  }

  console.error('Respuesta inesperada de Culqi', culqiStatus, culqi);
  return json({ message: GENERIC_ERROR_MESSAGE }, 502);
});
