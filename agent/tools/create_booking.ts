import { defineTool } from "eve/tools";
import { z } from "zod";
import { db } from "../../src/lib/db";

export default defineTool({
  description: "Create a confirmed booking for a food business after caller details and booking time are clear.",
  inputSchema: z.object({
    businessId: z.string().min(1),
    locationId: z.string().min(1).optional(),
    conversationId: z.string().min(1).optional(),
    customerName: z.string().min(1),
    customerPhone: z.string().min(3),
    customerEmail: z.string().email().optional(),
    partySize: z.number().int().positive(),
    bookingStartIso: z.string().datetime(),
    specialRequests: z.string().optional(),
  }),
  async execute(input) {
    let customer = await db.customer.findFirst({
      where: {
        businessId: input.businessId,
        phone: input.customerPhone,
      },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          businessId: input.businessId,
          locationId: input.locationId,
          name: input.customerName,
          phone: input.customerPhone,
          email: input.customerEmail,
        },
      });
    }

    const booking = await db.booking.create({
      data: {
        businessId: input.businessId,
        locationId: input.locationId,
        conversationId: input.conversationId,
        customerId: customer.id,
        source: "AI_PHONE",
        status: "CONFIRMED",
        partySize: input.partySize,
        bookingStart: new Date(input.bookingStartIso),
        specialRequests: input.specialRequests,
      },
    });

    return {
      ok: true,
      bookingId: booking.id,
      customerId: customer.id,
      bookingStart: input.bookingStartIso,
      status: booking.status,
    };
  },
});
