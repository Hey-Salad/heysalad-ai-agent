export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "80px auto", fontFamily: "system-ui" }}>
      <h1>HeySalad AI Agent</h1>
      <p>Open-source AI agent framework for food businesses.</p>
      <h2>API Endpoints</h2>
      <ul>
        <li><code>POST /api/host</code> — AI receptionist (voice/chat)</li>
        <li><code>POST /api/knowledge</code> — Knowledge base queries</li>
        <li><code>POST /api/sales</code> — Lead research &amp; outreach</li>
        <li><code>POST /api/operations</code> — Daily summaries</li>
        <li><code>POST /api/compliance</code> — Transcript auditing</li>
        <li><code>GET /api/health</code> — Health check</li>
      </ul>
      <p>
        <a href="https://github.com/Hey-Salad/heysalad-ai-agent">GitHub</a>
      </p>
    </main>
  );
}
