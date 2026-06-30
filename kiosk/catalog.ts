export type KioskSalad = {
  id: string;
  name: string;
  price: number;
  calories: number;
  protein: number;
  dietary: string[];
  accent: string;
  description: string;
  ingredients: string[];
};

export const KIOSK_CONFIG = {
  slug: "heysalad-kiosk",
  name: "HeySalad Kiosk",
  location: process.env.NEXT_PUBLIC_KIOSK_LOCATION ?? "London Paddington",
  businessType: "RESTAURANT" as const,
  greeting:
    "Hello and welcome to HeySalad. I can help you pick a bowl, explain ingredients, and guide you to checkout.",
  quickPrompts: [
    "I want something high protein",
    "Which salad is best for vegans?",
    "What is the lightest option for lunch?",
    "Which bowl is best value?"
  ]
};

export const KIOSK_SALADS: KioskSalad[] = [
  {
    id: "rainbow-buddha",
    name: "Rainbow Buddha Bowl",
    price: 12.99,
    calories: 420,
    protein: 15,
    dietary: ["vegan", "gluten-free"],
    accent: "from-amber-300 via-orange-300 to-pink-300",
    description: "A bright all-rounder with quinoa, sweet potato, edamame, and tahini.",
    ingredients: ["quinoa", "sweet potato", "purple cabbage", "edamame", "tahini dressing"]
  },
  {
    id: "mediterranean-power",
    name: "Mediterranean Power Salad",
    price: 11.99,
    calories: 380,
    protein: 14,
    dietary: ["vegetarian", "gluten-free"],
    accent: "from-lime-300 via-emerald-300 to-teal-300",
    description: "A sharp, salty bowl built around chickpeas, tomatoes, and olives.",
    ingredients: ["spinach", "chickpeas", "cherry tomatoes", "olives", "lemon-herb vinaigrette"]
  },
  {
    id: "green-goddess",
    name: "Green Goddess Bowl",
    price: 13.49,
    calories: 350,
    protein: 12,
    dietary: ["vegan", "raw"],
    accent: "from-emerald-300 via-green-300 to-lime-200",
    description: "The cleanest option on the board with kale, avocado, and hemp seeds.",
    ingredients: ["kale", "avocado", "broccoli", "hemp seeds", "green goddess dressing"]
  },
  {
    id: "protein-paradise",
    name: "Protein Paradise",
    price: 15.99,
    calories: 480,
    protein: 35,
    dietary: ["gluten-free", "high-protein"],
    accent: "from-rose-300 via-red-300 to-orange-300",
    description: "The training-day bowl with grilled chicken, quinoa, and roasted vegetables.",
    ingredients: ["grilled chicken", "quinoa", "roasted vegetables", "turmeric-ginger dressing"]
  }
];

export function getSaladById(id: string) {
  return KIOSK_SALADS.find((item) => item.id === id) ?? null;
}

export function buildKioskKnowledgeContext() {
  const menuLines = KIOSK_SALADS.map((salad) => {
    return [
      `${salad.name} - GBP ${salad.price.toFixed(2)}`,
      `Calories: ${salad.calories}, Protein: ${salad.protein}g`,
      `Dietary tags: ${salad.dietary.join(", ")}`,
      `Ingredients: ${salad.ingredients.join(", ")}`,
      `Description: ${salad.description}`
    ].join("\n");
  }).join("\n\n");

  return [
    `Business: ${KIOSK_CONFIG.name}`,
    `Location: ${KIOSK_CONFIG.location}`,
    "Offer: freshly assembled salads and bowls for quick lunch and healthy ordering.",
    "Safety: if a guest asks about severe allergies or ingredient certainty, advise staff confirmation before purchase.",
    "Payments: the kiosk can start checkout and redirect to the configured payment provider.",
    "",
    "Menu:",
    menuLines
  ].join("\n");
}
