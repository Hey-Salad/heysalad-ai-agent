# Kiosk

This folder holds the kiosk-specific feature slice for `heysalad-ai-agent`.

Current scope:
- Salad catalog and kiosk business metadata
- Shared knowledge context for the host agent
- React shell used by `/kiosk`
- Airwallex-first checkout flow via the existing payment provider abstraction

Primary runtime entrypoints:
- `src/app/kiosk/page.tsx`
- `src/app/api/kiosk/menu/route.ts`
- `src/app/api/kiosk/assistant/route.ts`
- `src/app/api/kiosk/checkout/route.ts`

Required environment for the full flow:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `HEYSALAD_AIRWALLEX_ENABLED="true"`
- `AIRWALLEX_CLIENT_ID`
- `AIRWALLEX_API_KEY`

The kiosk uses the shared host agent for menu guidance and the shared payment provider interface for checkout, so this folder should stay thin and product-specific.
