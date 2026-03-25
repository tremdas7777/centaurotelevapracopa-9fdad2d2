

## Plan: Support 2 UTMify Tokens

### What changes
1. **`src/lib/utmifyManager.ts`** — Change `UtmifyConfig` to hold `apiToken1` and `apiToken2` (both strings). Update `sendUtmifySale` to send to both tokens (fire-and-forget). Update `testUtmifyToken` to accept a token string (no change needed, already does). Add a helper to test both tokens individually.

2. **`src/pages/AdminPanel.tsx`** — Update the UTMify tab to show two labeled token inputs ("Token 1" and "Token 2"), each with its own "Testar" button and status message. The "Salvar" button saves both at once. Update state initialization to use new config shape.

### Technical details

**UtmifyConfig new shape:**
```ts
interface UtmifyConfig {
  apiToken: string;   // kept for backward compat, mapped to token1
  apiToken2: string;
}
```

**sendUtmifySale:** sends the sale payload to both tokens in parallel (skipping empty ones).

**Admin UI:** Two input fields side by side or stacked, each with individual test buttons showing per-token results.

