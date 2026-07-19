-- ROOTED — Core database schema
-- Run this in the Supabase SQL editor to set up all tables.

-- ============================================================
-- USERS (extends Supabase auth.users automatically via trigger)
-- ============================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamptz default now()
);

-- ============================================================
-- STATS — one row per user per stat, tracks tier progression
-- stat_key: 'faith' | 'wisdom' | 'strength' | 'discipline' | 'stewardship' | 'character'
-- ============================================================
create table stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  stat_key text not null check (stat_key in ('faith','wisdom','strength','discipline','stewardship','character')),
  completions_total int default 0,          -- cumulative completions, drives tier
  streak_current int default 0,             -- consecutive days, drives soft bonus
  streak_bonus_banked int default 0,        -- bonus completions banked from streaks
  tier int default 1,                       -- 1=Seed ... 6=Unbreakable
  updated_at timestamptz default now(),
  unique(user_id, stat_key)
);

-- Tier thresholds (cumulative completions_total required):
-- Tier 1 Seed:        0
-- Tier 2 Rooted:      15
-- Tier 3 Rising:      40
-- Tier 4 Unshaken:    80
-- Tier 5 Flourishing: 150
-- Tier 6 Unbreakable: 300

-- ============================================================
-- TASKS — the fixed task bank (seeded once, referenced by completions)
-- ============================================================
create table task_definitions (
  id text primary key,          -- e.g. 'prayer', 'bible_reading'
  stat_key text not null,
  label text not null,
  emoji text
);

insert into task_definitions (id, stat_key, label, emoji) values
  ('prayer', 'faith', 'Prayer', '🙏'),
  ('bible_reading', 'faith', 'Bible reading', '📖'),
  ('study', 'wisdom', 'Study', '📚'),
  ('learn_skill', 'wisdom', 'Learn / practice a skill', '🎓'),
  ('workout', 'strength', 'Workout', '💪'),
  ('sleep', 'strength', 'Sleep on time', '😴'),
  ('eat_well', 'strength', 'Eat well', '🥗'),
  ('hard_task', 'discipline', 'Do something hard', '🔥'),
  ('wake_on_time', 'discipline', 'Wake up on time', '⏰'),
  ('limit_wasted_time', 'discipline', 'Time-wasting under limit', '📵'),
  ('work', 'stewardship', 'Work', '💼'),
  ('budget_checkin', 'stewardship', 'Budget check-in', '💰'),
  ('good_deed', 'character', 'Good deed / act', '❤️'),
  ('reflection', 'character', 'Daily reflection question', '📝');

-- ============================================================
-- DAILY TASK COMPLETIONS — one row per user per task per day
-- ============================================================
create table task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  task_id text references task_definitions(id) not null,
  completed_date date not null default current_date,
  die_result int,                -- the roll result, stored for history/animation replay
  damage_dealt int,               -- final damage after tree modifier applied
  created_at timestamptz default now(),
  unique(user_id, task_id, completed_date)  -- enforces one-completion-per-day-per-task
);

-- ============================================================
-- BOSS / SEASONS
-- ============================================================
create table seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  season_number int not null,
  theme_stat_key text not null,       -- which stat's weakness this season represents
  boss_name text not null,            -- e.g. "The Shadow of Laziness"
  hp_max int not null,
  hp_current int not null,
  started_at timestamptz default now(),
  defeated_at timestamptz,            -- null while active
  reflection_note text                -- user's post-defeat reflection entry
);

-- Only one active season per user at a time (hp_current > 0 and defeated_at is null)

-- ============================================================
-- TREE / FOUNDATION HEALTH
-- Computed from rolling 7-10 day completion rate of faith/wisdom/strength/character tasks.
-- This table stores a daily snapshot so history/streak charts are cheap to query.
-- ============================================================
create table tree_health_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  log_date date not null default current_date,
  vitality_pct int not null,          -- 0-100
  tier text not null check (tier in ('dry','wilting','healthy','flourishing')),
  modifier int not null,              -- -2, -1, 0, +2
  unique(user_id, log_date)
);

-- ============================================================
-- DAILY REFLECTIONS — night reflection journal
-- ============================================================
create table daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  reflection_date date not null default current_date,
  accomplished text,
  struggled text,
  grateful_for text,
  improve_tomorrow text,
  created_at timestamptz default now(),
  unique(user_id, reflection_date)
);

-- ============================================================
-- GOAL RESTORATION (R35 / stewardship project)
-- Single active goal per user for MVP.
-- ============================================================
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null default 'Nissan GT-R R35 Restoration',
  target_amount numeric not null default 100000,
  current_amount numeric not null default 0,
  is_active boolean default true,
  celebrated_at timestamptz,
  created_at timestamptz default now()
);

create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric not null,
  contributed_date date not null default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — every table locked to its owner
-- ============================================================
alter table profiles enable row level security;
alter table stats enable row level security;
alter table task_completions enable row level security;
alter table seasons enable row level security;
alter table tree_health_log enable row level security;
alter table goals enable row level security;
alter table goal_contributions enable row level security;
alter table daily_reflections enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own stats" on stats for all using (auth.uid() = user_id);
create policy "own completions" on task_completions for all using (auth.uid() = user_id);
create policy "own seasons" on seasons for all using (auth.uid() = user_id);
create policy "own tree log" on tree_health_log for all using (auth.uid() = user_id);
create policy "own goals" on goals for all using (auth.uid() = user_id);
create policy "own contributions" on goal_contributions for all using (auth.uid() = user_id);
create policy "own reflections" on daily_reflections for all using (auth.uid() = user_id);

-- task_definitions is public read-only reference data
alter table task_definitions enable row level security;
create policy "anyone can read tasks" on task_definitions for select using (true);
