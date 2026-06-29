import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { runHostAgent, type HostInput } from "@/lib/agent";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as HostInput;

    if (!body.businessName || !body.customerMessage) {
      return NextResponse.json(
        { error: "businessName and customerMessage are required" },
        { status: 400 }
      );
    }

    const response = await runHostAgent(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Host agent error:", error);
    return NextResponse.json(
      { error: "Agent execution failed" },
      { status: 500 }
    );
  }
}
