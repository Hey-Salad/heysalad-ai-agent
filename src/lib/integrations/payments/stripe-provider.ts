import Stripe from "stripe";
import type {
  PaymentProvider,
  CheckoutParams,
  CheckoutResult,
  WebhookResult,
  RefundResult,
} from "../types";

function getClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const stripe = getClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: params.currency,
            unit_amount: Math.round(params.amount * 100),
            product_data: { name: params.description },
          },
          quantity: 1,
        },
      ],
      success_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });

    return {
      checkoutUrl: session.url!,
      sessionId: session.id,
      provider: "stripe",
    };
  },

  async handleWebhook(payload: unknown, signature: string): Promise<WebhookResult> {
    const stripe = getClient();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

    const event = stripe.webhooks.constructEvent(
      payload as string | Buffer,
      signature,
      secret
    );

    return {
      event: event.type,
      transactionId: (event.data.object as { id?: string }).id,
      status:
        event.type === "checkout.session.completed"
          ? "succeeded"
          : event.type.includes("failed")
            ? "failed"
            : "pending",
      data: event.data.object as unknown as Record<string, unknown>,
    };
  },

  async refund(transactionId: string, amount?: number): Promise<RefundResult> {
    const stripe = getClient();
    const refund = await stripe.refunds.create({
      payment_intent: transactionId,
      ...(amount ? { amount: Math.round(amount * 100) } : {}),
    });

    return {
      refundId: refund.id,
      status: refund.status === "succeeded" ? "succeeded" : "pending",
      amount: (refund.amount ?? 0) / 100,
      currency: refund.currency ?? "gbp",
    };
  },
};
