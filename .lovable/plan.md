

## Plano: Trocar API de consulta CPF

### Problema
A API atual (`apicpf.com`) não funciona bem. O usuário quer usar a nova API: `https://base2.sistemafull.site:80/api/cpfx?CPF=XXXXXXXXXXX`

### Resposta da nova API
```json
{
  "CPF": "85954158541",
  "NOME": "ANDRE LUAN LEANDRO BRAGA",
  "NASCIMENTO": "16/06/2000",
  "MAE": "CASSIA MARGARETE LEANDRO BRAGA",
  "SEXO": "Masculino"
}
```

### O que muda

**1. Edge Function `supabase/functions/consulta-cpf/index.ts`**
- Trocar a chamada de `api.apicpf.com` para `https://base2.sistemafull.site:80/api/cpfx?CPF={cpf}`
- Essa API nao precisa de token/API key -- é pública (query param apenas)
- Remover dependência do `CPF_API_KEY`
- Converter o nome retornado (todo maiúsculo) para formato "Primeira Letra Maiúscula" (ex: "ANDRE LUAN" → "Andre Luan")
- Retornar `{ nome: "Andre Luan Leandro Braga" }`

**2. Frontend (`src/pages/QuizHome.tsx`)**
- Nenhuma mudança necessária -- já chama a edge function e usa `data.nome`

### Detalhes técnicos

Função de capitalização no edge function:
```typescript
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
```

A edge function continuará fazendo proxy para não expor a URL da API diretamente no frontend.

