-- Database Verification Script for Spiread
-- Phase 6 Sprint 1 - Verify UUID types, table existence, indexes, and RLS policies

\echo 'Starting Spiread Database Verification...'
\echo ''

-- Check if required extensions are installed
\echo '=== CHECKING EXTENSIONS ==='
select 
  extname as extension_name,
  case when extname is not null then '✅ Installed' else '❌ Missing' end as status
from pg_extension 
where extname in ('pgcrypto', 'uuid-ossp')
union all
select 'pgcrypto', case when exists(select 1 from pg_extension where extname = 'pgcrypto') then '✅ Installed' else '❌ Missing' end
union all  
select 'uuid-ossp', case when exists(select 1 from pg_extension where extname = 'uuid-ossp') then '✅ Installed' else '❌ Missing' end;

\echo ''
\echo '=== CHECKING TABLE EXISTENCE ==='
select 
  tablename as table_name,
  '✅ Exists' as status
from pg_tables 
where schemaname = 'public' 
  and tablename in (
    'profiles', 'achievements', 'streaks', 'game_runs', 
    'session_schedules', 'settings', 'sessions', 'documents', 
    'ai_cache', 'ai_usage', 'word_bank'
  )
order by tablename;

\echo ''
\echo '=== CHECKING UUID PRIMARY KEYS ==='
select 
  t.table_name,
  c.column_name,
  c.data_type,
  case 
    when c.data_type = 'uuid' then '✅ UUID'
    else '❌ Not UUID: ' || c.data_type 
  end as pk_status
from information_schema.tables t
join information_schema.columns c 
  on t.table_name = c.table_name 
  and t.table_schema = c.table_schema
join information_schema.key_column_usage kcu 
  on c.table_name = kcu.table_name 
  and c.column_name = kcu.column_name
  and c.table_schema = kcu.table_schema
join information_schema.table_constraints tc 
  on kcu.constraint_name = tc.constraint_name 
  and tc.constraint_type = 'PRIMARY KEY'
where t.table_schema = 'public'
  and t.table_name in (
    'profiles', 'achievements', 'game_runs', 'session_schedules',
    'settings', 'sessions', 'documents', 'ai_cache', 'ai_usage', 'word_bank'
  )
order by t.table_name;

\echo ''
\echo '=== CHECKING FOREIGN KEY REFERENCES ==='
select 
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  case 
    when ccu.table_name = 'users' and ccu.column_name = 'id' then '✅ References auth.users'
    else '⚠️  References: ' || ccu.table_name || '.' || ccu.column_name
  end as reference_status
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu 
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu 
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in (
    'profiles', 'achievements', 'streaks', 'game_runs',
    'session_schedules', 'settings', 'sessions', 'documents', 'ai_usage'
  )
order by tc.table_name, kcu.column_name;

\echo ''
\echo '=== CHECKING ROW LEVEL SECURITY ==='
select 
  schemaname,
  tablename,
  case when rowsecurity then '✅ Enabled' else '❌ Disabled' end as rls_status
from pg_tables 
where schemaname = 'public'
  and tablename in (
    'profiles', 'achievements', 'streaks', 'game_runs', 
    'session_schedules', 'settings', 'sessions', 'documents', 
    'ai_cache', 'ai_usage', 'word_bank'
  )
order by tablename;

\echo ''
\echo '=== CHECKING RLS POLICIES ==='
select 
  schemaname,
  tablename,
  policyname,
  cmd as policy_command,
  case 
    when qual is not null then '✅ Has conditions'
    else '⚠️  No conditions'
  end as policy_status
from pg_policies 
where schemaname = 'public'
  and tablename in (
    'profiles', 'achievements', 'streaks', 'game_runs',
    'session_schedules', 'settings', 'sessions', 'documents', 'ai_cache', 'ai_usage'
  )
order by tablename, policyname;

\echo ''
\echo '=== CHECKING CRITICAL INDEXES ==='
select 
  t.tablename,
  i.indexname,
  case when i.indexname is not null then '✅ Exists' else '❌ Missing' end as index_status
from pg_tables t
left join pg_indexes i on t.tablename = i.tablename
where t.schemaname = 'public'
  and t.tablename in ('profiles', 'achievements', 'streaks', 'game_runs', 'session_schedules')
  and (i.indexname like 'idx_%' or i.indexname like '%_pkey')
order by t.tablename, i.indexname;

\echo ''
\echo '=== CHECKING ACHIEVEMENTS TABLE STRUCTURE ==='
select 
  column_name,
  data_type,
  is_nullable,
  case when column_default is not null then '✅ Has default' else '⚠️  No default' end as default_status
from information_schema.columns
where table_schema = 'public' 
  and table_name = 'achievements'
order by ordinal_position;

\echo ''
\echo '=== CHECKING STREAKS TABLE STRUCTURE ==='
select 
  column_name,
  data_type,
  is_nullable,
  case when column_default is not null then '✅ Has default' else '⚠️  No default' end as default_status
from information_schema.columns
where table_schema = 'public' 
  and table_name = 'streaks'
order by ordinal_position;

\echo ''
\echo '=== CHECKING GAME_RUNS CONSTRAINTS ==='
select 
  tc.constraint_name,
  tc.constraint_type,
  case 
    when tc.constraint_type = 'CHECK' then '✅ Game validation constraint exists'
    else tc.constraint_type
  end as constraint_status
from information_schema.table_constraints tc
where tc.table_schema = 'public'
  and tc.table_name = 'game_runs'
  and tc.constraint_name like '%game%';

\echo ''
\echo '=== CHECKING FUNCTIONS ==='
select 
  routine_name as function_name,
  case when routine_name is not null then '✅ Exists' else '❌ Missing' end as function_status
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('get_user_level', 'calculate_xp_to_next_level', 'update_updated_at_column', 'get_user_profile', 'update_user_xp')
order by routine_name;

\echo ''
\echo '=== SAMPLE DATA CHECK ==='
\echo 'Profiles count:'
select count(*) as profile_count from profiles;

\echo 'Achievements count:'
select count(*) as achievement_count from achievements;

\echo 'Game runs count:'
select count(*) as game_runs_count from game_runs;

\echo ''
\echo '=== UNIQUE CONSTRAINTS CHECK ==='
select 
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ') as columns,
  '✅ Unique constraint' as status
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu 
  on tc.constraint_name = kcu.constraint_name
where tc.constraint_type = 'UNIQUE'
  and tc.table_schema = 'public'
  and tc.table_name in ('achievements', 'streaks')
group by tc.table_name, tc.constraint_name
order by tc.table_name;

\echo ''
\echo 'Database verification complete!'
\echo 'Review any ❌ entries above for issues that need attention.'