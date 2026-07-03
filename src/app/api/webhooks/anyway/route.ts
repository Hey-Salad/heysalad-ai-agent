export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { KioskOrderStatus, Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

type AnywayWebhookEvent = {
  type: string;
  timestamp?: string;
  data?: {
    order?: AnywayOrder;
  };
};

type AnywayOrder = {
  orderId?: string;
  merchantReference?: string | null;
  status?: string;
  amountCents?: number;
  currency?: string;
  paymentLinkId?: string | null;
  updatedAt?: string;
  crypto?: {
    txHash?: string | null;
    payer?: string | null;
  } | null;
};

type SigningKeyResponse = {
  publicKey?: string;
};

let signingKeyPromise: Promise<string> | null = null;

async function getSigningKey() {
  if (!signingKeyPromise) {
    signingKeyPromise = fetch("https://api.anyway.sh/v1/webhooks/signing-key")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Anyway signing key fetch failed: ${response.status}`);
        }

        const data = (await response.json()) as SigningKeyResponse;
        if (!data.publicKey) {
          throw new Error("Anyway signing key response did not include publicKey");
        }

        return data.publicKey;
      });
  }

  return signingKeyPromise;
}

function mapOrderStatus(eventType: string, status?: string) {
  if (eventType === "order.paid" || status === "PAID") return KioskOrderStatus.PAID;
  if (eventType === "order.failed" || status === "FAILED") return KioskOrderStatus.FAILED;
  if (status === "CANCELED" || status === "CANCELLED") return KioskOrderStatus.CANCELLED;
  return KioskOrderStatus.PENDING;
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

async function findKioskOrder(order?: AnywayOrder) {
  if (!order) return null;

  const db = getDb();
  const merchantReference = order.merchantReference?.trim();
  if (merchantReference) {
    const byReference = await db.kioskOrder.findUnique({ where: { id: merchantReference } });
    if (byReference) return byReference;
  }

  if (order.orderId) {
    return db.kioskOrder.findFirst({ where: { providerOrderId: order.orderId } });
  }

  return null;
}

export async function POST(request: NextRequest) {
  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json({ error: "Missing Standard Webhooks headers" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: AnywayWebhookEvent;

  try {
    const publicKey = await getSigningKey();
    const webhook = new Webhook(publicKey);
    event = webhook.verify(rawBody, {
      "webhook-id": webhookId,
      "webhook-timestamp": webhookTimestamp,
      "webhook-signature": webhookSignature,
    }) as AnywayWebhookEvent;
  } catch (error) {
    console.error("Anyway webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const db = getDb();
  const order = event.data?.order;
  const kioskOrder = await findKioskOrder(order);
  const providerOrderId = order?.orderId;

  try {
    await db.kioskPaymentEvent.create({
      data: {
        kioskOrderId: kioskOrder?.id,
        webhookId,
        eventType: event.type,
        providerOrderId,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  if (kioskOrder && order) {
    const nextStatus = mapOrderStatus(event.type, order.status);
    const updateData: Prisma.KioskOrderUpdateInput = {
      providerOrderId: providerOrderId ?? undefined,
      paymentLinkId: order.paymentLinkId ?? undefined,
      txHash: order.crypto?.txHash ?? undefined,
      payerAddress: order.crypto?.payer ?? undefined,
    };

    if (!(kioskOrder.status === KioskOrderStatus.PAID && nextStatus === KioskOrderStatus.PENDING)) {
      updateData.status = nextStatus;
    }

    if (nextStatus === KioskOrderStatus.PAID) {
      updateData.paidAt = parseDate(order.updatedAt || event.timestamp) ?? new Date();
    }

    await db.kioskOrder.update({
      where: { id: kioskOrder.id },
      data: updateData,
    });
  }

  return NextResponse.json({
    received: true,
    linked: Boolean(kioskOrder),
    eventType: event.type,
  });
}
