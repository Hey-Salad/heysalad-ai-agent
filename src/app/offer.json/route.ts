export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { buildKioskAgentOffer, getPublicAppUrl } from "@kiosk/anyway";

export async function GET() {
  return NextResponse.json(buildKioskAgentOffer(getPublicAppUrl()));
}
