"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import type { KioskSalad } from "@kiosk/catalog";

type BasketEntry   = { saladId: string; quantity: number };
type AssistantMsg  = { role: "user" | "sal"; text: string };
type PaymentModal  = { intentId: string; clientSecret: string; currency: string; orderId: string } | null;

type Props = {
  businessName: string;
  location: string;
  quickPrompts: string[];
  salads: KioskSalad[];
  paymentProvider: string;
  airwallexEnv?: "demo" | "prod";
  airwallexCheckoutMode?: "dropin" | "hosted";
  airwallexCountryCode?: string;
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const AIRWALLEX_DROPIN_MIN_HEIGHT = 560;

function normalizePaymentProvider(value: string) {
  const provider = value.trim().toLowerCase();
  return provider || "airwallex";
}

function normalizeAirwallexEnv(value: string) {
  return value.trim() === "demo" ? "demo" : "prod";
}

function normalizeAirwallexCheckoutMode(value: string) {
  return value.trim() === "dropin" ? "dropin" : "hosted";
}

function normalizeCountryCode(value: string) {
  return value.trim().toUpperCase() || "GB";
}

// ── Dietary tag colours ───────────────────────────────────────────────────────
const tagColour: Record<string, { bg: string; text: string }> = {
  vegan:          { bg: "#f0fdf4", text: "#16a34a" },
  vegetarian:     { bg: "#f0fdf4", text: "#15803d" },
  "gluten-free":  { bg: "#fffbeb", text: "#b45309" },
  raw:            { bg: "#ecfdf5", text: "#059669" },
  "high-protein": { bg: "#fef2f2", text: "#dc2626" },
};

// ── Salad gradient fallbacks ──────────────────────────────────────────────────
const saladGradients = [
  "linear-gradient(135deg,#ffd0cd 0%,#faa09a 100%)",
  "linear-gradient(135deg,#fbe4e4 0%,#ffd0cd 100%)",
  "linear-gradient(135deg,#fff1f1 0%,#faa09a 100%)",
  "linear-gradient(135deg,#ffd0cd 0%,#ed4c4c22 100%)",
];

export function KioskShell({
  location,
  quickPrompts,
  salads,
  paymentProvider,
  airwallexEnv = "demo",
  airwallexCheckoutMode = "hosted",
  airwallexCountryCode = "GB",
}: Props) {
  const normalizedPaymentProvider = normalizePaymentProvider(paymentProvider);
  const normalizedAirwallexEnv = normalizeAirwallexEnv(airwallexEnv);
  const normalizedAirwallexCheckoutMode = normalizeAirwallexCheckoutMode(airwallexCheckoutMode);
  const normalizedAirwallexCountryCode = normalizeCountryCode(airwallexCountryCode);
  const [basket, setBasket]             = useState<BasketEntry[]>([]);
  const [messages, setMessages]         = useState<AssistantMsg[]>([]);
  const [question, setQuestion]         = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [status, setStatus]             = useState<{ text: string; ok: boolean } | null>(null);
  const [awxReady, setAwxReady]         = useState(false);
  const [paymentModal, setPaymentModal] = useState<PaymentModal>(null);
  // Refs so we never call init() more than once and can clean up the drop-in
  const awxInitDone  = useRef(false);
  const dropInRef    = useRef<any>(null);
  const paymentsRef  = useRef<any>(null);

  async function ensureAirwallexSdk() {
    const awx = (window as any).AirwallexComponentsSDK;
    if (!awx) return null;
    if (!awxInitDone.current || !paymentsRef.current) {
      const instance = await awx.init({ env: normalizedAirwallexEnv, enabledElements: ["payments"] });
      paymentsRef.current = instance.payments;
      awxInitDone.current = true;
    }
    return { awx, payments: paymentsRef.current };
  }

  // Mount Airwallex drop-in element when modal opens
  useEffect(() => {
    if (!paymentModal) return;
    (async () => {
      try {
        const sdk = await ensureAirwallexSdk();
        if (!sdk) {
          setStatus({ text: "Payment SDK not loaded — please refresh.", ok: false });
          setPaymentModal(null);
          return;
        }
        const { awx } = sdk;
        // Unmount any previous drop-in before mounting a new one
        try { dropInRef.current?.unmount?.(); } catch {}
        dropInRef.current = null;

        const dropIn = await awx.createElement("dropIn", {
          intent_id: paymentModal.intentId,
          client_secret: paymentModal.clientSecret,
          currency: paymentModal.currency,
          appearance: { mode: "light", variables: { colorBrand: "#ed4c4c" } },
          style: { base: { height: `${AIRWALLEX_DROPIN_MIN_HEIGHT}px` } },
        });
        dropIn.mount("awx-drop-in");
        dropInRef.current = dropIn;

        dropIn.on("success", () => {
          setPaymentModal(null);
          setBasket([]);
          setStatus({ text: "Payment successful! Your order is being prepared.", ok: true });
        });
        dropIn.on("error", (event: any) => {
          const msg = event?.detail?.error?.message || "Payment failed — please try again.";
          setStatus({ text: msg, ok: false });
        });
      } catch (err) {
        setStatus({ text: err instanceof Error ? err.message : "Payment failed to load", ok: false });
        setPaymentModal(null);
      }
    })();
  }, [paymentModal, normalizedAirwallexEnv]);

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

  const isAirwallex = normalizedPaymentProvider === "airwallex";
  const usesAirwallexDropIn = isAirwallex && normalizedAirwallexCheckoutMode === "dropin";

  async function startCheckout() {
    if (!basketItems.length || checkoutBusy) return;
    if (usesAirwallexDropIn && !awxReady) {
      setStatus({ text: "Payment service is still loading — please try again.", ok: false });
      return;
    }
    setCheckoutBusy(true); setStatus(null);
    try {
      const res = await fetch("/api/kiosk/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: basketItems.map(e => ({ saladId: e.salad.id, quantity: e.quantity })), provider: normalizedPaymentProvider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (isAirwallex) {
        if (!data.intentId || !data.clientSecret) throw new Error("Airwallex checkout payload is incomplete");
        if (normalizedAirwallexCheckoutMode === "hosted") {
          setStatus({ text: "Opening Airwallex checkout…", ok: true });
          const sdk = awxReady ? await ensureAirwallexSdk() : null;
          if (sdk?.payments) {
            const maybeUrl = sdk.payments.redirectToCheckout({
              intent_id: data.intentId,
              client_secret: data.clientSecret,
              currency: data.currency || "GBP",
              country_code: normalizedAirwallexCountryCode,
              successUrl: data.successUrl,
              appearance: { mode: "light", variables: { colorBrand: "#ed4c4c" } },
            });
            if (typeof maybeUrl === "string") {
              window.location.assign(maybeUrl);
            }
            return;
          }
          if (data.checkoutUrl) {
            window.location.assign(data.checkoutUrl);
            return;
          }
          throw new Error("Airwallex hosted checkout is not ready yet");
        }
        setPaymentModal({
          intentId: data.intentId,
          clientSecret: data.clientSecret,
          currency: data.currency || "GBP",
          orderId: data.orderId,
        });
        return;
      }

      // Fallback: direct URL redirect (Stripe etc.)
      setStatus({ text: "Redirecting to payment…", ok: true });
      if (data.checkoutUrl) { window.location.assign(data.checkoutUrl); return; }
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : "Checkout failed", ok: false });
    } finally { setCheckoutBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: "Figtree, system-ui, sans-serif" }}>

      {/* Airwallex Components SDK */}
      <Script
        src="https://static.airwallex.com/components/sdk/v1/index.js"
        strategy="afterInteractive"
        onLoad={() => setAwxReady(true)}
      />

      {/* ── Top bar ── */}
      <header style={{
        minHeight: 56, background: "#fff", borderBottom: "1px solid #ece5e5",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
        padding: "10px 16px", position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 1px 4px rgba(31,20,22,0.05)", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image
            src="https://raw.githubusercontent.com/Hey-Salad/.github/main/HeySalad%20Logo%20Black.svg"
            alt="HeySalad"
            width={100} height={28}
            style={{ objectFit: "contain" }}
            unoptimized
            className="kiosk-logo"
          />
          <span style={{ width: 1, height: 24, background: "#ece5e5" }} />
          <span style={{
            background: "#fbe4e4", color: "#ed4c4c",
            borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700,
          }}>
            Kiosk
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="kiosk-location" style={{ fontSize: 12, color: "#7a6e70", fontWeight: 500 }}>{location}</span>
          <span style={{
            background: "#f6f1f1", color: "#4a3f41",
            borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600,
          }}>
            {normalizedPaymentProvider}
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="kiosk-grid" style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 16px 48px", display: "grid", gap: 20, alignItems: "start" }}>

        {/* ── Left: Menu ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ marginBottom: 16 }}>
            <p className="kiosk-subtitle" style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#b7adae" }}>Today&apos;s menu</p>
            <h1 className="kiosk-title" style={{ margin: 0, fontFamily: "Grandstander, system-ui, sans-serif", fontSize: 28, fontWeight: 800, color: "#1f1416", letterSpacing: "-0.02em" }}>
              Choose your bowl
            </h1>
          </div>

          <div className="kiosk-card-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            {salads.map((salad, i) => {
              const qty = basket.find(b => b.saladId === salad.id)?.quantity ?? 0;
              const gradient = saladGradients[i % saladGradients.length];
              return (
                <article key={salad.id} style={{
                  background: "#fff", borderRadius: 12, border: "1px solid #ece5e5",
                  overflow: "hidden", boxShadow: "0 2px 12px rgba(31,20,22,0.05)",
                  transition: "box-shadow 0.15s ease", display: "flex", flexDirection: "column",
                }}>
                  {/* Photo band (with gradient fallback) */}
                  <div className="kiosk-card-band" style={{
                    height: 65, position: "relative", display: "flex",
                    alignItems: "flex-start", justifyContent: "flex-end",
                    padding: "10px 12px", flexShrink: 0,
                    overflow: "hidden",
                  }}>
                    {/* Photo image */}
                    {salad.image && (
                      <Image
                        src={salad.image}
                        alt={salad.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        style={{ objectFit: "cover", zIndex: 0 }}
                        unoptimized
                      />
                    )}
                    {/* Gradient overlay for readability */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(135deg, rgba(31,20,22,0.15) 0%, rgba(31,20,22,0.02) 60%, rgba(31,20,22,0.25) 100%)",
                      zIndex: 1,
                    }} />
                    {!salad.image && (
                      <div style={{ position: "absolute", inset: 0, background: gradient, zIndex: 0 }} />
                    )}
                    {/* Dietary tags (on top of overlay) */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", position: "relative", zIndex: 2 }}>
                      {salad.dietary.map(tag => {
                        const c = tagColour[tag] ?? { bg: "#f6f1f1", text: "#4a3f41" };
                        return (
                          <span key={tag} style={{
                            background: c.bg, color: c.text,
                            borderRadius: 999, padding: "2px 8px",
                            fontSize: 10, fontWeight: 600,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          }}>{tag}</span>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ padding: "14px 14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <h2 className="kiosk-card-name" style={{ margin: 0, fontFamily: "Grandstander, system-ui, sans-serif", fontSize: 15, fontWeight: 700, color: "#1f1416", lineHeight: 1.3, flex: 1 }}>{salad.name}</h2>
                      <span className="kiosk-card-price" style={{ fontWeight: 700, color: "#ed4c4c", fontSize: 14, marginLeft: 10, whiteSpace: "nowrap" }}>{usd.format(salad.price)}</span>
                    </div>
                    <p className="kiosk-card-desc" style={{ margin: "0 0 4px", fontSize: 13, color: "#7a6e70", lineHeight: 1.5 }}>{salad.description}</p>
                    <p style={{ margin: "0 0 14px", fontSize: 11, color: "#b7adae" }}>{salad.calories} kcal · {salad.protein}g protein</p>

                    {qty === 0 ? (
                      <button onClick={() => add(salad.id)} style={{
                        width: "100%", padding: "10px 0", borderRadius: 999,
                        background: "#ed4c4c", color: "#fff", border: "none",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit",
                        boxShadow: "0 4px 12px rgba(237,76,76,0.28)",
                        minHeight: 44,
                      }}>
                        Add to order
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <button onClick={() => rem(salad.id)} style={qtyBtn}>−</button>
                        <span className="kiosk-qty" style={{ fontWeight: 700, fontSize: 16, color: "#1f1416", minWidth: 28, textAlign: "center" }}>{qty}</span>
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
        <div className="kiosk-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{usd.format(e.salad.price * e.quantity)}</span>
                    <button onClick={() => rem(e.salad.id)} className="kiosk-basket-remove" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fca5a5", borderRadius: "50%", width: 26, height: 26, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, fontWeight: 700, flexShrink: 0 }}>×</button>
                  </div>
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
              disabled={!basketItems.length || checkoutBusy || (usesAirwallexDropIn && !awxReady)}
              style={{
                marginTop: 14, width: "100%", padding: "14px 0", borderRadius: 999, border: "none",
                background: basketItems.length ? "#ed4c4c" : "rgba(255,255,255,0.08)",
                color: basketItems.length ? "#fff" : "#7a6e70",
                fontSize: 16, fontWeight: 700,
                cursor: basketItems.length && !checkoutBusy && !(usesAirwallexDropIn && !awxReady) ? "pointer" : "not-allowed",
                boxShadow: basketItems.length ? "0 4px 16px rgba(237,76,76,0.35)" : "none",
                fontFamily: "inherit",
                transition: "background 0.12s ease",
                minHeight: 48,
              }}
            >
              <span className="kiosk-pay-text">
                {checkoutBusy
                  ? "Starting checkout…"
                  : usesAirwallexDropIn && !awxReady
                    ? "Loading payment…"
                    : `Pay now — ${usd.format(total)}`}
              </span>
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
                <p className="kiosk-sal-title" style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1f1416" }}>Ask Sal</p>
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
                  borderRadius: 999, padding: "6px 12px", fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", minHeight: 32,
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
                className="kiosk-sal-input" style={{
                  flex: 1, padding: "12px", borderRadius: 12,
                  border: "1.5px solid #ece5e5", fontSize: 16,
                  fontFamily: "inherit", outline: "none",
                  background: "#fff8f6", color: "#1f1416",
                }}
              />
              <button
                onClick={() => void askSal(question)}
                disabled={assistantBusy || !question.trim()}
                className="kiosk-sal-send" style={{
                  padding: "12px 20px", borderRadius: 999,
                  background: "#ed4c4c", color: "#fff", border: "none",
                  fontSize: 16, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", opacity: assistantBusy ? 0.6 : 1,
                  boxShadow: "0 2px 8px rgba(237,76,76,0.25)",
                  minWidth: 44, minHeight: 44, flexShrink: 0,
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

      {/* ── Airwallex Drop-in Payment Modal ── */}
      {paymentModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(31,20,22,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "24px 24px 32px",
            width: "100%", maxWidth: 520,
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b7adae" }}>Secure payment</p>
                <h2 style={{ margin: 0, fontFamily: "Grandstander, system-ui, sans-serif", fontSize: 20, fontWeight: 800, color: "#1f1416" }}>
                  Pay {usd.format(total)}
                </h2>
              </div>
              <button
                onClick={() => setPaymentModal(null)}
                style={{ border: "none", background: "#f6f1f1", borderRadius: "50%", width: 36, height: 36, fontSize: 20, cursor: "pointer", color: "#7a6e70", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
              >×</button>
            </div>
            <div id="awx-drop-in" style={{ minHeight: AIRWALLEX_DROPIN_MIN_HEIGHT }} />
          </div>
        </div>
      )}

      <style>{`
        /* ── Animations ── */
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }

        /* ── Base interactive ── */
        button:hover:not(:disabled) { filter: brightness(0.96); }
        button:active:not(:disabled) { transform: scale(0.97); }
        article:hover { box-shadow: 0 6px 24px rgba(31,20,22,0.1) !important; }

        /* ══════════════════════════════════════════════════════════════
           RESPONSIVE — Mobile-first defaults (≤ 479px)
           ══════════════════════════════════════════════════════════════ */
        .kiosk-grid {
          grid-template-columns: 1fr !important;
          padding: 16px 12px 32px !important;
        }
        .kiosk-sidebar {
          position: static; top: auto;
        }
        .kiosk-subtitle { font-size: 10px !important; }
        .kiosk-title { font-size: 22px !important; }
        .kiosk-card-grid {
          grid-template-columns: 1fr !important;
          gap: 10px !important;
        }
        .kiosk-card-band { height: 65px !important; }
        .kiosk-card-price { font-size: 14px !important; }
        .kiosk-qty { font-size: 16px !important; }
        .kiosk-basket-remove { display: flex !important; }
        .kiosk-sal-input { font-size: 16px !important; padding: 12px !important; }
        .kiosk-sal-send { padding: 12px 20px !important; font-size: 16px !important; }
        .kiosk-logo { width: 90px !important; height: 24px !important; }

        /* ═══════════════════════════════════
           Tiny phones (≤ 374px)
           ═══════════════════════════════════ */
        @media (max-width: 374px) {
          .kiosk-title { font-size: 18px !important; }
          .kiosk-card-band { height: 55px !important; }
          .kiosk-card-name { font-size: 13px !important; }
          .kiosk-logo { width: 75px !important; height: 20px !important; }
          .kiosk-location { font-size: 11px !important; }
        }

        /* ═══════════════════════════════════
           Regular phones (≥ 480px)
           ═══════════════════════════════════ */
        @media (min-width: 480px) {
          .kiosk-grid { padding: 20px 16px 40px !important; }
          .kiosk-title { font-size: 25px !important; }
          .kiosk-card-band { height: 80px !important; }
          .kiosk-logo { width: 100px !important; height: 28px !important; }
        }

        /* ═══════════════════════════════════
           Medium / small tablet (≥ 640px)
           ═══════════════════════════════════ */
        @media (min-width: 640px) {
          .kiosk-grid { padding: 24px 20px 48px !important; }
          .kiosk-card-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .kiosk-card-band { height: 88px !important; }
          .kiosk-title { font-size: 27px !important; }
          .kiosk-card-name { font-size: 15px !important; }
        }

        /* ═══════════════════════════════════
           Tablet-landscape / Desktop (≥ 1024px)
           ═══════════════════════════════════ */
        @media (min-width: 1024px) {
          .kiosk-grid {
            grid-template-columns: 1fr 380px !important;
            padding: 24px 24px 48px !important;
          }
          .kiosk-card-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 14px !important;
          }
          .kiosk-sidebar {
            position: sticky; top: 80px;
          }
          .kiosk-card-band { height: 100px !important; }
          .kiosk-card-price { font-size: 16px !important; }
          .kiosk-title { font-size: 28px !important; }
          .kiosk-subtitle { font-size: 11px !important; }
          .kiosk-qty { font-size: 18px !important; }
          .kiosk-sal-input { font-size: 13px !important; padding: 9px 12px !important; }
          .kiosk-sal-send { padding: 9px 14px !important; font-size: 13px !important; }
          .kiosk-basket-remove { display: none !important; }
          .kiosk-logo { width: 120px !important; height: 32px !important; }
        }

        /* ═══════════════════════════════════
           Wide desktop (≥ 1400px)
           ═══════════════════════════════════ */
        @media (min-width: 1400px) {
          .kiosk-grid {
            grid-template-columns: 1fr 420px !important;
          }
        }

        /* ── Card band image animation ── */
        .kiosk-card-band img {
          transition: transform 0.4s ease;
        }
        article:hover .kiosk-card-band img {
          transform: scale(1.05);
        }
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
