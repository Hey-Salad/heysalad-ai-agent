import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { isEnabled } from "@/lib/integrations";
import { runMarketplaceDemo } from "@/lib/integrations/marketplace/coralos";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEnabled("HEYSALAD_CORALOS_ENABLED") || !isEnabled("HEYSALAD_SOLANA_ENABLED")) {
    return NextResponse.json(
      { error: "Set HEYSALAD_CORALOS_ENABLED=true and HEYSALAD_SOLANA_ENABLED=true" },
      { status: 400 }
    );
  }

  try {
    const { businessId } = await request.json();
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const result = await runMarketplaceDemo(businessId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Marketplace demo error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Demo failed" },
      { status: 500 }
    );
  }
}
