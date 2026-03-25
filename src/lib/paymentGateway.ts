export interface PagouAiConfig {
  secretKey: string;
  enabled: boolean;
}

export interface PaymentGatewayConfig {
  activeGateway: 'pagouai';
  pagouai: PagouAiConfig;
}

const STORAGE_KEY = 'paymentGatewayConfig';

const defaultConfig: PaymentGatewayConfig = {
  activeGateway: 'pagouai',
  pagouai: { secretKey: '', enabled: false },
};

export function getPaymentGatewayConfig(): PaymentGatewayConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old configs that had 'none' as activeGateway
      if (parsed.activeGateway === 'none') {
        parsed.activeGateway = 'pagouai';
      }
      return { ...defaultConfig, ...parsed };
    }
  } catch {}
  return defaultConfig;
}

export function savePaymentGatewayConfig(config: PaymentGatewayConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
