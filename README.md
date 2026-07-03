# HeySalad AI Agent

Open-source AI platform for food businesses. Built with [Next.js 16](https://nextjs.org), [Eve](https://github.com/vercel/eve) (Vercel's agent framework), [Vercel AI SDK](https://sdk.vercel.ai), and [Prisma](https://prisma.io).

This is the OSS version of the [HeySalad AI Platform](https://heysalad.ai) — you can self-host it, extend it, or use it as a foundation for your own AI-powered food business tools.

## What It Does

An AI phone agent and business platform that helps restaurants, cafes, bakeries, grocers, and other food businesses:

- **Answer calls** with an AI receptionist that knows your menu, hours, and policies
- **Take bookings** automatically from phone or chat
- **Handle FAQs** using a knowledge base you control
- **Escalate safely** — allergies, complaints, and edge cases go to humans
- **Track everything** — calls, bookings, tasks, agent performance

## Architecture

```
┌───────────────────────────────────────────────────┐
│              heysalad-ai-agent (this repo)        │
│                                                   │
│  Next.js 16 ─── Prisma/Postgres ─── Eve Agents   │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │            5 AI Agents                      │  │
│  │  Host · Knowledge · Sales · Ops · Compliance│  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │         Integration Layer                   │  │
│  │  Payments: Stripe / Airwallex / Anyway      │  │
│  │  Voice:    Twilio / ElevenLabs / OpenAI     │  │
│  │  Models:   OpenAI / HuggingFace / Azure     │  │
│  │  Market:   CoralOS / Solana                 │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

## Quick Start

```bash
git clone https://github.com/Hey-Salad/heysalad-ai-agent.git
cd heysalad-ai-agent
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY and DATABASE_URL to .env.local
npm run db:push
npm run db:seed    # Creates a demo restaurant with menu + FAQs
npm run dev
```

Visit `http://localhost:3000` to see the platform.

### Kiosk Slice

This repo now includes a dedicated `kiosk/` folder and a `/kiosk` route that:

- lists the current HeySalad bowls from a shared catalog
- sends recommendation questions through the existing host agent
- starts card checkout through the payment provider abstraction
- exposes an optional Anyway agent-wallet checkout and offer metadata

To run the kiosk flow with Airwallex sandbox credentials:

```env
HEYSALAD_KIOSK_PAYMENT_PROVIDER="airwallex"
HEYSALAD_AIRWALLEX_ENABLED="true"
AIRWALLEX_CLIENT_ID="your-demo-client-id"
AIRWALLEX_API_KEY="your-demo-api-key"
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/host` | POST | AI receptionist — process customer messages |
| `/api/twilio/voice` | POST | Twilio webhook — handles inbound calls |
| `/api/marketplace/demo` | POST | CoralOS + Solana marketplace demo |
| `/api/kiosk/menu` | GET | Public salad menu for the kiosk slice |
| `/api/kiosk/assistant` | POST | Public host-agent endpoint for kiosk recommendations |
| `/api/kiosk/checkout` | POST | Starts checkout through the configured payment provider |
| `/api/webhooks/anyway` | POST | Receives signed Anyway order events |
| `/offer.json` | GET | Agent-readable kiosk menu and checkout metadata |
| `/.well-known/x402` | GET | Agent payment discovery metadata |
| `/api/health` | GET | Health check |

### Example: Host Agent

```bash
curl -X POST http://localhost:3000/api/host \
  -H "Authorization: Bearer YOUR_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "businessName": "Green Bowl Kitchen",
    "businessType": "RESTAURANT",
    "knowledgeContext": "Open Mon-Sat 11am-10pm. Vegan menu available.",
    "greeting": "Hello! Thanks for calling Green Bowl Kitchen.",
    "customerMessage": "Do you have vegan options?"
  }'
```

## Project Structure

```
├── agent/                      # Eve agent definitions
│   ├── agent.ts                # Root agent
│   ├── instructions.md         # System prompt
│   ├── subagents/              # Host, Knowledge, Sales, Ops, Compliance
│   ├── tools/                  # create_booking, create_task, etc.
│   └── skills/                 # Agent skill documents
├── kiosk/                      # Kiosk-specific catalog and UI shell
├── prisma/
│   ├── schema.prisma           # Database schema (Postgres)
│   └── seed.ts                 # Demo data seeder
├── src/
│   ├── app/
│   │   ├── api/                # API routes
│   │   │   ├── host/           # Host agent endpoint
│   │   │   ├── kiosk/          # Public kiosk routes
│   │   │   ├── twilio/voice/   # Twilio voice webhook
│   │   │   ├── marketplace/    # CoralOS demo
│   │   │   └── health/         # Health check
│   │   ├── kiosk/              # Kiosk page
│   │   └── page.tsx            # Landing page
│   └── lib/
│       ├── ai/
│       │   ├── gateway.ts      # AI SDK wrapper with run logging
│       │   └── agents/host.ts  # Host agent implementation
│       ├── integrations/       # Sponsor integration framework
│       │   ├── payments/       # Stripe, Airwallex, PayPal
│       │   ├── voice/          # Twilio, ElevenLabs, OpenAI
│       │   ├── models/         # OpenAI, HuggingFace, Azure
│       │   ├── marketplace/    # CoralOS, Solana
│       │   ├── openai/         # Responses API, Realtime, DALL-E
│       │   └── fetchai/        # Fetch.ai agent bridge
│       ├── db.ts               # Prisma client
│       ├── auth.ts             # API key validation
│       └── twilio.ts           # TwiML helpers
```

## Integrations

All integrations are **feature-flagged** — enable only what you need:

| Integration | Flag | What It Does |
|-------------|------|-------------|
| OpenAI Responses API | `HEYSALAD_OPENAI_RESPONSES` | New structured output API |
| OpenAI Realtime | `HEYSALAD_OPENAI_REALTIME` | Voice mode for AI Terminal |
| OpenAI Images | `HEYSALAD_OPENAI_IMAGES` | DALL-E image generation |
| ElevenLabs | `HEYSALAD_ELEVENLABS_ENABLED` | Voice synthesis + STT |
| Hugging Face | `HEYSALAD_HUGGINGFACE_ENABLED` | Open models (Mixtral, etc.) |
| Azure OpenAI | `HEYSALAD_MICROSOFT_ENABLED` | Azure-hosted models |
| Airwallex | `HEYSALAD_AIRWALLEX_ENABLED` | Global payments + FX |
| PayPal | `HEYSALAD_PAYPAL_ENABLED` | Alternative payments |
| Anyway | `ANYWAY_KIOSK_PAYMENT_LINK_ID` | Agent wallet checkout via USDC on Base |
| CoralOS | `HEYSALAD_CORALOS_ENABLED` | Agent marketplace |
| Solana | `HEYSALAD_SOLANA_ENABLED` | Devnet escrow + Solana Pay |
| Fetch.ai | `HEYSALAD_FETCHAI_ENABLED` | Agent interop bridge |

### Switching Providers

```env
# Payment provider: stripe (default), airwallex, or paypal
HEYSALAD_PAYMENT_PROVIDER="stripe"

# Voice provider: twilio (default), elevenlabs, or openai
HEYSALAD_VOICE_PROVIDER="twilio"

# Model provider: openai (default), huggingface, or azure
HEYSALAD_MODEL_PROVIDER="openai"
```

## Marketplace Demo (CoralOS + Solana)

The end-to-end supply chain demo:

```
Restaurant (Buyer Agent)
    ↓ Stock check
Stock Agent detects low inventory
    ↓ Quote request
Supplier Agents compete on price
    ↓ Best quote accepted
Solana Devnet escrow created
    ↓ Supplier ships
Buyer confirms delivery
    ↓ Settlement released
```

```bash
curl -X POST http://localhost:3000/api/marketplace/demo \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"businessId": "YOUR_BUSINESS_ID"}'
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Database | PostgreSQL via Prisma 7.8 (Neon recommended) |
| AI | Vercel AI SDK + Eve agent framework |
| Voice/SMS | Twilio |
| Payments | Stripe, Airwallex, PayPal, Anyway |
| Language | TypeScript |

## Contributing

PRs welcome! See the integration framework in `src/lib/integrations/` for how to add new providers.

## License

MIT

---

Built by [HeySalad](https://heysalad.ai) — AI for food businesses.
