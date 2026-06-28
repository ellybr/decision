-- Run this in Supabase → SQL Editor

-- Drop old rooms table if you ran the previous schema
drop table if exists rooms;

create table couples (
  id text primary key,
  created_at timestamptz default now(),
  p1_name text not null default 'You',
  p2_name text not null default 'Your partner',
  p1_options text[] not null default '{}',
  p2_options text[] not null default '{}',
  p1_theme int not null default 0,
  p2_theme int not null default 1,
  p2_joined boolean not null default false,
  result jsonb
);

alter publication supabase_realtime add table couples;

alter table couples enable row level security;
create policy "public read"   on couples for select using (true);
create policy "public insert" on couples for insert with check (true);
create policy "public update" on couples for update using (true);
