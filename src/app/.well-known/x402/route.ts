export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { buildKioskAgentOffer, getAnywayKioskCheckoutConfig, getPublicAppUrl } from "@kiosk/anyway";

export async function GET() {
  const appUrl = getPublicAppUrl();
  const offer = buildKioskAgentOffer(appUrl);
  const anyway = getAnywayKioskCheckoutConfig();

  return NextResponse.json({
    x402Version: 1,
    resource: `${appUrl}/api/kiosk/checkout`,
    accepts: anyway
      ? [
          {
            scheme: "anyway-agent-pay",
            network: "base",
            asset: "USDC",
            paymentLinkId: anyway.paymentLinkId,
            instructionsUrl: anyway.agentPayUrl,
          },
        ]
      : [],
    offer,
  });
}
