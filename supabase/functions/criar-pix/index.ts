import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secretKey, amount, buyerName, buyerEmail, buyerDocument, externalRef } = await req.json();

    if (!secretKey || !amount) {
      return new Response(JSON.stringify({ error: 'secretKey e amount são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = 'Basic ' + btoa(`${secretKey}:x`);

    const body: Record<string, unknown> = {
      amount: Math.round(amount * 100), // centavos
      payment_method: 'pix',
    };

    if (buyerName || buyerEmail || buyerDocument) {
      body.customer = {
        ...(buyerName && { name: buyerName }),
        ...(buyerEmail && { email: buyerEmail }),
        ...(buyerDocument && {
          documents: [{ type: 'cpf', number: buyerDocument.replace(/\D/g, '') }],
        }),
      };
    }

    if (externalRef) {
      body.external_id = externalRef;
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

    return new Response(JSON.stringify(data), {
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
