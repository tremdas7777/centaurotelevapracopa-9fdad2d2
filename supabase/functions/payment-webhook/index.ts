import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fireUtmifyEvent(
  supabase: any,
  status: 'waiting_payment' | 'paid',
  orderData: { id: string; buyer_name?: string; buyer_email?: string; buyer_phone?: string; buyer_document?: string; amount_cents: number },
) {
  try {
    const { data: config } = await supabase.from('gateway_config').select('utmify_token_1, utmify_token_2').limit(1).single();
    if (!config) return;
    const tokens = [config.utmify_token_1, config.utmify_token_2].filter(Boolean);
    if (tokens.length === 0) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const payload = {
      orderId: orderData.id, platform: 'quiz-copa-2026', paymentMethod: 'pix', status,
      createdAt: now, approvedDate: status === 'paid' ? now : null, refundedAt: null,
      customer: { name: orderData.buyer_name || 'Cliente', email: orderData.buyer_email || 'cliente@email.com', phone: orderData.buyer_phone || null, document: orderData.buyer_document || null },
      products: [{ id: 'copa-2026-kit', name: 'Kit Copa 2026', planId: null, planName: null, quantity: 1, priceInCents: orderData.amount_cents }],
      trackingParameters: { src: null, sck: null, utm_source: null, utm_campaign: null, utm_medium: null, utm_content: null, utm_term: null },
      commission: { totalPriceInCents: orderData.amount_cents, gatewayFeeInCents: 0, userCommissionInCents: orderData.amount_cents, currency: 'BRL' },
    };
    await Promise.allSettled(tokens.map(async (token: string) => {
      try {
        const resp = await fetch('https://api.utmify.com.br/api-credentials/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-token': token }, body: JSON.stringify(payload) });
        console.log(`Utmify ${status} sent (token ${token.substring(0,8)}...): ${resp.status}`);
      } catch (err) { console.error(`Utmify error:`, err); }
    }));
  } catch (err) { console.error('Utmify event error:', err); }
}

async function fireServerWebhooks(
  supabase: any,
  eventType: 'venda_pendente' | 'venda_aprovada',
  payload: Record<string, unknown>
) {
  try {
    const { data: webhooks } = await supabase
      .from('webhook_endpoints')
      .select('url, events')
      .eq('active', true);

    if (!webhooks || webhooks.length === 0) return;

    const targets = webhooks.filter((w: any) =>
      w.url?.trim() && w.events?.includes(eventType)
    );

    const promises = targets.map(async (webhook: any) => {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
            ...payload,
          }),
        });
        console.log(`Webhook sent to ${webhook.url} for ${eventType}`);
      } catch (err) {
        console.error(`Webhook error (${webhook.url}):`, err);
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error('Error firing server webhooks:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();

    // Handle postback from payment gateway (Pagou.ai, Vennox, CenturionPay)
    if (body.id && body.status) {
      const externalId = body.id.toString();
      const newStatus = body.status === 'paid' || body.status === 'approved' ? 'paid' : body.status;

      // Get order data before update
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('external_id', externalId)
        .single();

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('external_id', externalId);

      if (error) {
        console.error('Update error:', error);
      }

      console.log(`Order ${externalId} updated to ${newStatus}`);

      // Fire webhook on approval
      if (newStatus === 'paid' && orderData) {
        await fireServerWebhooks(supabase, 'venda_aprovada', {
          source: 'gateway-postback',
          orderId: orderData.id,
          externalId,
          buyerName: orderData.buyer_name,
          buyerEmail: orderData.buyer_email,
          buyerPhone: orderData.buyer_phone,
          amount: orderData.amount_cents / 100,
          gateway: orderData.gateway,
        });
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle manual status update from admin
    if (body.orderId && body.action === 'approve') {
      // Get order data before update
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', body.orderId)
        .single();

      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', body.orderId);

      if (error) {
        console.error('Approve error:', error);
        return new Response(JSON.stringify({ error: 'Erro ao aprovar pedido' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fire webhook on manual approval
      if (orderData) {
        await fireServerWebhooks(supabase, 'venda_aprovada', {
          source: 'admin-manual',
          orderId: body.orderId,
          buyerName: orderData.buyer_name,
          buyerEmail: orderData.buyer_email,
          buyerPhone: orderData.buyer_phone,
          amount: orderData.amount_cents / 100,
          gateway: orderData.gateway,
        });
      }

      return new Response(JSON.stringify({ success: true, status: 'paid' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
