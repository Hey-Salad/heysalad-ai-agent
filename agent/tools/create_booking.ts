import { z } from "zod";
import { defineTool } from "eve";

export default defineTool({
  description:
    "Create a booking for a customer. Only call when all required details are confirmed.",
  parameters: z.object({
    businessId: z.string(),
    customerName: z.string(),
    customerPhone: z.string(),
    partySize: z.number().min(1),
    date: z.string().describe("ISO date string, e.g. 2026-07-01"),
    time: z.string().describe("24h time, e.g. 19:30"),
    specialRequests: z.string().optional(),
    conversationId: z.string().optional(),
  }),
  async execute(params) {
    const baseUrl = process.env.HEYSALAD_API_URL;
    if (!baseUrl) {
      return { error: "HEYSALAD_API_URL not configured" };
    }

    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HEYSALAD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        source: "AI_AGENT",
        status: "CONFIRMED",
      }),
    });

    if (!res.ok) {
      return { error: `Failed to create booking: ${res.status}` };
    }

    const booking = await res.json();
    return {
      success: true,
      bookingId: booking.id,
      message: `Booking confirmed for ${params.customerName}, party of ${params.partySize} on ${params.date} at ${params.time}.`,
    };
  },
});
