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

export interface CenturionPayConfig {
  secretKey: string;
  companyId: string;
  enabled: boolean;
}

export interface PaymentGatewayConfig {
  activeGateway: 'pagouai' | 'vennox' | 'centurionpay';
  pagouai: PagouAiConfig;
  vennox: VennoxConfig;
  centurionpay: CenturionPayConfig;
}

const STORAGE_KEY = 'paymentGatewayConfig';

const defaultConfig: PaymentGatewayConfig = {
  activeGateway: 'centurionpay',
  pagouai: { publicKey: '', secretKey: '', enabled: false },
  vennox: { secretKey: '', companyId: '', enabled: false },
  centurionpay: { secretKey: 'sk_live_wvpAIbH0ath9HMDggoA0nkMdc6A10bh61r0ncRz18w878clO', companyId: '2499a6bb-42e6-44c6-bab0-d9bd6aa3c503', enabled: true },
};

export function getPaymentGatewayConfig(): PaymentGatewayConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!['pagouai', 'vennox', 'centurionpay'].includes(parsed.activeGateway)) {
        parsed.activeGateway = defaultConfig.activeGateway;
      }
      const merged = {
        ...defaultConfig,
        ...parsed,
        pagouai: { ...defaultConfig.pagouai, ...parsed.pagouai },
        vennox: { ...defaultConfig.vennox, ...parsed.vennox },
        centurionpay: { ...defaultConfig.centurionpay, ...(parsed.centurionpay || {}) },
      };
      // If centurionpay keys from localStorage are empty, keep the defaults
      if (!merged.centurionpay.secretKey?.trim()) {
        merged.centurionpay.secretKey = defaultConfig.centurionpay.secretKey;
      }
      if (!merged.centurionpay.companyId?.trim()) {
        merged.centurionpay.companyId = defaultConfig.centurionpay.companyId;
      }
      return merged;
    }
  } catch {}
  return defaultConfig;
}

export function savePaymentGatewayConfig(config: PaymentGatewayConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
