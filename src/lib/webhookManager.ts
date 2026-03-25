// Webhook manager - sends POST notifications on sale events

const STORAGE_KEY = 'webhook_config_v2';

export interface WebhookEntry {
  id: string;
  url: string;
  events: ('venda_pendente' | 'venda_aprovada')[];
}

export interface WebhookConfig {
  webhooks: WebhookEntry[];
  // Legacy compat
  saleWebhookUrl?: string;
}

export function getWebhookConfig(): WebhookConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Migrate from v1
    const oldRaw = localStorage.getItem('webhook_config');
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      if (old.saleWebhookUrl) {
        const migrated: WebhookConfig = {
          webhooks: [{
            id: crypto.randomUUID(),
            url: old.saleWebhookUrl,
            events: ['venda_pendente', 'venda_aprovada'],
          }],
        };
        saveWebhookConfig(migrated);
        return migrated;
      }
    }
  } catch {}
  return { webhooks: [] };
}

export function saveWebhookConfig(config: WebhookConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function fireWebhookEvent(
  eventType: 'venda_pendente' | 'venda_aprovada',
  data: Record<string, unknown>
) {
  const config = getWebhookConfig();
  const targets = config.webhooks.filter(w => w.url && w.events.includes(eventType));

  const promises = targets.map(async (webhook) => {
    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventType,
          timestamp: new Date().toISOString(),
          ...data,
        }),
        mode: 'no-cors',
      });
    } catch (err) {
      console.error(`Webhook error (${webhook.url}):`, err);
    }
  });

  await Promise.allSettled(promises);
}

// Legacy compat
export async function fireSaleWebhook(data: Record<string, unknown>) {
  await fireWebhookEvent('venda_pendente', data);
}
