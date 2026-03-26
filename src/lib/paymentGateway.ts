export interface PagouAiConfig {
  publicKey: string;
  secretKey: string;
  enabled: boolean;
}

export interface VennoxConfig {
  secretKey: string;
  companyId: string;
  enabled: boolean;
}

export interface IronPayConfig {
  apiToken: string;
  enabled: boolean;
}

export interface PaymentGatewayConfig {
  activeGateway: 'pagouai' | 'vennox' | 'ironpay';
  pagouai: PagouAiConfig;
  vennox: VennoxConfig;
  ironpay: IronPayConfig;
}

const STORAGE_KEY = 'paymentGatewayConfig';

const defaultConfig: PaymentGatewayConfig = {
  activeGateway: 'pagouai',
  pagouai: { publicKey: '', secretKey: '', enabled: false },
  vennox: { secretKey: '', companyId: '', enabled: false },
  ironpay: { apiToken: '', enabled: false },
};

export function getPaymentGatewayConfig(): PaymentGatewayConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!['pagouai', 'vennox', 'ironpay'].includes(parsed.activeGateway)) {
        parsed.activeGateway = 'pagouai';
      }
      return {
        ...defaultConfig,
        ...parsed,
        pagouai: { ...defaultConfig.pagouai, ...parsed.pagouai },
        vennox: { ...defaultConfig.vennox, ...parsed.vennox },
        ironpay: { ...defaultConfig.ironpay, ...parsed.ironpay },
      };
    }
  } catch {}
  return defaultConfig;
}

export function savePaymentGatewayConfig(config: PaymentGatewayConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
