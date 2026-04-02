import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function fireServerWebhooks(supabase: any, eventType: 'venda_pendente' | 'venda_aprovada', payload: Record<string, unknown>) {
  try {
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('active', true)
      .contains('events', [eventType]);

    if (!endpoints || endpoints.length === 0) return;

    await Promise.allSettled(
      endpoints.map(async (ep: any) => {
        try {
          await fetch(ep.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), ...payload }),
          });
        } catch (err) {
          console.error(`Webhook to ${ep.url} failed:`, err);
        }
      })
    );
  } catch (err) {
    console.error('Error firing webhooks:', err);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      publicKey,
      secretKey,
      amount,
      buyerName,
      buyerEmail,
      buyerDocument,
      buyerPhone,
      externalRef,
      metadata,
    } = await req.json();

    if (!publicKey || !secretKey) {
      return new Response(JSON.stringify({ error: 'publicKey and secretKey are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Valid amount is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build HyperCash transaction payload
    const amountCents = Math.round(amount * 100);
    const cleanDoc = (buyerDocument || '').replace(/\D/g, '');
    const cleanPhone = (buyerPhone || '').replace(/\D/g, '');

    const transactionPayload: Record<string, any> = {
      amount: amountCents,
      paymentMethod: 'PIX',
      customer: {
        name: buyerName || 'Cliente',
        email: buyerEmail || 'cliente@email.com',
        document: {
          number: cleanDoc,
          type: 'CPF',
        },
        phone: cleanPhone,
      },
      items: [
        {
          title: 'Panela Antiaderente 12L',
          quantity: 1,
          unitPrice: amountCents,
          tangible: true,
        },
      ],
      traceable: true,
      pix: {
        expiresInDays: 1,
      },
    };

    if (externalRef) {
      transactionPayload.customer.externaRef = externalRef;
    }

    if (metadata) {
      transactionPayload.metadata = metadata;
      if (metadata.address) {
        const cepFormatted = (metadata.cep || '').replace(/\D/g, '');
        const cepWithDash = cepFormatted.length === 8 
          ? `${cepFormatted.slice(0,5)}-${cepFormatted.slice(5)}` 
          : cepFormatted;
        
        transactionPayload.shipping = {
          fee: metadata.shippingCostCents || 0,
          address: {
            street: metadata.address,
            streetNumber: metadata.addressNumber || '',
            complement: metadata.complement || '',
            zipCode: cepWithDash,
            neighborhood: metadata.neighborhood || '',
            city: metadata.city || '',
            state: metadata.state || '',
            country: 'BR',
          },
        };
        transactionPayload.customer.address = {
          street: metadata.address,
          streetNumber: metadata.addressNumber || '',
          complement: metadata.complement || '',
          zipCode: cepWithDash,
          neighborhood: metadata.neighborhood || '',
          city: metadata.city || '',
          state: metadata.state || '',
          country: 'BR',
        };
      }
    }

    console.log('Calling HyperCash API...');

    const response = await fetch('https://api.hypercashbrasil.com.br/api/user/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`x:${secretKey}`)}`,
      },
      body: JSON.stringify(transactionPayload),
    });

    const responseData = await response.json();
    console.log('HyperCash response status:', response.status);

    // HyperCash wraps response in { data, message, status, error }
    const data = responseData.data || responseData;

    if (!response.ok || responseData.error) {
      console.error('HyperCash error:', JSON.stringify(responseData));
      return new Response(JSON.stringify({ error: 'HyperCash API error', details: responseData }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract PIX code from nested structure
    const pixCode = data.pix?.qrcode || data.pixCode || data.pix_code || data.pixCopiaECola || '';
    const pixQrCodeBase64 = data.pix?.qrCodeBase64 || data.pixQrCodeBase64 || data.pix_qr_code_base64 || '';

    // Save order to DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        amount_cents: amountCents,
        status: 'pending',
        gateway: 'hypercash',
        external_id: data.id || data.transactionId || null,
        pix_code: pixCode,
        pix_qr_code_base64: pixQrCodeBase64,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_document: cleanDoc,
        buyer_phone: cleanPhone,
        buyer_address: metadata?.address || null,
        buyer_address_number: metadata?.addressNumber || null,
        buyer_complement: metadata?.complement || null,
        buyer_neighborhood: metadata?.neighborhood || null,
        buyer_city: metadata?.city || null,
        buyer_state: metadata?.state || null,
        buyer_cep: metadata?.cep || null,
        shipping_method: metadata?.shippingMethod || null,
        shipping_cost_cents: metadata?.shippingCostCents || 0,
        items_description: 'Panela Antiaderente 12L',
        gateway_response: data,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
    }

    // Fire venda_pendente webhook + Utmify
    await fireServerWebhooks(supabase, 'venda_pendente', {
      order_id: order?.id,
      amount_cents: amountCents,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_document: cleanDoc,
      buyer_phone: cleanPhone,
      gateway: 'hypercash',
    });
    if (order?.id) {
      await fireUtmifyEvent(supabase, 'waiting_payment', {
        id: order.id, buyer_name: buyerName, buyer_email: buyerEmail,
        buyer_phone: cleanPhone, buyer_document: cleanDoc, amount_cents: amountCents,
      });
    }

    // Optional SMS
    try {
      const cpfApiKey = Deno.env.get('CPF_API_KEY');
      if (cpfApiKey && cleanPhone) {
        await fetch(`https://sms.aresfun.com/v1/integration/${cpfApiKey}/send-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cleanPhone,
            message: `Seu PIX foi gerado! Pague para garantir seu pedido.`,
          }),
        });
      }
    } catch (smsErr) {
      console.error('SMS error:', smsErr);
    }

    return new Response(
      JSON.stringify({
        ...data,
        order_id: order?.id,
        pix_code: pixCode,
        pix_qr_code_base64: pixQrCodeBase64,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
