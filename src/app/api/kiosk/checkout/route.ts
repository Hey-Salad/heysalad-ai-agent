export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getSaladById, KIOSK_CONFIG } from "@kiosk/catalog";
import { getPaymentProvider } from "@/lib/integrations/payments";

type CheckoutItem = {
  saladId: string;
  quantity: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? (body.items as CheckoutItem[]) : [];
    const providerName = (
      typeof body.provider === "string" && body.provider
        ? body.provider
        : process.env.HEYSALAD_KIOSK_PAYMENT_PROVIDER || "airwallex"
    ).trim();

    if (!items.length) {
      return NextResponse.json({ error: "At least one checkout item is required" }, { status: 400 });
    }

    const orderItems = items
      .map((item) => {
        const salad = getSaladById(item.saladId);
        if (!salad || item.quantity <= 0) return null;
        return { salad, quantity: item.quantity };
      })
      .filter(Boolean) as Array<{ salad: NonNullable<ReturnType<typeof getSaladById>>; quantity: number }>;

    if (!orderItems.length) {
      return NextResponse.json({ error: "No valid kiosk items found for checkout" }, { status: 400 });
    }

    const total = orderItems.reduce((sum, entry) => sum + entry.salad.price * entry.quantity, 0);
    const itemCount = orderItems.reduce((sum, entry) => sum + entry.quantity, 0);
    const orderId = `kiosk_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const paymentProvider = getPaymentProvider(providerName);
    const checkout = await paymentProvider.createCheckout({
      amount: Number(total.toFixed(2)),
      currency: "GBP",
      description: `${KIOSK_CONFIG.name} order`,
      metadata: {
        orderId,
        kioskSlug: KIOSK_CONFIG.slug,
        itemCount: String(itemCount)
      },
      returnUrl: `${appUrl}/kiosk?status=success&orderId=${orderId}`,
      cancelUrl: `${appUrl}/kiosk?status=cancelled&orderId=${orderId}`
    });

    return NextResponse.json({
      orderId,
      itemCount,
      total: Number(total.toFixed(2)),
      currency: "GBP",
      provider: checkout.provider,
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId
    });
  } catch (error) {
    console.error("Kiosk checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kiosk checkout failed" },
      { status: 500 }
    );
  }
}
