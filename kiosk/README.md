# Kiosk

This folder holds the kiosk-specific feature slice for `heysalad-ai-agent`.

Current scope:
- Salad catalog and kiosk business metadata
- Shared knowledge context for the host agent
- React shell used by `/kiosk`
- Airwallex-first checkout flow via the existing payment provider abstraction
- Optional Anyway agent-wallet checkout via a reusable payment link

Primary runtime entrypoints:
- `src/app/kiosk/page.tsx`
- `src/app/api/kiosk/menu/route.ts`
- `src/app/api/kiosk/assistant/route.ts`
- `src/app/api/kiosk/checkout/route.ts`
- `src/app/api/webhooks/anyway/route.ts`
- `src/app/offer.json/route.ts`
- `src/app/.well-known/x402/route.ts`

Required environment for the full flow:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `HEYSALAD_AIRWALLEX_ENABLED="true"`
- `AIRWALLEX_CLIENT_ID`
- `AIRWALLEX_API_KEY`

Optional Anyway checkout environment:
- `ANYWAY_KIOSK_PAYMENT_LINK_ID`
- `ANYWAY_KIOSK_PAYMENT_LINK_URL`
- `ANYWAY_KIOSK_AGENT_PAY_URL`

Configure the Anyway webhook endpoint to deliver `order.pending`, `order.paid`, and `order.failed` events to:

```text
https://kiosk-beta.heysalad.ai/api/webhooks/anyway
```

The kiosk uses the shared host agent for menu guidance, the shared payment provider interface for card checkout, and a thin Anyway bridge for agent-wallet checkout.
