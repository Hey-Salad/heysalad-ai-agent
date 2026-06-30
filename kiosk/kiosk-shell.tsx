"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { KioskSalad } from "@kiosk/catalog";

type BasketEntry   = { saladId: string; quantity: number };
type AssistantMsg  = { role: "user" | "sal"; text: string };

type Props = {
  businessName: string;
  location: string;
  quickPrompts: string[];
  salads: KioskSalad[];
  paymentProvider: string;
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// ── Dietary tag colours ───────────────────────────────────────────────────────
const tagColour: Record<string, { bg: string; text: string }> = {
  vegan:          { bg: "#f0fdf4", text: "#16a34a" },
  vegetarian:     { bg: "#f0fdf4", text: "#15803d" },
  "gluten-free":  { bg: "#fffbeb", text: "#b45309" },
  raw:            { bg: "#ecfdf5", text: "#059669" },
  "high-protein": { bg: "#fef2f2", text: "#dc2626" },
};

// ── Salad accent gradients ────────────────────────────────────────────────────
const saladGradients = [
  "linear-gradient(135deg,#ffd0cd 0%,#faa09a 100%)",
  "linear-gradient(135deg,#fbe4e4 0%,#ffd0cd 100%)",
  "linear-gradient(135deg,#fff1f1 0%,#faa09a 100%)",
  "linear-gradient(135deg,#ffd0cd 0%,#ed4c4c22 100%)",
];

export function KioskShell({ location, quickPrompts, salads, paymentProvider }: Props) {
  const [basket, setBasket]             = useState<BasketEntry[]>([]);
  const [messages, setMessages]         = useState<AssistantMsg[]>([]);
  const [question, setQuestion]         = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [status, setStatus]             = useState<{ text: string; ok: boolean } | null>(null);

  const basketItems = useMemo(() =>
    basket
      .map(e => { const s = salads.find(i => i.id === e.saladId); return s ? { ...e, salad: s } : null; })
      .filter(Boolean) as Array<BasketEntry & { salad: KioskSalad }>,
    [basket, salads]
  );
  const total = basketItems.reduce((s, e) => s + e.salad.price * e.quantity, 0);

  const add = (id: string) => setBasket(c => {
    const ex = c.find(i => i.saladId === id);
    return ex ? c.map(i => i.saladId === id ? { ...i, quantity: i.quantity + 1 } : i) : [...c, { saladId: id, quantity: 1 }];
  });
  const rem = (id: string) => setBasket(c =>
    c.map(i => i.saladId === id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0)
  );

  async function askSal(prompt: string) {
    const msg = prompt.trim(); if (!msg) return;
    setMessages(m => [...m, { role: "user", text: msg }]);
    setQuestion("");
    setAssistantBusy(true);
    try {
      const res = await fetch("/api/kiosk/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversationHistory: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assistant unavailable");
      setMessages(m => [...m, { role: "sal", text: data.message }]);
    } catch (err) {
      setMessages(m => [...m, { role: "sal", text: "Sorry, I'm not available right now. Ask a team member for help." }]);
    } finally { setAssistantBusy(false); }
  }

  async function startCheckout() {
    if (!basketItems.length || checkoutBusy) return;
    setCheckoutBusy(true); setStatus(null);
    try {
      const res = await fetch("/api/kiosk/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: basketItems.map(e => ({ saladId: e.salad.id, quantity: e.quantity })), provider: paymentProvider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      setStatus({ text: "Redirecting to payment…", ok: true });
      if (data.checkoutUrl) { window.location.assign(data.checkoutUrl); return; }
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : "Checkout failed", ok: false });
    } finally { setCheckoutBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "Figtree, system-ui, sans-serif" }}>

      {/* ── Top bar ── */}
      <header style={{
        height: 60, background: "#fff", borderBottom: "1px solid #ece5e5",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 1px 4px rgba(31,20,22,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Image
            src="https://raw.githubusercontent.com/Hey-Salad/.github/main/HeySalad%20Logo%20Black.svg"
            alt="HeySalad"
            width={120} height={32}
            style={{ objectFit: "contain" }}
            unoptimized
          />
          <span style={{ width: 1, height: 24, background: "#ece5e5" }} />
          <span style={{
            background: "#fbe4e4", color: "#ed4c4c",
            borderRadius: 999, padding: "3px 12px", fontSize: 12, fontWeight: 700,
          }}>
            Kiosk
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#7a6e70", fontWeight: 500 }}>{location}</span>
          <span style={{
            background: "#f6f1f1", color: "#4a3f41",
            borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600,
          }}>
            {paymentProvider}
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 24px 48px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

        {/* ── Left: Menu ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#b7adae" }}>Today&apos;s menu</p>
            <h1 style={{ margin: 0, fontFamily: "Grandstander, system-ui, sans-serif", fontSize: 28, fontWeight: 800, color: "#1f1416", letterSpacing: "-0.02em" }}>
              Choose your bowl
            </h1>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {salads.map((salad, i) => {
              const qty = basket.find(b => b.saladId === salad.id)?.quantity ?? 0;
              return (
                <article key={salad.id} style={{
                  background: "#fff", borderRadius: 16, border: "1px solid #ece5e5",
                  overflow: "hidden", boxShadow: "0 2px 12px rgba(31,20,22,0.05)",
                  transition: "box-shadow 0.15s ease",
                }}>
                  {/* Colour band */}
                  <div style={{ height: 100, background: saladGradients[i % saladGradients.length], position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 10 }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {salad.dietary.map(tag => {
                        const c = tagColour[tag] ?? { bg: "#f6f1f1", text: "#4a3f41" };
                        return (
                          <span key={tag} style={{ background: c.bg, color: c.text, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{tag}</span>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ padding: "14px 16px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <h2 style={{ margin: 0, fontFamily: "Grandstander, system-ui, sans-serif", fontSize: 15, fontWeight: 700, color: "#1f1416", lineHeight: 1.3, flex: 1 }}>{salad.name}</h2>
                      <span style={{ fontWeight: 700, color: "#ed4c4c", fontSize: 16, marginLeft: 10, whiteSpace: "nowrap" }}>{usd.format(salad.price)}</span>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: "#7a6e70", lineHeight: 1.5 }}>{salad.description}</p>
                    <p style={{ margin: "0 0 14px", fontSize: 11, color: "#b7adae" }}>{salad.calories} kcal · {salad.protein}g protein</p>

                    {qty === 0 ? (
                      <button onClick={() => add(salad.id)} style={{
                        width: "100%", padding: "10px 0", borderRadius: 999,
                        background: "#ed4c4c", color: "#fff", border: "none",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit",
                        boxShadow: "0 4px 12px rgba(237,76,76,0.28)",
                      }}>
                        Add to order
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <button onClick={() => rem(salad.id)} style={qtyBtn}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 18, color: "#1f1416", minWidth: 28, textAlign: "center" }}>{qty}</span>
                        <button onClick={() => add(salad.id)} style={{ ...qtyBtn, background: "#ed4c4c", color: "#fff", border: "1.5px solid #ed4c4c" }}>+</button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* ── Right: Basket + Sal ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>

          {/* Basket card */}
          <div style={{ background: "#1f1416", borderRadius: 16, padding: 22, color: "#fff", boxShadow: "0 4px 24px rgba(31,20,22,0.18)" }}>
            <h2 style={{ margin: "0 0 16px", fontFamily: "Grandstander, system-ui, sans-serif", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🛒</span> Your order
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 48 }}>
              {basketItems.length ? basketItems.map(e => (
                <div key={e.salad.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 12px" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{e.salad.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#b7adae" }}>{e.quantity} × {usd.format(e.salad.price)}</p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{usd.format(e.salad.price * e.quantity)}</span>
                </div>
              )) : (
                <div style={{ textAlign: "center", color: "#7a6e70", fontSize: 13, padding: "14px 0", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 10 }}>
                  Add a salad to get started
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "#b7adae", alignSelf: "center" }}>Total</span>
              <span style={{ fontFamily: "Grandstander, system-ui, sans-serif", fontSize: 24, fontWeight: 800 }}>{usd.format(total)}</span>
            </div>

            <button
              onClick={() => void startCheckout()}
              disabled={!basketItems.length || checkoutBusy}
              style={{
                marginTop: 14, width: "100%", padding: "14px 0", borderRadius: 999, border: "none",
                background: basketItems.length ? "#ed4c4c" : "rgba(255,255,255,0.08)",
                color: basketItems.length ? "#fff" : "#7a6e70",
                fontSize: 15, fontWeight: 700,
                cursor: basketItems.length && !checkoutBusy ? "pointer" : "not-allowed",
                boxShadow: basketItems.length ? "0 4px 16px rgba(237,76,76,0.35)" : "none",
                fontFamily: "inherit",
                transition: "background 0.12s ease",
              }}
            >
              {checkoutBusy ? "Starting checkout…" : `Pay now — ${usd.format(total)}`}
            </button>

            {status && (
              <p style={{ margin: "10px 0 0", fontSize: 12, textAlign: "center", color: status.ok ? "#6ee7b7" : "#fca5a5" }}>
                {status.text}
              </p>
            )}
          </div>

          {/* Ask Sal card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ece5e5", padding: 18, boxShadow: "0 2px 12px rgba(31,20,22,0.05)" }}>
            {/* Sal header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, boxShadow: "0 2px 8px rgba(237,76,76,0.2)" }}>
                <Image
                  src="https://raw.githubusercontent.com/Hey-Salad/.github/main/HeySalad_Launchericon.jpg"
                  alt="Sal"
                  width={38} height={38}
                  style={{ objectFit: "cover", borderRadius: "50%" }}
                  unoptimized
                />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1f1416" }}>Ask Sal</p>
                <p style={{ margin: 0, fontSize: 11, color: "#b7adae" }}>Your salad guide · AI powered</p>
              </div>
            </div>

            {/* Conversation */}
            {messages.length > 0 && (
              <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "85%", padding: "8px 12px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      background: m.role === "user" ? "#ed4c4c" : "#f6f1f1",
                      color: m.role === "user" ? "#fff" : "#1f1416",
                      fontSize: 13, lineHeight: 1.5,
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {assistantBusy && (
                  <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
                    {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#b7adae", display: "inline-block", animation: `pulse 1s ${i * 0.2}s infinite` }} />)}
                  </div>
                )}
              </div>
            )}

            {/* Quick prompts */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {quickPrompts.map(p => (
                <button key={p} onClick={() => void askSal(p)} style={{
                  background: "#fbe4e4", color: "#ed4c4c", border: "none",
                  borderRadius: 999, padding: "5px 11px", fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: 7 }}>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && void askSal(question)}
                placeholder="Ask about ingredients, calories…"
                style={{
                  flex: 1, padding: "9px 12px", borderRadius: 12,
                  border: "1.5px solid #ece5e5", fontSize: 13,
                  fontFamily: "inherit", outline: "none",
                  background: "#fff8f6", color: "#1f1416",
                }}
              />
              <button
                onClick={() => void askSal(question)}
                disabled={assistantBusy || !question.trim()}
                style={{
                  padding: "9px 14px", borderRadius: 999,
                  background: "#ed4c4c", color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", opacity: assistantBusy ? 0.6 : 1,
                  boxShadow: "0 2px 8px rgba(237,76,76,0.25)",
                }}
              >
                {assistantBusy ? "…" : "Ask"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "16px 0 28px", fontSize: 11, color: "#b7adae", borderTop: "1px solid #ece5e5" }}>
        HeySalad® · love your food · Powered by Airwallex
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        button:hover:not(:disabled) { filter: brightness(0.96); }
        article:hover { box-shadow: 0 6px 24px rgba(31,20,22,0.1) !important; }
      `}</style>
    </div>
  );
}

const qtyBtn: CSSProperties = {
  width: 36, height: 36, borderRadius: "50%",
  border: "1.5px solid #ece5e5", background: "#fff",
  color: "#1f1416", fontSize: 20, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "inherit", fontWeight: 700, lineHeight: 1,
  flexShrink: 0,
};
