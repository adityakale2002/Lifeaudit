import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";

// ─── Plaid client ─────────────────────────────────────────────────────────────
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments ?? "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET":    process.env.PLAID_SECRET!,
    },
  },
});

export const plaidClient = new PlaidApi(config);

// ─── Default products & countries ────────────────────────────────────────────
export const PLAID_PRODUCTS   = [Products.Transactions];
export const PLAID_COUNTRIES  = [CountryCode.Gb, CountryCode.Us];

// ─── Bucket classifier for transactions ──────────────────────────────────────
// Maps Plaid transaction categories → Life Audit buckets
const CATEGORY_MAP: Record<string, string> = {
  // Work
  "Office Supplies":        "work",
  "Business Services":      "work",
  "Subscription":           "work",
  "Software":               "work",
  // Health
  "Gyms and Fitness Centers": "health",
  "Pharmacies":               "health",
  "Hospitals":                "health",
  "Dentists":                 "health",
  "Doctors":                  "health",
  "Health and Beauty":        "health",
  "Sporting Goods":           "health",
  // Family & Relationships
  "Restaurants":            "family",
  "Fast Food":              "leisure",
  "Coffee Shop":            "leisure",
  "Bars":                   "leisure",
  // Growth
  "Bookstores":             "growth",
  "Education":              "growth",
  "Online Courses":         "growth",
  // Leisure
  "Entertainment":          "leisure",
  "Movies and DVDs":        "leisure",
  "Travel":                 "leisure",
  "Airlines and Aviation":  "leisure",
  "Hotels":                 "leisure",
  "Recreation":             "leisure",
  "Music":                  "leisure",
  // Admin
  "Utilities":              "admin",
  "Insurance":              "admin",
  "Government Services":    "admin",
  "Financial":              "admin",
  "Taxes":                  "admin",
  "Transfer":               "admin",
  "Groceries":              "health", // maps to health — healthy living
  "Supermarkets":           "health",
  "Gas Stations":           "admin",
  "Parking":                "admin",
  "Public Transportation":  "admin",
  "Taxi":                   "admin",
};

export function classifyTransaction(category: string[], merchantName: string): string {
  for (const cat of category) {
    if (CATEGORY_MAP[cat]) return CATEGORY_MAP[cat];
  }
  // Keyword fallback on merchant name
  const name = merchantName.toLowerCase();
  if (/gym|fitness|yoga|sport/i.test(name))    return "health";
  if (/amazon|book|kindle/i.test(name))         return "growth";
  if (/uber|lyft|taxi|transport/i.test(name))   return "admin";
  if (/netflix|spotify|cinema|disney/i.test(name)) return "leisure";
  if (/hotel|airbnb|flight|travel/i.test(name)) return "leisure";
  return "admin"; // safe default
}
