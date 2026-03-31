create table if not exists public.shared_quotes (
  id text primary key,
  brand jsonb not null default '{}'::jsonb,
  catalog jsonb not null default '[]'::jsonb,
  quote jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shared_quotes enable row level security;

drop policy if exists "shared quotes are readable" on public.shared_quotes;
create policy "shared quotes are readable"
on public.shared_quotes
for select
to anon, authenticated
using (true);

drop policy if exists "shared quotes are writable" on public.shared_quotes;
create policy "shared quotes are writable"
on public.shared_quotes
for insert
to anon, authenticated
with check (true);

drop policy if exists "shared quotes are updatable" on public.shared_quotes;
create policy "shared quotes are updatable"
on public.shared_quotes
for update
to anon, authenticated
using (true)
with check (true);
