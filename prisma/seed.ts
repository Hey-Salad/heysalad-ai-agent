import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a demo business
  const business = await prisma.business.upsert({
    where: { slug: "green-bowl-kitchen" },
    update: {},
    create: {
      name: "Green Bowl Kitchen",
      slug: "green-bowl-kitchen",
      businessType: "RESTAURANT",
      publicPhone: "+44 20 7946 0958",
      aiPhone: "+14155733645",
      email: "hello@greenbowl.kitchen",
      website: "https://greenbowl.kitchen",
    },
  });

  // Create agent config
  await prisma.agentConfig.upsert({
    where: { id: "demo-host-config" },
    update: {},
    create: {
      id: "demo-host-config",
      businessId: business.id,
      agentName: "Green Bowl Host",
      agentType: "HOST",
      voice: "Polly.Amy",
      tone: "friendly and professional",
      greeting:
        "Hello! Thank you for calling Green Bowl Kitchen. I'm your AI assistant. How can I help you today?",
    },
  });

  // Create knowledge sources
  const menuSource = await prisma.knowledgeSource.upsert({
    where: { id: "demo-menu-source" },
    update: {},
    create: {
      id: "demo-menu-source",
      businessId: business.id,
      sourceType: "MENU",
      title: "Main Menu",
      status: "APPROVED",
    },
  });

  const faqSource = await prisma.knowledgeSource.upsert({
    where: { id: "demo-faq-source" },
    update: {},
    create: {
      id: "demo-faq-source",
      businessId: business.id,
      sourceType: "FAQ",
      title: "Frequently Asked Questions",
      status: "APPROVED",
    },
  });

  // Create knowledge chunks
  const chunks = [
    { sourceId: menuSource.id, content: "Buddha Bowl - Mixed grains, roasted vegetables, tahini dressing. £12.50. Contains sesame. Vegan.", tags: ["menu", "vegan"] },
    { sourceId: menuSource.id, content: "Green Goddess Salad - Avocado, kale, cucumber, herb dressing. £10.50. Vegan & gluten-free.", tags: ["menu", "vegan", "gluten-free"] },
    { sourceId: menuSource.id, content: "Grilled Halloumi Wrap - Halloumi, roasted peppers, hummus, flatbread. £11.00. Vegetarian.", tags: ["menu", "vegetarian"] },
    { sourceId: faqSource.id, content: "Opening hours: Monday to Saturday, 11am to 10pm. Closed on Sundays.", tags: ["hours"] },
    { sourceId: faqSource.id, content: "We accept bookings for parties of 2-12. Larger parties should call to discuss.", tags: ["bookings"] },
    { sourceId: faqSource.id, content: "We have a dedicated allergen menu. Please inform your server of any allergies. We cannot guarantee a nut-free environment.", tags: ["allergens", "safety"] },
    { sourceId: faqSource.id, content: "We offer 10% off for NHS workers with valid ID.", tags: ["offers"] },
  ];

  for (const chunk of chunks) {
    await prisma.knowledgeChunk.create({
      data: {
        knowledgeSourceId: chunk.sourceId,
        businessId: business.id,
        content: chunk.content,
        tags: chunk.tags,
      },
    });
  }

  console.log("Seeded demo business: Green Bowl Kitchen");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
