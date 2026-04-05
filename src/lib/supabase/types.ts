export type LifeBucket = "work" | "family" | "health" | "growth" | "leisure" | "admin" | "sleep";
export type EntrySource = "manual" | "calendar" | "import" | "bank";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  priorities: LifeBucket[];
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  label: string;
  bucket: LifeBucket;
  hours: number;
  entry_date: string;
  note: string | null;
  source: EntrySource;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  label: string;
  bucket: LifeBucket;
  amount: number;
  currency: string;
  entry_date: string;
  note: string | null;
  source: EntrySource;
  created_at: string;
}

export interface ScreenEntry {
  id: string;
  user_id: string;
  app_name: string;
  category: string;
  hours: number;
  entry_date: string;
  source: string;
  created_at: string;
}

export interface AuditReport {
  id: string;
  user_id: string;
  report_type: "weekly" | "monthly" | "quarterly";
  period_start: string;
  period_end: string;
  alignment_score: number | null;
  report_content: string | null;
  insights: Record<string, unknown> | null;
  created_at: string;
}

export type Database = {
  public: {
    PostgrestVersion: "12";
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      time_entries: {
        Row: TimeEntry;
        Insert: Omit<TimeEntry, "id" | "created_at">;
        Update: Partial<Omit<TimeEntry, "id" | "created_at">>;
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, "id" | "created_at">;
        Update: Partial<Omit<Expense, "id" | "created_at">>;
        Relationships: [];
      };
      screen_entries: {
        Row: ScreenEntry;
        Insert: Omit<ScreenEntry, "id" | "created_at">;
        Update: Partial<Omit<ScreenEntry, "id" | "created_at">>;
        Relationships: [];
      };
      audit_reports: {
        Row: AuditReport;
        Insert: Omit<AuditReport, "id" | "created_at">;
        Update: Partial<Omit<AuditReport, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
