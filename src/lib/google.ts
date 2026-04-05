import { google } from "googleapis";

// ─── OAuth2 Client ────────────────────────────────────────────────────────────
export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

// ─── Auth URL ─────────────────────────────────────────────────────────────────
export function getAuthUrl(state: string) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state,
  });
}

// ─── Bucket classifier ────────────────────────────────────────────────────────
// Maps Google Calendar event titles/descriptions to Life Audit buckets
const BUCKET_RULES: { keywords: string[]; bucket: string }[] = [
  { bucket: "work",    keywords: ["standup","meeting","client","call","sprint","review","interview","1:1","sync","project","proposal","invoice","deadline","presentation","workshop","training"] },
  { bucket: "family",  keywords: ["family","dinner","lunch","kids","school","pickup","parents","mum","dad","wife","husband","partner","anniversary","birthday","date"] },
  { bucket: "health",  keywords: ["gym","run","yoga","workout","physio","doctor","dentist","hospital","therapy","walk","swim","cycle","pilates","meditation","sleep"] },
  { bucket: "growth",  keywords: ["course","book","podcast","learn","study","class","lecture","reading","conference","seminar","networking","mentor"] },
  { bucket: "leisure", keywords: ["holiday","travel","cinema","movie","concert","festival","friends","pub","restaurant","game","sport","netflix","tv","weekend","trip","vacation"] },
  { bucket: "admin",   keywords: ["bank","tax","accountant","insurance","appointment","errand","shopping","groceries","council","utilities","broadband","repairs"] },
];

export function classifyEvent(title: string, description = ""): string {
  const text = `${title} ${description}`.toLowerCase();
  for (const rule of BUCKET_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.bucket;
  }
  return "work"; // sensible default for calendar events
}

// ─── Duration helper ──────────────────────────────────────────────────────────
export function eventDurationHours(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round((ms / 3600000) * 4) / 4; // round to nearest 15 min
}
