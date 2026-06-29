import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { runOperationsAgent } from "@/lib/agent";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.businessName || !body.query) {
      return NextResponse.json(
        { error: "businessName and query are required" },
        { status: 400 }
      );
    }

    const response = await runOperationsAgent(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Operations agent error:", error);
    return NextResponse.json(
      { error: "Agent execution failed" },
      { status: 500 }
    );
  }
}
