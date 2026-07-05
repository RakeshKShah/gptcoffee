/**
 * Mock data for GPT Coffee API responses.
 * Used by the mock server to simulate the backend.
 */

export const mockUsers = {
  buyer: {
    id: "buyer-sample",
    name: "Maya Buyer",
    email: "buyer@gptcoffee.test",
    role: "buyer",
  },
  admin: {
    id: "admin-sample",
    name: "Ari Admin",
    email: "admin@gptcoffee.test",
    role: "admin",
  },
};

export const mockProducts = [
  {
    id: "velvet-latte",
    name: "Velvet Latte",
    note: "Caramel, oat cream, dark espresso",
    description:
      "Silky steamed milk folded into a double ristretto with a toasted caramel finish.",
    price: 6.75,
    strength: "Mellow",
    gradient: "from-amber-300 via-orange-500 to-stone-900",
  },
  {
    id: "midnight-mocha",
    name: "Midnight Mocha",
    note: "Cacao, smoked vanilla, sea salt",
    description:
      "A plush mocha built with single-origin cocoa and a bright espresso backbone.",
    price: 7.25,
    strength: "Bold",
    gradient: "from-stone-700 via-amber-800 to-black",
  },
  {
    id: "golden-cortado",
    name: "Golden Cortado",
    note: "Brown sugar, cinnamon, microfoam",
    description:
      "Equal parts espresso and textured milk, balanced with warm spice and brown sugar.",
    price: 5.95,
    strength: "Balanced",
    gradient: "from-yellow-200 via-amber-500 to-stone-950",
  },
  {
    id: "ember-cold-brew",
    name: "Ember Cold Brew",
    note: "Maple, orange peel, slow steeped",
    description:
      "Low-acid cold brew poured over crystal ice with a maple citrus lift.",
    price: 6.5,
    strength: "Smooth",
    gradient: "from-orange-300 via-red-700 to-stone-950",
  },
];

export const mockCustomizations = {
  sizes: [
    { id: "small", label: "Small", price: 0 },
    { id: "classic", label: "Classic", price: 0.75 },
    { id: "grand", label: "Grand", price: 1.4 },
  ],
  milks: [
    { id: "whole", label: "Whole", price: 0 },
    { id: "oat", label: "Oat", price: 0.85 },
    { id: "almond", label: "Almond", price: 0.75 },
    { id: "coconut", label: "Coconut", price: 0.9 },
  ],
  extras: [
    { id: "vanilla-cloud", label: "Vanilla Cloud", price: 0.75 },
    { id: "caramel-lace", label: "Caramel Lace", price: 0.8 },
    { id: "extra-shot", label: "Extra Shot", price: 1.25 },
    { id: "cocoa-dust", label: "Cocoa Dust", price: 0.55 },
  ],
};

export const mockOrders = [
  {
    id: "ORD-1001",
    buyerId: "buyer-sample",
    buyerName: "Maya Buyer",
    createdAt: new Date().toISOString(),
    readyAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: "Ready for pickup",
    total: 18.55,
    items: [
      {
        id: "item-1001",
        productName: "Midnight Mocha",
        size: "Grand",
        milk: "Oat",
        extras: ["Extra Shot", "Cocoa Dust"],
        quantity: 2,
        total: 18.55,
      },
    ],
  },
];

export const mockSales = {
  daily: 125.5,
  monthly: 3420.75,
  total: 48920.0,
  orderCount: 42,
};

/**
 * Returns a base64url-encoded mock token for the given user.
 * Mirrors the encoding used by the real GPTCoffeeServer.
 */
export function makeMockToken(user) {
  return Buffer.from(
    JSON.stringify({ userId: user.id, role: user.role })
  ).toString("base64url");
}
