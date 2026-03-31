import { supabase } from '@/integrations/supabase/client';

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

export interface IronPayConfig {
  apiToken: string;
  offerHash: string;
  enabled: boolean;
}

export interface PaymentGatewayConfig {
  activeGateway: 'pagouai' | 'vennox' | 'centurionpay' | 'ironpay';
  pagouai: PagouAiConfig;
  vennox: VennoxConfig;
  centurionpay: CenturionPayConfig;
  ironpay: IronPayConfig;
}

const defaultConfig: PaymentGatewayConfig = {
  activeGateway: 'centurionpay',
  pagouai: { publicKey: '', secretKey: '', enabled: false },
  vennox: { secretKey: '', companyId: '', enabled: false },
  centurionpay: { secretKey: '', companyId: '', enabled: false },
  ironpay: { apiToken: '', offerHash: '', enabled: false },
};

// In-memory cache to avoid repeated DB calls within the same page
let cachedConfig: PaymentGatewayConfig | null = null;

export function getCachedGatewayConfig(): PaymentGatewayConfig {
  return cachedConfig || defaultConfig;
}

export async function fetchPaymentGatewayConfig(): Promise<PaymentGatewayConfig> {
  try {
    const { data, error } = await supabase
      .from('gateway_config')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      console.error('Error fetching gateway config:', error);
      return defaultConfig;
    }

    const config: PaymentGatewayConfig = {
      activeGateway: (['pagouai', 'vennox', 'centurionpay', 'ironpay'].includes(data.active_gateway)
        ? data.active_gateway
        : 'centurionpay') as PaymentGatewayConfig['activeGateway'],
      pagouai: {
        publicKey: data.pagouai_public_key || '',
        secretKey: data.pagouai_secret_key || '',
        enabled: !!(data.pagouai_secret_key),
      },
      vennox: {
        secretKey: data.vennox_secret_key || '',
        companyId: data.vennox_company_id || '',
        enabled: !!(data.vennox_secret_key && data.vennox_company_id),
      },
      centurionpay: {
        secretKey: data.centurionpay_secret_key || '',
        companyId: data.centurionpay_company_id || '',
        enabled: !!(data.centurionpay_secret_key && data.centurionpay_company_id),
      },
      ironpay: {
        apiToken: (data as any).ironpay_api_token || '',
        enabled: !!((data as any).ironpay_api_token),
      },
    };

    cachedConfig = config;
    return config;
  } catch (err) {
    console.error('Error fetching gateway config:', err);
    return defaultConfig;
  }
}

export async function savePaymentGatewayConfig(config: PaymentGatewayConfig): Promise<boolean> {
  try {
    // Get existing row id
    const { data: existing } = await supabase
      .from('gateway_config')
      .select('id')
      .limit(1)
      .single();

    const updateData: Record<string, unknown> = {
      active_gateway: config.activeGateway,
      pagouai_public_key: config.pagouai.publicKey,
      pagouai_secret_key: config.pagouai.secretKey,
      vennox_secret_key: config.vennox.secretKey,
      vennox_company_id: config.vennox.companyId,
      centurionpay_secret_key: config.centurionpay.secretKey,
      centurionpay_company_id: config.centurionpay.companyId,
      ironpay_api_token: config.ironpay.apiToken,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase
        .from('gateway_config')
        .update(updateData)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('gateway_config')
        .insert(updateData);
      if (error) throw error;
    }

    cachedConfig = config;
    return true;
  } catch (err) {
    console.error('Error saving gateway config:', err);
    return false;
  }
}

// Legacy support - keep getPaymentGatewayConfig for sync access (uses cache)
export function getPaymentGatewayConfig(): PaymentGatewayConfig {
  return cachedConfig || defaultConfig;
}
