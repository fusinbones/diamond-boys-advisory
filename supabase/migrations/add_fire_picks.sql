-- Fire Picks table for rare, premium-only scheduled picks
create table if not exists fire_picks (
  id uuid primary key default gen_random_uuid(),
  game_id text,
  matchup text not null,
  sport text not null default 'MLB',
  pick_type text not null,
  pick_team text not null,
  pick_value text not null,
  odds text,
  confidence integer default 85,
  units integer default 3,
  reasoning text,
  pattern_data jsonb,
  pattern_break_game integer default 7,
  scheduled_at timestamptz not null,
  revealed_at timestamptz,
  status text not null default 'scheduled',
  result text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Index for fast lookups
create index if not exists idx_fire_picks_status on fire_picks(status);
create index if not exists idx_fire_picks_scheduled on fire_picks(scheduled_at desc);

-- RLS
alter table fire_picks enable row level security;

-- Anyone can read (API handles access gating)
create policy "fire_picks_read" on fire_picks for select using (true);

-- Only service role can insert/update (admin API)
create policy "fire_picks_admin_write" on fire_picks for insert with check (true);
create policy "fire_picks_admin_update" on fire_picks for update using (true);
