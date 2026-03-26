import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
