// ─── TYPES ───────────────────────────────────────────────────────────────────

export type LifeBucket =
  | "work"
  | "family"
  | "health"
  | "growth"
  | "leisure"
  | "admin"
  | "sleep";

export interface TimeEntry {
  id: string;
  label: string;
  bucket: LifeBucket;
  hours: number;
  date: string;
  note?: string;
}

export interface Expense {
  id: string;
  label: string;
  bucket: LifeBucket;
  amount: number;
  date: string;
  source: "bank" | "manual";
}

export interface ScreenEntry {
  id: string;
  app: string;
  category: string;
  hours: number;
  date: string;
}

// ─── COLOURS & LABELS ────────────────────────────────────────────────────────

export const BUCKET_META: Record<
  LifeBucket,
  { label: string; emoji: string; color: string; bg: string }
> = {
  work:    { label: "Work",     emoji: "WK", color: "#60A5FA", bg: "#1E3A5F" },
  family:  { label: "Family",   emoji: "FM",  color: "#F472B6", bg: "#4A1942" },
  health:  { label: "Health",   emoji: "HL", color: "#2DD4BF", bg: "#0F2E2B" },
  growth:  { label: "Growth",   emoji: "GR", color: "#A78BFA", bg: "#2D1F4E" },
  leisure: { label: "Leisure",  emoji: "LS", color: "#FB923C", bg: "#3D1F0A" },
  admin:   { label: "Admin",    emoji: "AD", color: "#94A3B8", bg: "#1E2530" },
  sleep:   { label: "Sleep",    emoji: "SL", color: "#818CF8", bg: "#1E1B3A" },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

export const MOCK_TIME_THIS_WEEK: TimeEntry[] = [
  { id: "1", label: "Deep work — client projects",  bucket: "work",    hours: 22, date: "2026-04-01" },
  { id: "2", label: "Meetings & calls",              bucket: "work",    hours: 9,  date: "2026-04-02" },
  { id: "3", label: "Dinner with family",            bucket: "family",  hours: 3,  date: "2026-04-03" },
  { id: "4", label: "Call with parents",             bucket: "family",  hours: 2.4,date: "2026-04-04" },
  { id: "5", label: "Morning runs",                  bucket: "health",  hours: 3.5,date: "2026-04-01" },
  { id: "6", label: "Gym sessions",                  bucket: "health",  hours: 4.5,date: "2026-04-03" },
  { id: "7", label: "Reading",                       bucket: "growth",  hours: 2,  date: "2026-04-02" },
  { id: "8", label: "Online course",                 bucket: "growth",  hours: 1.2,date: "2026-04-04" },
  { id: "9", label: "TV & downtime",                 bucket: "leisure", hours: 9,  date: "2026-04-01" },
  { id:"10", label: "Admin & errands",               bucket: "admin",   hours: 8.4,date: "2026-04-02" },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: "1",  label: "Uber Eats",           bucket: "leisure", amount: 68,  date: "2026-04-01", source: "bank" },
  { id: "2",  label: "Gym membership",      bucket: "health",  amount: 45,  date: "2026-04-01", source: "bank" },
  { id: "3",  label: "Amazon — books",      bucket: "growth",  amount: 22,  date: "2026-04-02", source: "bank" },
  { id: "4",  label: "Team lunch",          bucket: "work",    amount: 95,  date: "2026-04-02", source: "bank" },
  { id: "5",  label: "Grocery shopping",    bucket: "health",  amount: 85,  date: "2026-04-03", source: "bank" },
  { id: "6",  label: "Quick cabs",          bucket: "admin",   amount: 48,  date: "2026-04-03", source: "bank" },
  { id: "7",  label: "Family dinner out",   bucket: "family",  amount: 98,  date: "2026-04-04", source: "bank" },
  { id: "8",  label: "Software subs",       bucket: "work",    amount: 50,  date: "2026-04-04", source: "bank" },
  { id: "9",  label: "Takeaways",           bucket: "leisure", amount: 58,  date: "2026-04-04", source: "bank" },
  { id:"10",  label: "Miscellaneous",       bucket: "admin",   amount: 178, date: "2026-04-05", source: "bank" },
  { id:"11",  label: "Charity donation",    bucket: "growth",  amount: 20,  date: "2026-04-05", source: "bank" },
  { id:"12",  label: "Health supplements",  bucket: "health",  amount: 80,  date: "2026-04-05", source: "bank" },
];

export const SCREEN_CATEGORIES = [
  { category: "Social Media",  hours: 9.8,  color: "#1A56DB" },
  { category: "Entertainment", hours: 7.4,  color: "#D97706" },
  { category: "News",          hours: 6.2,  color: "#E74694" },
  { category: "Productivity",  hours: 2.4,  color: "#16A34A" },
  { category: "Learning",      hours: 2.1,  color: "#7C3AED" },
  { category: "Other",         hours: 1.5,  color: "#6B7280" },
];

export const DAILY_SCREEN = [
  { day: "Mon", hours: 3.8 },
  { day: "Tue", hours: 5.1 },
  { day: "Wed", hours: 4.2 },
  { day: "Thu", hours: 4.8 },
  { day: "Fri", hours: 4.0 },
  { day: "Sat", hours: 3.5 },
  { day: "Sun", hours: 3.9 },
];

export const DAILY_TIME = [
  { day: "Mon", work: 7, family: 1,   health: 1.5, growth: 0.5, leisure: 1, admin: 1 },
  { day: "Tue", work: 8, family: 0.5, health: 0,   growth: 1,   leisure: 1.5, admin: 1 },
  { day: "Wed", work: 6, family: 1,   health: 1.5, growth: 0.5, leisure: 1, admin: 2 },
  { day: "Thu", work: 7, family: 0.5, health: 0,   growth: 0.5, leisure: 2, admin: 1 },
  { day: "Fri", work: 5, family: 1,   health: 1.5, growth: 0.5, leisure: 2, admin: 1 },
  { day: "Sat", work: 2, family: 2,   health: 2,   growth: 0.2, leisure: 4, admin: 1.5 },
  { day: "Sun", work: 1, family: 3,   health: 1,   growth: 0,   leisure: 3, admin: 1 },
];

// ─── COMPUTED HELPERS ────────────────────────────────────────────────────────

export function getTotalByBucket(entries: TimeEntry[]) {
  return entries.reduce<Partial<Record<LifeBucket, number>>>((acc, e) => {
    acc[e.bucket] = (acc[e.bucket] ?? 0) + e.hours;
    return acc;
  }, {});
}

export function getTotalExpenseByBucket(expenses: Expense[]) {
  return expenses.reduce<Partial<Record<LifeBucket, number>>>((acc, e) => {
    acc[e.bucket] = (acc[e.bucket] ?? 0) + e.amount;
    return acc;
  }, {});
}

export function getAlignmentScore(
  statedPriorities: LifeBucket[],
  timeTotals: Partial<Record<LifeBucket, number>>,
  totalHours: number
): number {
  if (statedPriorities.length === 0 || totalHours === 0) return 0;
  const n = statedPriorities.length;
  let score = 0;
  statedPriorities.forEach((bucket, idx) => {
    const statedWeight = (n - idx) / n; // highest priority = weight 1
    const actualPct = (timeTotals[bucket] ?? 0) / totalHours;
    const match = 1 - Math.abs(statedWeight * 0.35 - actualPct); // expected ~35% for top
    score += Math.max(0, match) * (1 / n);
  });
  return Math.min(100, Math.round(score * 130));
}
