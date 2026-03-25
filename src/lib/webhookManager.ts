// Webhook manager - sends POST notifications on sale events

const STORAGE_KEY = 'webhook_config';

export interface WebhookConfig {
  saleWebhookUrl: string;
}

export function getWebhookConfig(): WebhookConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { saleWebhookUrl: '' };
  } catch {
    return { saleWebhookUrl: '' };
  }
}

export function saveWebhookConfig(config: WebhookConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function fireSaleWebhook(data: Record<string, unknown>) {
  const config = getWebhookConfig();
  if (!config.saleWebhookUrl) return;

  try {
    await fetch(config.saleWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'checkout_initiated',
        timestamp: new Date().toISOString(),
        ...data,
      }),
      mode: 'no-cors', // allow cross-origin webhooks
    });
  } catch (err) {
    console.error('Webhook error:', err);
  }
}
