export interface UtmifyConfig {
  apiToken: string;
  apiToken2: string;
}

const STORAGE_KEY = 'utmify_config';
const API_URL = 'https://api.utmify.com.br/api-credentials/orders';

const DEFAULT_CONFIG: UtmifyConfig = { apiToken: '', apiToken2: '' };

export function getUtmifyConfig(): UtmifyConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveUtmifyConfig(config: UtmifyConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function testUtmifyToken(token: string): Promise<{ success: boolean; message: string }> {
  if (!token.trim()) {
    return { success: false, message: 'Token não pode estar vazio!' };
  }

  try {
    const testPayload = {
      orderId: `test_${Date.now()}`,
      platform: 'quiz-copa-2026',
      paymentMethod: 'pix',
      status: 'paid',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      approvedDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      refundedAt: null,
      customer: {
        name: 'Teste Integração',
        email: 'teste@teste.com',
        phone: null,
        document: null,
      },
      products: [
        {
          id: 'test-product',
          name: 'Teste Copa 2026',
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: 100,
        },
      ],
      trackingParameters: {
        src: null,
        sck: null,
        utm_source: null,
        utm_campaign: null,
        utm_medium: null,
        utm_content: null,
        utm_term: null,
      },
      commission: {
        totalPriceInCents: 100,
        gatewayFeeInCents: 0,
        userCommissionInCents: 100,
        currency: 'BRL',
      },
      isTest: true,
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': token,
      },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      return { success: true, message: 'Token válido! Integração funcionando ✓' };
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'Token inválido ou sem permissão!' };
    }

    const text = await response.text().catch(() => '');
    return { success: false, message: `Erro ${response.status}: ${text || 'Resposta inesperada'}` };
  } catch (error) {
    return { success: false, message: 'Erro de conexão. A API pode estar bloqueando requisições do navegador (CORS). O token foi salvo e será usado server-side.' };
  }
}

async function sendToToken(token: string, payload: Record<string, unknown>): Promise<boolean> {
  if (!token) return false;
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': token,
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendUtmifySale(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  priceInCents: number;
  trackingParameters?: Record<string, string | null>;
}): Promise<boolean> {
  const config = getUtmifyConfig();
  const tokens = [config.apiToken, config.apiToken2].filter(Boolean);
  if (tokens.length === 0) return false;

  const payload = {
    orderId: data.orderId,
    platform: 'quiz-copa-2026',
    paymentMethod: 'pix',
    status: 'paid',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    approvedDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    refundedAt: null,
    customer: {
      name: data.customerName,
      email: data.customerEmail,
      phone: null,
      document: null,
    },
    products: [
      {
        id: 'copa-2026-kit',
        name: data.productName,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: data.priceInCents,
      },
    ],
    trackingParameters: {
      src: data.trackingParameters?.src ?? null,
      sck: data.trackingParameters?.sck ?? null,
      utm_source: data.trackingParameters?.utm_source ?? null,
      utm_campaign: data.trackingParameters?.utm_campaign ?? null,
      utm_medium: data.trackingParameters?.utm_medium ?? null,
      utm_content: data.trackingParameters?.utm_content ?? null,
      utm_term: data.trackingParameters?.utm_term ?? null,
    },
    commission: {
      totalPriceInCents: data.priceInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: data.priceInCents,
      currency: 'BRL',
    },
  };

  const results = await Promise.all(tokens.map(t => sendToToken(t, payload)));
  return results.some(Boolean);
}
