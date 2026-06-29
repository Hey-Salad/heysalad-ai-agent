import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { runSalesAgent } from "@/lib/agent";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.prospectName || !body.prospectType) {
      return NextResponse.json(
        { error: "prospectName and prospectType are required" },
        { status: 400 }
      );
    }

    const response = await runSalesAgent(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Sales agent error:", error);
    return NextResponse.json(
      { error: "Agent execution failed" },
      { status: 500 }
    );
  }
}
