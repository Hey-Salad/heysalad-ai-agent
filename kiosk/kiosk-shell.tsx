"use client";

import { useMemo, useState } from "react";
import { CreditCard, Leaf, MessageSquareText, ShoppingBasket, Sparkles } from "lucide-react";
import type { KioskSalad } from "@kiosk/catalog";

type BasketEntry = {
  saladId: string;
  quantity: number;
};

type AssistantReply = {
  question: string;
  answer: string;
  intent?: string;
  escalated?: boolean;
};

type Props = {
  businessName: string;
  location: string;
  quickPrompts: string[];
  salads: KioskSalad[];
  paymentProvider: string;
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP"
});

export function KioskShell({
  businessName,
  location,
  quickPrompts,
  salads,
  paymentProvider
}: Props) {
  const [basket, setBasket] = useState<BasketEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [assistantReply, setAssistantReply] = useState<AssistantReply | null>(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const basketItems = useMemo(() => {
    return basket
      .map((entry) => {
        const salad = salads.find((item) => item.id === entry.saladId);
        return salad ? { ...entry, salad } : null;
      })
      .filter(Boolean) as Array<BasketEntry & { salad: KioskSalad }>;
  }, [basket, salads]);

  const total = basketItems.reduce((sum, entry) => sum + entry.salad.price * entry.quantity, 0);

  function addSalad(saladId: string) {
    setBasket((current) => {
      const existing = current.find((item) => item.saladId === saladId);
      if (existing) {
        return current.map((item) =>
          item.saladId === saladId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { saladId, quantity: 1 }];
    });
  }

  function removeSalad(saladId: string) {
    setBasket((current) =>
      current
        .map((item) =>
          item.saladId === saladId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function askAssistant(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setAssistantBusy(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/kiosk/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Assistant request failed");
      }

      setAssistantReply({
        question: trimmed,
        answer: payload.message,
        intent: payload.intent,
        escalated: payload.shouldEscalate
      });
      setQuestion("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown assistant error";
      setStatusMessage(message);
    } finally {
      setAssistantBusy(false);
    }
  }

  async function startCheckout() {
    if (!basketItems.length || checkoutBusy) return;

    setCheckoutBusy(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/kiosk/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: basketItems.map((entry) => ({
            saladId: entry.salad.id,
            quantity: entry.quantity
          })),
          provider: paymentProvider
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Checkout failed");
      }

      setStatusMessage(`Redirecting to ${payload.provider} checkout...`);
      if (payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown checkout error";
      setStatusMessage(message);
    } finally {
      setCheckoutBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(254,215,170,0.45),_transparent_30%),linear-gradient(180deg,_#fdf6ec_0%,_#f5eadb_100%)] text-stone-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-6 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[28px] border border-stone-200/70 bg-white/80 px-6 py-5 shadow-[0_20px_60px_rgba(120,53,15,0.08)] backdrop-blur lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Kiosk Mode
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{businessName}</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Touch-first ordering with the HeySalad host agent on the side and provider-routed checkout underneath.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
            <span className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2">
              {location}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
              Agent linked
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sky-700">
              {paymentProvider}
            </span>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <section className="rounded-[32px] border border-stone-200/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(120,53,15,0.08)] backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Salad Board
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Choose your bowl</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-600">
                <Leaf className="h-4 w-4" />
                {salads.length} salads
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {salads.map((salad) => {
                const currentQuantity = basket.find((item) => item.saladId === salad.id)?.quantity ?? 0;

                return (
                  <article
                    key={salad.id}
                    className="overflow-hidden rounded-[28px] border border-stone-200 bg-stone-50/70"
                  >
                    <div className={`h-28 bg-gradient-to-br ${salad.accent}`} />
                    <div className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold">{salad.name}</h3>
                          <p className="mt-1 text-sm leading-6 text-stone-600">{salad.description}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-stone-700 shadow-sm">
                          {currency.format(salad.price)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {salad.dietary.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-stone-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm text-stone-600">
                        <span>{salad.calories} cal</span>
                        <span>{salad.protein}g protein</span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => addSalad(salad.id)}
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800"
                        >
                          Add bowl
                        </button>
                        {currentQuantity > 0 ? (
                          <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1">
                            <button
                              type="button"
                              onClick={() => removeSalad(salad.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-lg font-semibold text-stone-700"
                            >
                              -
                            </button>
                            <span className="min-w-8 text-center text-sm font-semibold">{currentQuantity}</span>
                            <button
                              type="button"
                              onClick={() => addSalad(salad.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-950 text-lg font-semibold text-white"
                            >
                              +
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[32px] border border-stone-200/70 bg-white/88 p-6 shadow-[0_20px_60px_rgba(120,53,15,0.08)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                    Host Agent
                  </p>
                  <h2 className="text-xl font-semibold">Ask for a recommendation</h2>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void askAssistant(prompt)}
                    className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:bg-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about protein, allergens, or value"
                  className="min-h-12 flex-1 rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none ring-0 placeholder:text-stone-400 focus:border-stone-400"
                />
                <button
                  type="button"
                  onClick={() => void askAssistant(question)}
                  disabled={assistantBusy}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  {assistantBusy ? "Thinking..." : "Ask"}
                </button>
              </div>

              <div className="mt-5 min-h-36 rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                {assistantReply ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                      {assistantReply.intent || "Recommendation"}
                    </p>
                    <p className="text-sm text-stone-500">You asked: {assistantReply.question}</p>
                    <p className="text-base leading-7 text-stone-800">{assistantReply.answer}</p>
                    {assistantReply.escalated ? (
                      <p className="text-sm font-medium text-amber-700">
                        The host agent marked this for staff escalation.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-stone-500">
                    The kiosk uses the same host agent as the voice platform, so menu questions and simple guidance come through one shared intelligence layer.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-stone-200/70 bg-stone-950 p-6 text-white shadow-[0_20px_60px_rgba(28,25,23,0.25)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-white">
                  <ShoppingBasket className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
                    Basket
                  </p>
                  <h2 className="text-xl font-semibold">Ready for checkout</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {basketItems.length ? (
                  basketItems.map((entry) => (
                    <div
                      key={entry.salad.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{entry.salad.name}</p>
                        <p className="text-sm text-stone-300">
                          {entry.quantity} x {currency.format(entry.salad.price)}
                        </p>
                      </div>
                      <span className="font-semibold">
                        {currency.format(entry.salad.price * entry.quantity)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-stone-300">
                    Your order is empty. Add a salad to start the Airwallex checkout flow.
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-4">
                <span className="text-sm uppercase tracking-[0.24em] text-stone-300">Total</span>
                <span className="text-2xl font-semibold">{currency.format(total)}</span>
              </div>

              <button
                type="button"
                disabled={!basketItems.length || checkoutBusy}
                onClick={() => void startCheckout()}
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-sky-400 px-5 text-base font-semibold text-stone-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {checkoutBusy ? "Starting checkout..." : `Checkout with ${paymentProvider}`}
              </button>

              {statusMessage ? (
                <p className="mt-4 text-sm leading-6 text-stone-300">{statusMessage}</p>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
