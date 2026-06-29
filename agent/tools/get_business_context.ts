import { defineTool } from "eve/tools";
import { z } from "zod";
import { db } from "../../src/lib/db";

export default defineTool({
  description: "Load approved business, location, agent, and knowledge context for a HeySalad® AI tenant.",
  inputSchema: z.object({
    businessId: z.string().min(1),
    locationId: z.string().min(1).optional(),
  }),
  async execute({ businessId, locationId }) {
    const business = await db.business.findUnique({
      where: { id: businessId },
      include: {
        locations: locationId ? { where: { id: locationId }, take: 1 } : { take: 3 },
        agentConfigs: { where: { active: true }, take: 5 },
        knowledgeSources: {
          where: { status: "ACTIVE" },
          include: { knowledgeChunks: { take: 12 } },
          take: 8,
        },
        catalogueItems: { take: 20 },
      },
    });

    if (!business) {
      return { ok: false, error: "Business not found" };
    }

    return {
      ok: true,
      business: {
        id: business.id,
        name: business.name,
        businessType: business.businessType,
        status: business.status,
        publicPhone: business.publicPhone,
        aiPhone: business.aiPhone,
        subscriptionStatus: business.subscriptionStatus,
      },
      locations: business.locations.map((location) => ({
        id: location.id,
        name: location.name,
        city: location.city,
        phone: location.phone,
        openingHours: location.openingHoursJson,
        serviceModes: location.serviceModesJson,
      })),
      agentConfigs: business.agentConfigs.map((config) => ({
        agentType: config.agentType,
        agentName: config.agentName,
        greeting: config.greeting,
        tone: config.tone,
        allowedActions: config.allowedActionsJson,
        escalationRules: config.escalationRulesJson,
        forbiddenClaims: config.forbiddenClaimsJson,
      })),
      knowledge: business.knowledgeSources.flatMap((source) =>
        source.knowledgeChunks.map((chunk) => ({
          source: source.title,
          content: chunk.content,
          tags: chunk.tags,
        }))
      ),
      catalogue: business.catalogueItems.map((item) => ({
        id: item.id,
        name: item.name,
        itemType: item.itemType,
        category: item.category,
        price: item.price,
        availabilityStatus: item.availabilityStatus,
        allergens: item.allergens,
        dietaryTags: item.dietaryTags,
      })),
    };
  },
});
