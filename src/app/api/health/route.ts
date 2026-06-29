import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "0.1.0",
    agents: ["host", "knowledge", "sales", "operations", "compliance"],
  });
}
