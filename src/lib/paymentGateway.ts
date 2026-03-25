export interface PagouAiConfig {
  secretKey: string;
  enabled: boolean;
}

export interface PaymentGatewayConfig {
  activeGateway: 'pagouai' | 'none';
  pagouai: PagouAiConfig;
}

const STORAGE_KEY = 'paymentGatewayConfig';

const defaultConfig: PaymentGatewayConfig = {
  activeGateway: 'none',
  pagouai: { secretKey: '', enabled: false },
};

export function getPaymentGatewayConfig(): PaymentGatewayConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultConfig, ...JSON.parse(saved) };
  } catch {}
  return defaultConfig;
}

export function savePaymentGatewayConfig(config: PaymentGatewayConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
