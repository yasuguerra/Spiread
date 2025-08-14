-- Spiread Database Schema Fix: UUID + Gamification Alignment
-- Phase 6 Sprint 1 - Fix UUID types, table naming consistency, and RLS policies

-- Enable pgcrypto for UUID generation if not enabled
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Ensure all tables use consistent UUID format and naming

-- 1. Fix achievements table to use 'key' column instead of 'achievement_type'
-- This aligns with the frontend expectation from lib/gamification.js
alter table if exists achievements rename column achievement_type to key;

-- Make sure achievements table has the correct structure
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null, -- Changed from achievement_type to key
  title text not null,
  description text not null,
  icon text not null default '🏆',
  metadata jsonb default '{}'::jsonb, -- Added for extensibility
  created_at timestamptz not null default now(),
  unique(user_id, key) -- Prevent duplicate achievements
);

-- 2. Fix streaks table structure 
-- The frontend expects daily entries, not a single row per user
drop table if exists streaks cascade;
create table streaks (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count int default 1,
  created_at timestamptz not null default now(),
  primary key(user_id, day)
);

-- 3. Ensure profiles table has correct structure
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0,
  level int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add updated_at trigger for profiles
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- 4. Ensure game_runs table supports all game types correctly
-- Make sure it includes all 9 games from the Phase 1 implementation
alter table game_runs drop constraint if exists game_runs_game_check;
alter table game_runs add constraint game_runs_game_check 
  check (game in (
    'rsvp', 'shuttle', 'twin_words', 'par_impar', 'memory_digits',
    'running_words', 'letters_grid', 'word_search', 'anagrams', 'reading_quiz'
  ));

-- 5. Add missing indexes for performance
create index if not exists idx_profiles_user_id on profiles(user_id);
create index if not exists idx_achievements_user_key on achievements(user_id, key);
create index if not exists idx_streaks_user_day on streaks(user_id, day desc);
create index if not exists idx_game_runs_user_game on game_runs(user_id, game);
create index if not exists idx_game_runs_created on game_runs(user_id, created_at desc);

-- 6. Update RLS policies to be consistent

-- Profiles RLS
alter table profiles enable row level security;
drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;
create policy "profiles_select" on profiles for select using (auth.uid() = user_id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update" on profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Achievements RLS
alter table achievements enable row level security;
drop policy if exists "achievements_select" on achievements;
drop policy if exists "achievements_insert" on achievements;
drop policy if exists "achievements_update" on achievements;
create policy "achievements_select" on achievements for select using (auth.uid() = user_id);
create policy "achievements_insert" on achievements for insert with check (auth.uid() = user_id);
create policy "achievements_update" on achievements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Streaks RLS
alter table streaks enable row level security;
drop policy if exists "streaks_select" on streaks;
drop policy if exists "streaks_insert" on streaks;
drop policy if exists "streaks_update" on streaks;
create policy "streaks_select" on streaks for select using (auth.uid() = user_id);
create policy "streaks_insert" on streaks for insert with check (auth.uid() = user_id);
create policy "streaks_update" on streaks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Game runs RLS (ensure it's properly configured)
alter table game_runs enable row level security;
drop policy if exists "game_runs_select" on game_runs;
drop policy if exists "game_runs_insert" on game_runs;
drop policy if exists "game_runs_update" on game_runs;
create policy "game_runs_select" on game_runs for select using (auth.uid() = user_id);
create policy "game_runs_insert" on game_runs for insert with check (auth.uid() = user_id);
create policy "game_runs_update" on game_runs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Settings RLS (ensure updated_at is handled)
alter table settings enable row level security;
drop policy if exists "settings_select" on settings;
drop policy if exists "settings_insert" on settings;
drop policy if exists "settings_update" on settings;
create policy "settings_select" on settings for select using (auth.uid() = user_id);
create policy "settings_insert" on settings for insert with check (auth.uid() = user_id);
create policy "settings_update" on settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Add updated_at trigger for settings
drop trigger if exists update_settings_updated_at on settings;
create trigger update_settings_updated_at
  before update on settings
  for each row
  execute function update_updated_at_column();

-- Session schedules RLS (fix table naming consistency)
alter table session_schedules enable row level security;
drop policy if exists "session_schedules_select" on session_schedules;
drop policy if exists "session_schedules_insert" on session_schedules;
drop policy if exists "session_schedules_update" on session_schedules;
create policy "session_schedules_select" on session_schedules for select using (auth.uid() = user_id);
create policy "session_schedules_insert" on session_schedules for insert with check (auth.uid() = user_id);
create policy "session_schedules_update" on session_schedules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7. Add helper functions for gamification
create or replace function get_user_profile(target_user_id uuid)
returns table(user_id uuid, xp int, level int, updated_at timestamptz)
language plpgsql
security definer
as $$
begin
  return query
  select p.user_id, p.xp, p.level, p.updated_at
  from profiles p
  where p.user_id = target_user_id;
end;
$$;

create or replace function update_user_xp(target_user_id uuid, xp_gain int)
returns table(user_id uuid, xp int, level int, level_up boolean)
language plpgsql
security definer
as $$
declare
  old_level int;
  new_level int;
begin
  -- Get current level
  select get_user_level(p.xp) into old_level
  from profiles p
  where p.user_id = target_user_id;
  
  -- Update XP
  update profiles 
  set xp = xp + xp_gain,
      updated_at = now()
  where profiles.user_id = target_user_id;
  
  -- Calculate new level
  select get_user_level(p.xp) into new_level
  from profiles p
  where p.user_id = target_user_id;
  
  -- Return result
  return query
  select p.user_id, p.xp, new_level as level, (new_level > old_level) as level_up
  from profiles p
  where p.user_id = target_user_id;
end;
$$;

-- 8. Create sample data for testing (optional - only if tables are empty)
-- This helps with testing and development
insert into profiles (user_id, xp, level)
select gen_random_uuid(), 0, 1
where not exists (select 1 from profiles limit 1);

-- Add common achievements
insert into achievements (user_id, key, title, description, icon)
values 
  (gen_random_uuid(), 'first_run', 'First Steps', 'Complete your first game', '🎯'),
  (gen_random_uuid(), 'week_streak_7', 'Week Warrior', 'Maintain a 7-day streak', '🔥'),
  (gen_random_uuid(), 'speed_600_wpm', 'Speed Demon', 'Reach 600 WPM reading speed', '⚡'),
  (gen_random_uuid(), 'schulte_7x7', 'Vision Master', 'Complete 7x7 Schulte table', '👁️'),
  (gen_random_uuid(), 'runningwords_lvl10', 'Word Runner', 'Reach level 10 in Running Words', '🏃')
on conflict (user_id, key) do nothing;