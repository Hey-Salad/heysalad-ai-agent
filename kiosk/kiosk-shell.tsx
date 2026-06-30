"use client";

import { useMemo, useState } from "react";
import type { KioskSalad } from "@kiosk/catalog";

type BasketEntry = { saladId: string; quantity: number };
type AssistantReply = { question: string; answer: string; intent?: string; escalated?: boolean };

type Props = {
  businessName: string;
  location: string;
  quickPrompts: string[];
  salads: KioskSalad[];
  paymentProvider: string;
};

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

function HeySaladLogo() {
  return (
    <svg width="110" height="38" viewBox="0 0 1287 439" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HeySalad">
      <g clipPath="url(#sal-clip)">
        <path d="M145.097 170.147C154.257 168.394 175.597 81.147 241.842 141.731C291.097 186.778 268.143 273.072 204.51 295.056C140.875 317.039 100.097 299.981 81.562 282.813C43.597 247.647 15.097 165.647 135.597 170.147L145.097 170.147Z" fill="#ED4C4C"/>
        <ellipse cx="163" cy="230" rx="22" ry="14" fill="white" opacity="0.2"/>
      </g>
      <path d="M406.5 290.6V150.6H440.7V290.6H406.5ZM319.5 290.6V150.6H353.7V290.6H319.5ZM333.1 236.2V205.4H424.5V236.2H333.1Z" fill="#1f1416"/>
      <path d="M523 292.6C511.2 292.6 501 290.3 492.2 285.6C483.5 281 476.8 274.6 472 266.4C467.3 258.2 465 248.8 465 238.2C465 230 466.3 222.4 469 215.6C471.6 208.7 475.4 202.8 480.2 197.8C485.1 192.9 490.8 189.1 497.4 186.4C504 183.6 511.3 182.2 519.2 182.2C526.6 182.2 533.4 183.6 539.6 186.2C545.7 188.9 551 192.6 555.6 197.4C560.1 202.2 563.6 207.9 566 214.4C568.4 221 569.5 228.1 569.4 235.8L569.2 244.6H484.8L480 226.4H543L539.6 230V226C539.3 222.7 538.2 219.8 536.4 217.4C534.6 214.9 532.3 212.9 529.4 211.4C526.6 210 523.4 209.2 519.8 209.2C514.4 209.2 509.9 210.3 506.2 212.4C502.6 214.4 499.8 217.4 498 221.2C496.1 225.1 495.2 229.9 495.2 235.6C495.2 241.4 496.4 246.4 498.8 250.8C501.3 255.2 504.9 258.6 509.6 261C514.4 263.4 520 264.6 526.6 264.6C531 264.6 535 264 538.6 262.6C542.2 261.3 546 259 550.2 255.8L565.2 277C561.1 280.5 556.6 283.4 552 285.8C547.3 288.1 542.5 289.8 537.6 290.8C532.8 292.1 527.9 292.6 523 292.6Z" fill="#1f1416"/>
      <path d="M601.4 336.6L625.6 279.8L626 296.6L574.6 184.4H611L633.4 238C634.6 240.6 635.7 243.4 636.8 246.6C637.8 249.8 638.6 252.8 639.2 255.6L634.6 258.2C635.4 256.2 636.2 253.7 637.2 250.6C638.2 247.6 639.4 244.3 640.6 240.8L660.2 184.4H696.8L651.8 290.6L633.6 336.6H601.4Z" fill="#1f1416"/>
      <path d="M761.8 292.6C747.9 292.6 736.2 290.2 726.6 285.4C717.1 280.5 709 273.6 702.2 264.6L723 241.2C729.5 250.2 736.1 256.2 742.8 259.2C749.5 262.3 756.3 263.8 763.4 263.8C767 263.8 770.2 263.4 773 262.4C775.9 261.5 778.2 260.2 779.8 258.4C781.5 256.6 782.4 254.4 782.4 251.8C782.4 249.8 781.9 248 780.8 246.4C779.9 244.8 778.5 243.4 776.8 242.2C775.1 241 773.1 240 770.8 239C768.5 238 766 237.1 763.2 236.4C760.5 235.8 757.8 235.2 755 234.6C747.3 233 740.5 231 734.8 228.4C729.2 225.8 724.5 222.6 720.6 219C716.9 215.3 714.1 211.1 712.2 206.4C710.3 201.6 709.4 196.2 709.4 190.2C709.4 181.7 711.8 174.2 716.6 167.8C721.5 161.4 728 156.4 736 152.8C744 149.2 752.7 147.4 762 147.4C775.6 147.4 786.5 149.6 794.8 154C803.2 158.3 809.9 164.2 814.8 171.8L793.6 192.4C789.5 187.1 784.7 183.1 779.4 180.4C774.2 177.8 768.7 176.4 763 176.4C759.1 176.4 755.7 176.9 752.8 177.8C749.9 178.8 747.6 180.2 746 182C744.5 183.8 743.8 185.9 743.8 188.4C743.8 190.6 744.4 192.5 745.6 194.2C746.9 195.8 748.7 197.2 751 198.4C753.3 199.6 755.9 200.7 758.8 201.6C761.7 202.4 764.8 203.1 768 203.6C775.3 205.1 781.9 207 787.8 209.4C793.8 211.8 799 214.8 803.2 218.4C807.5 221.9 810.7 226 813 230.8C815.4 235.5 816.6 240.9 816.6 247C816.6 256.6 814.3 264.8 809.6 271.6C804.9 278.4 798.5 283.6 790.2 287.2C781.9 290.8 772.5 292.6 761.8 292.6Z" fill="#1f1416"/>
      <path d="M952.2 290.6V142.6H984.4V290.6H952.2Z" fill="#1f1416"/>
      <defs>
        <clipPath id="sal-clip"><rect width="300" height="439"/></clipPath>
      </defs>
    </svg>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: "50%", border: "1.5px solid var(--line-200)",
  background: "var(--white)", color: "var(--text-body)", fontSize: 20,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "var(--font-body)", fontWeight: 700, lineHeight: 1,
};

export function KioskShell({ location, quickPrompts, salads, paymentProvider }: Props) {
  const [basket, setBasket] = useState<BasketEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [assistantReply, setAssistantReply] = useState<AssistantReply | null>(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  const basketItems = useMemo(() =>
    basket.map(e => { const s = salads.find(i => i.id === e.saladId); return s ? { ...e, salad: s } : null; })
      .filter(Boolean) as Array<BasketEntry & { salad: KioskSalad }>,
    [basket, salads]
  );
  const total = basketItems.reduce((s, e) => s + e.salad.price * e.quantity, 0);

  const add = (id: string) => setBasket(c => { const ex = c.find(i => i.saladId === id); return ex ? c.map(i => i.saladId === id ? { ...i, quantity: i.quantity + 1 } : i) : [...c, { saladId: id, quantity: 1 }]; });
  const rem = (id: string) => setBasket(c => c.map(i => i.saladId === id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));

  async function askAssistant(prompt: string) {
    const msg = prompt.trim(); if (!msg) return;
    setAssistantBusy(true);
    try {
      const res = await fetch("/api/kiosk/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assistant unavailable");
      setAssistantReply({ question: msg, answer: data.message, intent: data.intent, escalated: data.shouldEscalate });
      setQuestion("");
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : "Assistant unavailable", ok: false });
    } finally { setAssistantBusy(false); }
  }

  async function startCheckout() {
    if (!basketItems.length || checkoutBusy) return;
    setCheckoutBusy(true); setStatus(null);
    try {
      const res = await fetch("/api/kiosk/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: basketItems.map(e => ({ saladId: e.salad.id, quantity: e.quantity })), provider: paymentProvider }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      setStatus({ text: `Redirecting to ${data.provider} checkout…`, ok: true });
      if (data.checkoutUrl) { window.location.assign(data.checkoutUrl); return; }
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : "Checkout failed", ok: false });
    } finally { setCheckoutBusy(false); }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "var(--font-body)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 40px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--white)", borderRadius: "var(--radius-card)", border: "1px solid var(--line-200)", padding: "16px 24px", boxShadow: "var(--shadow-card)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <HeySaladLogo />
            <div style={{ width: 1, height: 32, background: "var(--line-200)" }} />
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>Kiosk</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{location}</p>
            </div>
          </div>
          <span style={{ background: "var(--cherry-red-soft)", color: "var(--brand)", borderRadius: "var(--radius-pill)", padding: "6px 16px", fontSize: 13, fontWeight: 600 }}>
            love your food 🍅
          </span>
        </header>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

          {/* Menu */}
          <section style={{ background: "var(--white)", borderRadius: "var(--radius-card)", border: "1px solid var(--line-200)", padding: 24, boxShadow: "var(--shadow-card)" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>Today&apos;s menu</p>
            <h2 style={{ margin: "0 0 20px", fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "var(--text-strong)" }}>Choose your bowl</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {salads.map(salad => {
                const qty = basket.find(i => i.saladId === salad.id)?.quantity ?? 0;
                return (
                  <article key={salad.id} style={{ borderRadius: "var(--radius-card)", border: "1px solid var(--line-200)", overflow: "hidden", background: "var(--cream)" }}>
                    <div style={{ height: 88, background: "linear-gradient(135deg, var(--cherry-red-soft) 0%, var(--light-peach) 100%)", position: "relative", display: "flex", alignItems: "flex-end", padding: "8px 10px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {salad.dietary.map(tag => (
                          <span key={tag} style={{ background: "rgba(255,255,255,0.88)", color: "var(--text-body)", borderRadius: "var(--radius-pill)", padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1.3, flex: 1 }}>{salad.name}</h3>
                        <span style={{ fontWeight: 700, color: "var(--brand)", fontSize: 15, marginLeft: 8, whiteSpace: "nowrap" }}>{gbp.format(salad.price)}</span>
                      </div>
                      <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{salad.description}</p>
                      <p style={{ margin: "0 0 12px", fontSize: 11, color: "var(--text-disabled)" }}>{salad.calories} kcal · {salad.protein}g protein</p>

                      {qty === 0 ? (
                        <button onClick={() => add(salad.id)} style={{ width: "100%", padding: "9px 0", borderRadius: "var(--radius-pill)", background: "var(--brand)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-brand)", fontFamily: "var(--font-body)" }}>
                          Add to order
                        </button>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <button onClick={() => rem(salad.id)} style={qtyBtn}>−</button>
                          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>{qty}</span>
                          <button onClick={() => add(salad.id)} style={{ ...qtyBtn, background: "var(--brand)", color: "white", borderColor: "var(--brand)" }}>+</button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Right column */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Basket */}
            <section style={{ background: "var(--text-strong)", borderRadius: "var(--radius-card)", padding: 22, color: "white", boxShadow: "var(--shadow-card)" }}>
              <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 800 }}>🛒 Your order</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 50 }}>
                {basketItems.length ? basketItems.map(e => (
                  <div key={e.salad.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 12px" }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{e.salad.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-300)" }}>{e.quantity} × {gbp.format(e.salad.price)}</p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{gbp.format(e.salad.price * e.quantity)}</span>
                  </div>
                )) : (
                  <div style={{ textAlign: "center", color: "var(--ink-300)", fontSize: 13, padding: "14px 0", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 10 }}>
                    Add a salad to start
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-300)", alignSelf: "center" }}>Total</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>{gbp.format(total)}</span>
              </div>

              <button
                onClick={() => void startCheckout()}
                disabled={!basketItems.length || checkoutBusy}
                style={{ marginTop: 14, width: "100%", padding: "13px 0", borderRadius: "var(--radius-pill)", border: "none", background: basketItems.length ? "var(--brand)" : "rgba(255,255,255,0.1)", color: basketItems.length ? "white" : "var(--ink-300)", fontSize: 14, fontWeight: 700, cursor: basketItems.length && !checkoutBusy ? "pointer" : "not-allowed", boxShadow: basketItems.length ? "var(--shadow-brand)" : "none", fontFamily: "var(--font-body)" }}
              >
                {checkoutBusy ? "Starting checkout…" : `Pay with ${paymentProvider}`}
              </button>

              {status && (
                <p style={{ margin: "10px 0 0", fontSize: 13, textAlign: "center", color: status.ok ? "#6ee7b7" : "#fca5a5" }}>{status.text}</p>
              )}
            </section>

            {/* AI Assistant */}
            <section style={{ background: "var(--white)", borderRadius: "var(--radius-card)", border: "1px solid var(--line-200)", padding: 20, boxShadow: "var(--shadow-card)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--cherry-red-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🍅</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "var(--text-strong)" }}>Ask Sal</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Your salad guide</p>
                </div>
              </div>

              {assistantReply && (
                <div style={{ marginBottom: 12, background: "var(--cream)", borderRadius: 10, padding: 12 }}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 5px" }}>You: {assistantReply.question}</p>
                  <p style={{ fontSize: 13, color: "var(--text-body)", margin: 0, lineHeight: 1.6 }}>{assistantReply.answer}</p>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {quickPrompts.map(p => (
                  <button key={p} onClick={() => askAssistant(p)} style={{ background: "var(--cherry-red-soft)", color: "var(--brand)", border: "none", borderRadius: "var(--radius-pill)", padding: "5px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                    {p}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 7 }}>
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && void askAssistant(question)}
                  placeholder="Ask about ingredients…"
                  style={{ flex: 1, padding: "9px 12px", borderRadius: "var(--radius-input)", border: "1.5px solid var(--line-200)", fontSize: 12, fontFamily: "var(--font-body)", outline: "none", background: "var(--cream)", color: "var(--text-body)" }}
                />
                <button
                  onClick={() => void askAssistant(question)}
                  disabled={assistantBusy || !question.trim()}
                  style={{ padding: "9px 14px", borderRadius: "var(--radius-pill)", background: "var(--brand)", color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", opacity: assistantBusy ? 0.6 : 1 }}
                >
                  {assistantBusy ? "…" : "Ask"}
                </button>
              </div>
            </section>
          </aside>
        </div>

        <footer style={{ textAlign: "center", fontSize: 11, color: "var(--text-disabled)" }}>
          HeySalad® · love your food · Airwallex checkout
        </footer>
      </div>
    </main>
  );
}
