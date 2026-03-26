import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiToken, amount, buyerName, buyerEmail, buyerDocument, buyerPhone, externalRef } = await req.json();

    if (!apiToken || !amount) {
      return new Response(JSON.stringify({ error: 'apiToken e amount são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const amountCents = Math.round(amount * 100);

    const body: Record<string, unknown> = {
      amount: amountCents,
      payment_method: 'pix',
      customer: {
        ...(buyerName && { name: buyerName }),
        ...(buyerEmail && { email: buyerEmail }),
        ...(buyerPhone && { phone: buyerPhone.replace(/\D/g, '') }),
        ...(buyerDocument && { document: buyerDocument.replace(/\D/g, '') }),
      },
      items: [
        {
          title: 'Panela Antiaderente 12L',
          unit_price: amountCents,
          quantity: 1,
        },
      ],
    };

    if (externalRef) {
      body.external_ref = externalRef;
    }

    console.log('IronPay request body:', JSON.stringify(body));

    const apiUrl = `https://api.ironpayapp.com.br/api/public/v1/transactions?api_token=${encodeURIComponent(apiToken)}`;

    const response = await fetch(apiUrl, {
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

    // Extract PIX data - try multiple field paths
    const pixCode = data.pix?.qrcode || data.pix?.qr_code || data.pix?.emv || data.pix_code || data.qr_code || '';
    const pixQrCodeBase64 = data.pix?.qrcode_base64 || data.pix?.qr_code_base64 || data.pix_qr_code_base64 || '';
    const transactionHash = data.transaction_hash || data.hash || data.id || '';

    // Save order to database
    const { data: orderData, error: orderError } = await supabase.from('orders').insert({
      external_id: transactionHash || externalRef || null,
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
    }).select().single();

    if (orderError) {
      console.error('Order save error:', orderError);
    }

    // Send SMS if phone available
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
