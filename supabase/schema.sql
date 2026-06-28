create table rooms (
  id text primary key,
  created_at timestamptz default now(),
  p1_name text not null default 'You',
  p2_name text not null default 'Your partner',
  p1_options text[] not null default '{}',
  p2_options text[] not null default '{}',
  p1_theme int not null default 0,
  p2_theme int not null default 1,
  result jsonb
);

-- Enable realtime updates
alter publication supabase_realtime add table rooms;

-- Allow anyone to read/write (it's a dinner picker, not a bank)
alter table rooms enable row level security;
create policy "public read"   on rooms for select using (true);
create policy "public insert" on rooms for insert with check (true);
create policy "public update" on rooms for update using (true);
