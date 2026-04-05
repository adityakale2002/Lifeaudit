-- ============================================================
-- LIFE AUDIT APP — DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Extends Supabase Auth users with app-specific data
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  priorities  text[] default array['family','work','health','growth','leisure','admin'],
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── TIME ENTRIES ─────────────────────────────────────────────────────────────
create table if not exists time_entries (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade not null,
  label       text not null,
  bucket      text not null check (bucket in ('work','family','health','growth','leisure','admin','sleep')),
  hours       numeric(5,2) not null check (hours > 0),
  entry_date  date not null default current_date,
  note        text,
  source      text default 'manual' check (source in ('manual','calendar','import')),
  created_at  timestamptz default now()
);

-- ─── EXPENSES ─────────────────────────────────────────────────────────────────
create table if not exists expenses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade not null,
  label       text not null,
  bucket      text not null check (bucket in ('work','family','health','growth','leisure','admin','sleep')),
  amount      numeric(10,2) not null check (amount > 0),
  currency    text default 'INR',
  entry_date  date not null default current_date,
  note        text,
  source      text default 'manual' check (source in ('manual','bank','import')),
  created_at  timestamptz default now()
);

-- ─── SCREEN ENTRIES ───────────────────────────────────────────────────────────
create table if not exists screen_entries (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade not null,
  app_name    text not null,
  category    text not null,
  hours       numeric(5,2) not null check (hours > 0),
  entry_date  date not null default current_date,
  source      text default 'manual',
  created_at  timestamptz default now()
);

-- ─── AUDIT REPORTS ────────────────────────────────────────────────────────────
create table if not exists audit_reports (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references profiles(id) on delete cascade not null,
  report_type     text default 'weekly' check (report_type in ('weekly','monthly','quarterly')),
  period_start    date not null,
  period_end      date not null,
  alignment_score integer check (alignment_score between 0 and 100),
  report_content  text,        -- AI-generated narrative
  insights        jsonb,       -- Structured insights
  created_at      timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Users can only see and modify their own data

alter table profiles       enable row level security;
alter table time_entries   enable row level security;
alter table expenses       enable row level security;
alter table screen_entries enable row level security;
alter table audit_reports  enable row level security;

-- Profiles
create policy "Users can view own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Time entries
create policy "Users can view own time entries"   on time_entries for select using (auth.uid() = user_id);
create policy "Users can insert own time entries" on time_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own time entries" on time_entries for update using (auth.uid() = user_id);
create policy "Users can delete own time entries" on time_entries for delete using (auth.uid() = user_id);

-- Expenses
create policy "Users can view own expenses"   on expenses for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on expenses for delete using (auth.uid() = user_id);

-- Screen entries
create policy "Users can view own screen entries"   on screen_entries for select using (auth.uid() = user_id);
create policy "Users can insert own screen entries" on screen_entries for insert with check (auth.uid() = user_id);
create policy "Users can delete own screen entries" on screen_entries for delete using (auth.uid() = user_id);

-- Audit reports
create policy "Users can view own reports"   on audit_reports for select using (auth.uid() = user_id);
create policy "Users can insert own reports" on audit_reports for insert with check (auth.uid() = user_id);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
create index if not exists idx_time_entries_user_date   on time_entries   (user_id, entry_date desc);
create index if not exists idx_expenses_user_date       on expenses        (user_id, entry_date desc);
create index if not exists idx_screen_entries_user_date on screen_entries  (user_id, entry_date desc);
create index if not exists idx_audit_reports_user       on audit_reports   (user_id, created_at desc);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ─── GOOGLE CALENDAR TOKENS (add to profiles) ────────────────────────────────
-- Run this if you already ran the initial schema:
alter table profiles add column if not exists google_access_token  text;
alter table profiles add column if not exists google_refresh_token text;

-- ─── PLAID TOKENS (add to profiles) ──────────────────────────────────────────
-- Run this if you already ran the initial schema:
alter table profiles add column if not exists plaid_access_token text;
alter table profiles add column if not exists plaid_item_id      text;
