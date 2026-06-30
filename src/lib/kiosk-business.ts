import { AgentType, BusinessType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { KIOSK_CONFIG } from "@kiosk/catalog";

const HOST_CONFIG_ID = "heysalad-kiosk-host";

export async function ensureKioskBusiness() {
  const business = await db.business.upsert({
    where: { slug: KIOSK_CONFIG.slug },
    update: {
      name: KIOSK_CONFIG.name,
      businessType: BusinessType[KIOSK_CONFIG.businessType],
      timezone: "Europe/London",
      currency: "GBP"
    },
    create: {
      name: KIOSK_CONFIG.name,
      slug: KIOSK_CONFIG.slug,
      businessType: BusinessType[KIOSK_CONFIG.businessType],
      timezone: "Europe/London",
      currency: "GBP"
    }
  });

  await db.agentConfig.upsert({
    where: { id: HOST_CONFIG_ID },
    update: {
      businessId: business.id,
      agentName: `${KIOSK_CONFIG.name} Host`,
      agentType: AgentType.HOST,
      greeting: KIOSK_CONFIG.greeting,
      tone: "clear, fast, kiosk-friendly",
      active: true
    },
    create: {
      id: HOST_CONFIG_ID,
      businessId: business.id,
      agentName: `${KIOSK_CONFIG.name} Host`,
      agentType: AgentType.HOST,
      greeting: KIOSK_CONFIG.greeting,
      tone: "clear, fast, kiosk-friendly",
      active: true
    }
  });

  return business;
}
