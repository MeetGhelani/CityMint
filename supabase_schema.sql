-- CITYMINT SUPABASE SCHEMA INITIALIZATION SCRIPT
-- Run this in your Supabase SQL Editor

-- 1. CLEANUP (Optional)
drop table if exists transactions cascade;
drop table if exists game_properties cascade;
drop table if exists game_players cascade;
drop table if exists games cascade;

-- 2. CREATE TABLES

-- Games table
create table games (
  id text primary key,
  status text not null check (status in ('SETUP', 'ACTIVE', 'BANKRUPTCY_REVIEW', 'ENDED')),
  current_player_id text,
  turn_number integer not null default 1,
  winner_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Game Players table
create table game_players (
  game_id text references games(id) on delete cascade,
  player_id text not null,
  player_code text not null,
  name text not null,
  color text not null,
  balance numeric not null default 10000,
  status text not null check (status in ('ACTIVE', 'IN_JAIL', 'BANKRUPT', 'ELIMINATED')),
  jail_turns integer not null default 0,
  primary key (game_id, player_id)
);

-- Game Properties table
create table game_properties (
  game_id text references games(id) on delete cascade,
  property_id text not null,
  owner_id text,
  level integer not null default 1 check (level >= 1 and level <= 5),
  primary key (game_id, property_id)
);

-- Transactions table
create table transactions (
  id uuid primary key,
  game_id text references games(id) on delete cascade,
  turn_number integer not null,
  type text not null,
  source_player_id text,
  target_player_id text,
  amount numeric not null,
  property_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
alter table games enable row level security;
alter table game_players enable row level security;
alter table game_properties enable row level security;
alter table transactions enable row level security;

-- 4. CREATE POLICIES (Allow public access for initial banker device setup since there is no player-auth required)
-- Policies for Games
create policy "Allow public read games" on games for select using (true);
create policy "Allow public insert games" on games for insert with check (true);
create policy "Allow public update games" on games for update using (true);

-- Policies for Game Players
create policy "Allow public read game_players" on game_players for select using (true);
create policy "Allow public insert game_players" on game_players for insert with check (true);
create policy "Allow public update game_players" on game_players for update using (true);

-- Policies for Game Properties
create policy "Allow public read game_properties" on game_properties for select using (true);
create policy "Allow public insert game_properties" on game_properties for insert with check (true);
create policy "Allow public update game_properties" on game_properties for update using (true);

-- Policies for Transactions
create policy "Allow public read transactions" on transactions for select using (true);
create policy "Allow public insert transactions" on transactions for insert with check (true);
create policy "Allow public update transactions" on transactions for update using (true);
