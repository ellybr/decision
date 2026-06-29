-- Run this in Supabase → SQL Editor
-- Cleans up previous tables and sets up Venn

drop table if exists couples;
drop table if exists rooms;

create table spaces (
  id text primary key,
  name text not null default 'Our Space',
  topic text not null default 'dinner',
  members jsonb not null default '[]',
  options jsonb not null default '[]',
  result jsonb,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table spaces;

alter table spaces enable row level security;
create policy "public read"   on spaces for select using (true);
create policy "public insert" on spaces for insert with check (true);
create policy "public update" on spaces for update using (true);
