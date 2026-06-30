export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-2">HeySalad AI Agent</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Open-source AI platform for food businesses.
      </p>

      <section className="mb-10">
        <div className="border rounded-2xl p-6 bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Kiosk slice</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
                A new `/kiosk` surface now plugs the host agent into a public salad ordering flow and starts checkout through the payment provider abstraction.
              </p>
            </div>
            <a
              href="/kiosk"
              className="inline-flex items-center rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-gray-950"
            >
              Open kiosk
            </a>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">AI Agents</h2>
        <div className="grid gap-3">
          {[
            { name: "Host", desc: "AI receptionist — calls, bookings, FAQs", endpoint: "POST /api/host" },
            { name: "Knowledge", desc: "Knowledge base management & gap detection", endpoint: "POST /api/knowledge" },
            { name: "Sales", desc: "Lead research & outreach", endpoint: "POST /api/sales" },
            { name: "Operations", desc: "Daily summaries & KPI tracking", endpoint: "POST /api/operations" },
            { name: "Compliance", desc: "Transcript auditing & safety", endpoint: "POST /api/compliance" },
          ].map((agent) => (
            <div key={agent.name} className="border rounded-lg p-4 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{agent.name}</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                  {agent.endpoint}
                </code>
              </div>
              <p className="text-sm text-gray-500">{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Integrations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            "OpenAI", "Azure OpenAI", "Hugging Face", "ElevenLabs",
            "Twilio", "Stripe", "Airwallex", "PayPal",
            "CoralOS", "Solana", "Fetch.ai", "Resend",
          ].map((name) => (
            <div key={name} className="border rounded-lg p-3 text-center dark:border-gray-800">
              {name}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
        <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 text-sm overflow-x-auto">
{`git clone https://github.com/Hey-Salad/heysalad-ai-agent.git
cd heysalad-ai-agent
npm install
cp .env.example .env.local
# Add your OpenAI key to .env.local
npm run db:push
npm run dev`}
        </pre>
      </section>

      <footer className="border-t pt-6 dark:border-gray-800 text-sm text-gray-500">
        <a href="https://github.com/Hey-Salad/heysalad-ai-agent" className="underline">
          GitHub
        </a>
        {" · "}
        <a href="https://heysalad.ai" className="underline">
          HeySalad Platform
        </a>
        {" · "}
        MIT License
      </footer>
    </main>
  );
}
