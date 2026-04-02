import { supabase } from '@/integrations/supabase/client';

export interface PagouAiConfig {
  publicKey: string;
  secretKey: string;
  enabled: boolean;
}

export interface PaymentGatewayConfig {
  activeGateway: 'pagouai';
  pagouai: PagouAiConfig;
}

const defaultConfig: PaymentGatewayConfig = {
  activeGateway: 'pagouai',
  pagouai: { publicKey: '', secretKey: '', enabled: false },
};

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
      activeGateway: 'pagouai',
      pagouai: {
        publicKey: data.pagouai_public_key || '',
        secretKey: data.pagouai_secret_key || '',
        enabled: !!(data.pagouai_secret_key),
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
    const { data: existing } = await supabase
      .from('gateway_config')
      .select('id')
      .limit(1)
      .single();

    const updateData: Record<string, unknown> = {
      active_gateway: 'pagouai',
      pagouai_public_key: config.pagouai.publicKey,
      pagouai_secret_key: config.pagouai.secretKey,
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

export function getPaymentGatewayConfig(): PaymentGatewayConfig {
  return cachedConfig || defaultConfig;
}
