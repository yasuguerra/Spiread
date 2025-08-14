-- Enhanced Spiread Database Schema
-- Comprehensive schema for speed reading, cognitive training, and gamification

-- Enable Row Level Security by default
alter default privileges revoke execute on functions from public;

-- Users table (handled by Supabase Auth)
-- Profiles for XP and level tracking
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0,
  level int not null default 1,
  updated_at timestamptz not null default now()
);

-- Reading sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wpm_start int not null default 0,
  wpm_end int not null default 0,
  comprehension_score int default 0,
  exercise_type text not null,
  duration_seconds int not null default 0,
  text_length int default 0,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Documents and content
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  word_count int not null default 0,
  language text not null default 'es',
  source_type text not null default 'text', -- text, pdf, epub, url
  created_at timestamptz not null default now()
);

-- User settings with progress tracking
create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wpm_target int not null default 300,
  chunk_size int not null default 1,
  theme text not null default 'light',
  language text not null default 'es',
  font_size int not null default 16,
  sound_enabled boolean not null default false,
  show_instructions boolean not null default true,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- AI Cache for LLM responses
create table if not exists ai_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  input_hash text not null,
  output_text text not null,
  request_type text not null, -- summarize, questions
  token_count int default 0,
  ver text default 'v1',
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  access_count int not null default 1
);

-- AI Usage tracking for quotas
create table if not exists ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null default date_trunc('month', now()),
  calls_used int not null default 0,
  tokens_used int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

-- Game runs for all cognitive training games
create table if not exists game_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null, -- memory_digits, schulte, par_impar, running_words, letters_grid, word_search, anagramas, reading_quiz
  score int not null default 0,
  duration_ms int not null default 0,
  difficulty_level int not null default 1,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Session schedules for structured training sessions
create table if not exists session_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template text not null, -- 15min, 30min, 60min
  duration_ms int not null default 0,
  total_score int not null default 0,
  blocks jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Achievements system
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_type text not null,
  title text not null,
  description text not null,
  icon text not null default '🏆',
  unlocked_at timestamptz not null default now()
);

-- Daily streaks
create table if not exists streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current int not null default 0,
  longest int not null default 0,
  last_activity_date date not null default current_date,
  updated_at timestamptz not null default now()
);

-- Word bank for games (anagrams, word search, etc.)
create table if not exists word_bank (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  language text not null default 'es',
  length int not null,
  frequency_rank int default 0,
  category text default 'general',
  created_at timestamptz not null default now()
);

-- Row Level Security Policies

-- Profiles
alter table profiles enable row level security;
create policy "profiles_select" on profiles for select using (auth.uid() = user_id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update" on profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sessions
alter table sessions enable row level security;
create policy "sessions_select" on sessions for select using (auth.uid() = user_id);
create policy "sessions_insert" on sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update" on sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Documents
alter table documents enable row level security;
create policy "documents_select" on documents for select using (auth.uid() = user_id);
create policy "documents_insert" on documents for insert with check (auth.uid() = user_id);
create policy "documents_update" on documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents_delete" on documents for delete using (auth.uid() = user_id);

-- Settings with new RLS policies
alter table settings enable row level security;

drop policy if exists settings_select on settings;
drop policy if exists settings_insert on settings;
drop policy if exists settings_update on settings;

create policy settings_select on settings
for select using (auth.uid() = user_id);

create policy settings_insert on settings
for insert with check (auth.uid() = user_id);

create policy settings_update on settings
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- AI Cache (no RLS - server only)
alter table ai_cache enable row level security;
create policy "ai_cache_select" on ai_cache for select using (true);
create policy "ai_cache_insert" on ai_cache for insert with check (true);
create policy "ai_cache_update" on ai_cache for update using (true);

-- AI Usage
alter table ai_usage enable row level security;
create policy "ai_usage_select" on ai_usage for select using (auth.uid() = user_id);
create policy "ai_usage_insert" on ai_usage for insert with check (auth.uid() = user_id);
create policy "ai_usage_update" on ai_usage for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Game runs
alter table game_runs enable row level security;
create policy "game_runs_select" on game_runs for select using (auth.uid() = user_id);
create policy "game_runs_insert" on game_runs for insert with check (auth.uid() = user_id);
create policy "game_runs_update" on game_runs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Session schedules
alter table session_schedules enable row level security;
create policy "session_schedules_select" on session_schedules for select using (auth.uid() = user_id);
create policy "session_schedules_insert" on session_schedules for insert with check (auth.uid() = user_id);
create policy "session_schedules_update" on session_schedules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Achievements
alter table achievements enable row level security;
create policy "achievements_select" on achievements for select using (auth.uid() = user_id);
create policy "achievements_insert" on achievements for insert with check (auth.uid() = user_id);

-- Streaks
alter table streaks enable row level security;
create policy "streaks_select" on streaks for select using (auth.uid() = user_id);
create policy "streaks_insert" on streaks for insert with check (auth.uid() = user_id);
create policy "streaks_update" on streaks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Word bank (public read, admin write)
alter table word_bank enable row level security;
create policy "word_bank_select" on word_bank for select using (true);

-- Recommended Indexes for Performance
create index if not exists idx_settings_user on settings(user_id);
create index if not exists idx_game_runs_user_created on game_runs(user_id, created_at desc);
create index if not exists idx_game_runs_game on game_runs(game);
create index if not exists idx_session_schedules_user_started on session_schedules(user_id, started_at desc);
create index if not exists idx_sessions_user_date on sessions(user_id, date desc);
create index if not exists idx_documents_user_created on documents(user_id, created_at desc);
create index if not exists idx_ai_cache_hash on ai_cache(input_hash);
create index if not exists idx_ai_cache_key on ai_cache(cache_key);
create index if not exists idx_ai_usage_user_period on ai_usage(user_id, period_start desc);
create index if not exists idx_achievements_user_type on achievements(user_id, achievement_type);
create index if not exists idx_word_bank_lang_len on word_bank(language, length);

-- Functions for common operations
create or replace function get_user_level(user_xp int)
returns int
language sql
immutable
as $$
  select floor(user_xp / 1000) + 1;
$$;

create or replace function calculate_xp_to_next_level(current_xp int)
returns int
language sql
immutable  
as $$
  select (floor(current_xp / 1000) + 1) * 1000 - current_xp;
$$;