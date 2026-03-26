const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const API_TOKEN = 'de9f4ade-9f96-444e-9028-01cd5d3e1c75';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();

    if (!cpf || typeof cpf !== 'string') {
      return new Response(JSON.stringify({ error: 'CPF é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      return new Response(JSON.stringify({ error: 'CPF inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = `https://sms.aresfun.com/v1/integration/${API_TOKEN}/consult`;
    console.log('Fetching Aresfun API for CPF:', cleanCpf);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documents: [cleanCpf],
        type: 'cpf',
        showPhoneValid: false,
        showRestrictions: false,
      }),
    });

    const text = await response.text();
    console.log('Response status:', response.status, 'Body:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: 'Resposta inválida da API' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.message || 'Erro ao consultar CPF' }), {
        status: response.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // The API returns { data: [{ name, cpf, ... }] }
    const records = data?.data || data;
    const result = Array.isArray(records) ? records[0] : records;
    const nome = result?.name || result?.nome || result?.NOME;

    if (!nome) {
      return new Response(JSON.stringify({ error: 'CPF não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ nome: toTitleCase(nome) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
