const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

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

    const apiUrl = `https://base2.sistemafull.site/api/cpfx?CPF=${cleanCpf}`;
    console.log('Fetching:', apiUrl);
    
    const response = await fetch(apiUrl);
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

    if (!response.ok || !data.NOME) {
      return new Response(JSON.stringify({ error: data.message || 'Erro ao consultar CPF' }), {
        status: response.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ nome: toTitleCase(data.NOME) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
