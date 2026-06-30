export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { KIOSK_CONFIG, KIOSK_SALADS } from "@kiosk/catalog";

export async function GET() {
  return NextResponse.json({
    business: {
      name: KIOSK_CONFIG.name,
      location: KIOSK_CONFIG.location,
      slug: KIOSK_CONFIG.slug
    },
    salads: KIOSK_SALADS
  });
}
