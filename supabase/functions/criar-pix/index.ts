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
    const { publicKey, secretKey, amount, buyerName, buyerEmail, buyerDocument, buyerPhone, externalRef } = await req.json();

    if (!secretKey || !amount) {
      return new Response(JSON.stringify({ error: 'secretKey e amount são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client to save order
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = 'Basic ' + btoa(`${secretKey}:x`);

    const amountCents = Math.round(amount * 100);

    const body: Record<string, unknown> = {
      paymentMethod: 'pix',
      amount: amountCents,
      items: [
        {
          title: 'Taxa de envio',
          unitPrice: amountCents,
          quantity: 1,
          tangible: false,
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

    const response = await fetch('https://api.conta.pagou.ai/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Pagou.ai error:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'Erro na API Pagou.ai', details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract PIX data from response - try common field names
    const pixCode = data.pix_qr_code || data.qr_code || data.pix?.qr_code || data.pix?.emv || data.boleto_url || '';
    const pixQrCodeBase64 = data.pix_qr_code_url || data.qr_code_url || data.pix?.qr_code_url || data.pix?.qr_code_base64 || '';

    // Save order to database
    const { data: orderData, error: orderError } = await supabase.from('orders').insert({
      external_id: data.id || data.tid || externalRef || null,
      gateway: 'pagouai',
      status: data.status || 'pending',
      amount_cents: Math.round(amount * 100),
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
