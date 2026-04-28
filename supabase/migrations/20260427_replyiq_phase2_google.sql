-- ReplyIQ Phase 2 schema additions
-- Run this in Supabase SQL Editor before using Google Business Profile sync.

alter table if exists reviews
  add column if not exists external_review_id text,
  add column if not exists external_location_id text;

create unique index if not exists reviews_user_platform_external_review_idx
  on reviews(user_id, platform, external_review_id)
  where external_review_id is not null;

create table if not exists google_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null unique,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  status text default 'connected',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists google_locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  connection_id uuid references google_connections(id) on delete cascade not null,
  google_account_name text not null,
  google_location_name text not null,
  title text,
  store_code text,
  synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, google_location_name)
);

alter table google_connections enable row level security;
alter table google_locations enable row level security;

drop policy if exists "Users can manage own google connections" on google_connections;
create policy "Users can manage own google connections"
  on google_connections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own google locations" on google_locations;
create policy "Users can manage own google locations"
  on google_locations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
