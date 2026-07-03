export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { KioskOrderStatus, Prisma } from "@/generated/prisma/client";
import { getSaladById, KIOSK_CONFIG } from "@kiosk/catalog";
import { buildAnywayAgentPayment, getAnywayKioskCheckoutConfig, getPublicAppUrl } from "@kiosk/anyway";
import { getDb } from "@/lib/db";
import { getPaymentProvider } from "@/lib/integrations/payments";
import { createBillingCheckout } from "@/lib/integrations/payments/airwallex-billing";

type CheckoutItem = {
  saladId: string;
  quantity: number;
};

export async function POST(request: NextRequest) {
  let orderId: string | null = null;

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? (body.items as CheckoutItem[]) : [];
    const providerName = (
      typeof body.provider === "string" && body.provider
        ? body.provider
        : process.env.HEYSALAD_KIOSK_PAYMENT_PROVIDER || "airwallex"
    ).trim().toLowerCase();

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
    const amount = Number(total.toFixed(2));
    orderId = `kiosk_${randomUUID()}`;
    const appUrl = getPublicAppUrl();

    const successUrl = `${appUrl}/?status=success&orderId=${orderId}`;
    const cancelUrl = `${appUrl}/?status=cancelled&orderId=${orderId}`;
    const persistedItems = orderItems.map((entry) => ({
      saladId: entry.salad.id,
      name: entry.salad.name,
      quantity: entry.quantity,
      unitPrice: entry.salad.price,
      lineTotal: Number((entry.salad.price * entry.quantity).toFixed(2)),
    }));
    const db = getDb();

    await db.kioskOrder.create({
      data: {
        id: orderId,
        kioskSlug: KIOSK_CONFIG.slug,
        provider: providerName,
        status: KioskOrderStatus.PENDING,
        amount,
        currency: "USD",
        itemCount,
        itemsJson: persistedItems as Prisma.InputJsonValue,
      },
    });

    if (providerName === "anyway") {
      const anyway = getAnywayKioskCheckoutConfig();
      if (!anyway) {
        throw new Error("Anyway kiosk checkout is not configured");
      }

      await db.kioskOrder.update({
        where: { id: orderId },
        data: {
          checkoutUrl: anyway.paymentLinkUrl,
          agentPayUrl: anyway.agentPayUrl,
          paymentLinkId: anyway.paymentLinkId,
        },
      });

      return NextResponse.json({
        orderId,
        itemCount,
        total: amount,
        currency: "USD",
        provider: "anyway",
        checkoutUrl: anyway.paymentLinkUrl,
        agentPayUrl: anyway.agentPayUrl,
        payment: buildAnywayAgentPayment(anyway, { orderId, amount, itemCount }),
        successUrl,
        cancelUrl,
      });
    }

    if (providerName === "airwallex_billing") {
      const billingCheckout = await createBillingCheckout({
        items: orderItems.map((entry) => ({ saladId: entry.salad.id, quantity: entry.quantity })),
        successUrl,
        backUrl: cancelUrl,
        metadata: { orderId, kioskSlug: KIOSK_CONFIG.slug, itemCount: String(itemCount) },
      });

      await db.kioskOrder.update({
        where: { id: orderId },
        data: {
          checkoutUrl: billingCheckout.checkoutUrl,
          providerOrderId: billingCheckout.checkoutId,
        },
      });

      return NextResponse.json({
        orderId,
        itemCount,
        total: amount,
        currency: "USD",
        provider: billingCheckout.provider,
        checkoutUrl: billingCheckout.checkoutUrl,
        sessionId: billingCheckout.checkoutId,
        successUrl,
        cancelUrl,
      });
    }

    const paymentProvider = getPaymentProvider(providerName);
    const checkout = await paymentProvider.createCheckout({
      amount,
      currency: "USD",
      description: `${KIOSK_CONFIG.name} order`,
      metadata: {
        orderId,
        kioskSlug: KIOSK_CONFIG.slug,
        itemCount: String(itemCount),
      },
      returnUrl: successUrl,
      cancelUrl,
    });

    await db.kioskOrder.update({
      where: { id: orderId },
      data: {
        checkoutUrl: checkout.checkoutUrl,
        providerOrderId: checkout.sessionId ?? checkout.intentId,
      },
    });

    return NextResponse.json({
      orderId,
      itemCount,
      total: amount,
      currency: "USD",
      provider: checkout.provider,
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
      intentId: checkout.intentId,
      clientSecret: checkout.clientSecret,
      successUrl,
      cancelUrl,
    });
  } catch (error) {
    console.error("Kiosk checkout error:", error);
    if (orderId) {
      try {
        await getDb().kioskOrder.update({
          where: { id: orderId },
          data: { status: KioskOrderStatus.FAILED },
        });
      } catch {
        // Preserve the original checkout failure for the response.
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kiosk checkout failed" },
      { status: 500 }
    );
  }
}
