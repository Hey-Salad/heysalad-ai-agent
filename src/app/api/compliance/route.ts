import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { runComplianceAgent } from "@/lib/agent";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.businessName || !body.transcript) {
      return NextResponse.json(
        { error: "businessName and transcript are required" },
        { status: 400 }
      );
    }

    const response = await runComplianceAgent(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Compliance agent error:", error);
    return NextResponse.json(
      { error: "Agent execution failed" },
      { status: 500 }
    );
  }
}
