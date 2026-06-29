# HeySalad AI Agent

Open-source AI agent framework for food businesses. Built with [Eve](https://github.com/vercel/eve) (Vercel's agent framework) and the [Vercel AI SDK](https://sdk.vercel.ai).

## Architecture

```
heysalad-ai-agent (this repo — OSS agent service)
    ↕ API calls
heysalad-ai (private — SaaS platform at heysalad.ai)
    ↕ Twilio / SMS / Web
Customers calling restaurants, cafes, etc.
```

## Agents

| Agent | Endpoint | Purpose |
|-------|----------|---------|
| **Host** | `POST /api/host` | AI receptionist — answers calls, takes bookings, handles FAQs |
| **Knowledge** | `POST /api/knowledge` | Knowledge base management, gap detection, contradictions |
| **Sales** | `POST /api/sales` | Lead research, prospect enrichment, outreach drafting |
| **Operations** | `POST /api/operations` | Daily summaries, KPI tracking, unresolved work |
| **Compliance** | `POST /api/compliance` | Transcript auditing, risky claim detection |
| **Health** | `GET /api/health` | Health check |

## Quick Start

```bash
# Clone
git clone https://github.com/Hey-Salad/heysalad-ai-agent.git
cd heysalad-ai-agent

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your OpenAI key

# Run
npm run dev
```

## API Usage

```bash
# Host agent — handle a customer message
curl -X POST http://localhost:3000/api/host \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Green Bowl Kitchen",
    "businessType": "RESTAURANT",
    "knowledgeContext": "Open Mon-Sat 11am-10pm. Vegan menu available.",
    "greeting": "Hello! Thanks for calling Green Bowl Kitchen.",
    "customerMessage": "Do you have vegan options?"
  }'

# Compliance audit
curl -X POST http://localhost:3000/api/compliance \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Green Bowl Kitchen",
    "transcript": "Agent: Yes, all our dishes are 100% allergen-free!"
  }'
```

## Eve Agent Structure

```
agent/
  agent.ts              — Root agent definition
  instructions.md       — System prompt
  subagents/
    host/               — Customer-facing receptionist
    knowledge/          — Knowledge base management
    sales/              — Lead research & outreach
    operations/         — Operational summaries
    compliance/         — Transcript auditing
  tools/
    get_business_context.ts
    create_booking.ts
    create_task.ts
    record_agent_run.ts
```

## Integration with HeySalad Platform

The agent service is designed to be called by the [HeySalad AI Platform](https://heysalad.ai). The platform handles:
- Twilio voice/SMS integration
- Customer & business data (Prisma/PostgreSQL)
- Dashboard UI
- Auth & RBAC

The agent service handles:
- AI inference (via Vercel AI SDK)
- Structured responses with Zod schemas
- Tool execution (booking creation, task creation)
- Multi-agent orchestration via Eve

## License

MIT
