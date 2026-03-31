import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const targets = webhooks.filter((w: any) => w.url?.trim() && w.events?.includes(eventType));
    await Promise.allSettled(targets.map(async (webhook: any) => {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), ...payload }),
        });
        console.log(`Webhook sent to ${webhook.url} for ${eventType}`);
      } catch (err) {
        console.error(`Webhook error (${webhook.url}):`, err);
      }
    }));
  } catch (err) {
    console.error('Error firing server webhooks:', err);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiToken, offerHash, amount, buyerName, buyerEmail, buyerDocument, buyerPhone, externalRef, metadata } = await req.json();

    if (!apiToken || !amount || !offerHash) {
      return new Response(JSON.stringify({ error: 'apiToken, offerHash e amount são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const amountCents = Math.round(amount * 100);

    const body: Record<string, unknown> = {
      api_token: apiToken,
      offer_hash: offerHash,
      payment_method: 'pix',
      cart: [
        {
          offer_hash: offerHash,
          quantity: 1,
          price: amountCents,
        },
      ],
    };

    if (buyerName || buyerEmail || buyerDocument || buyerPhone) {
      body.customer = {
        ...(buyerName && { name: buyerName }),
        ...(buyerEmail && { email: buyerEmail }),
        ...(buyerPhone && { phone: buyerPhone.replace(/\D/g, '') }),
        ...(buyerDocument && {
          documents: [{ type: 'cpf', number: buyerDocument.replace(/\D/g, '') }],
        }),
      };
    }

    if (externalRef) {
      body.externalRef = externalRef;
    }

    console.log('IronPay request body:', JSON.stringify(body));

    const response = await fetch('https://api.ironpayapp.com.br/api/public/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('IronPay error:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'Erro na API IronPay', details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('IronPay success response:', JSON.stringify(data));

    const pixCode = data.pix?.qrcode || data.pix?.qr_code || data.pix_qr_code || data.qr_code || data.pix?.emv || '';
    const pixQrCodeBase64 = data.pix?.qrcodeBase64 || data.pix?.qr_code_base64 || data.pix_qr_code_url || data.qr_code_url || '';

    const { data: orderData, error: orderError } = await supabase.from('orders').insert({
      external_id: data.transaction_hash || data.id?.toString() || externalRef || null,
      gateway: 'ironpay',
      status: data.status || 'pending',
      amount_cents: amountCents,
      buyer_name: buyerName || null,
      buyer_email: buyerEmail || null,
      buyer_document: buyerDocument ? buyerDocument.replace(/\D/g, '') : null,
      buyer_phone: buyerPhone || null,
      pix_code: pixCode,
      pix_qr_code_base64: pixQrCodeBase64,
      gateway_response: data,
      buyer_address: metadata?.address || null,
      buyer_address_number: metadata?.addressNumber || null,
      buyer_complement: metadata?.complement || null,
      buyer_neighborhood: metadata?.neighborhood || null,
      buyer_city: metadata?.city || null,
      buyer_state: metadata?.state || null,
      buyer_cep: metadata?.cep || null,
      shipping_method: metadata?.shippingMethod || null,
      shipping_cost_cents: metadata?.shippingCostCents || 0,
      items_description: metadata?.itemsDescription || null,
    }).select().single();

    if (orderError) {
      console.error('Order save error:', orderError);
    }

    if (orderData) {
      await fireServerWebhooks(supabase, 'venda_pendente', {
        source: 'checkout',
        orderId: orderData.id,
        externalId: orderData.external_id,
        buyerName: buyerName || null,
        buyerEmail: buyerEmail || null,
        buyerPhone: buyerPhone || null,
        amount: amount,
        gateway: 'ironpay',
      });
    }

    // Send SMS notification if phone is available
    if (buyerPhone) {
      try {
        const smsToken = Deno.env.get('CPF_API_KEY');
        if (smsToken) {
          const phoneClean = buyerPhone.replace(/\D/g, '');
          const phoneFormatted = phoneClean.startsWith('55') ? phoneClean : `55${phoneClean}`;
          const firstName = buyerName ? buyerName.split(' ')[0] : 'Cliente';
          const smsMessage = `Centauro: ${firstName}, seus premios exclusivos estao liberados! Pague o PIX e receba em 3 a 5 dias uteis.`;
          
          const smsResponse = await fetch(`https://sms.aresfun.com/v1/integration/${smsToken}/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: [phoneFormatted],
              from: "29094",
              message: smsMessage,
            }),
          });
          console.log('SMS sent:', await smsResponse.text());
        }
      } catch (smsError) {
        console.error('SMS send error:', smsError);
      }
    }

    return new Response(JSON.stringify({
      ...data,
      order_id: orderData?.id || null,
      pix_code: pixCode,
      pix_qr_code_base64: pixQrCodeBase64,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
