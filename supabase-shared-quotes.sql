create table if not exists public.shared_quotes (
  id text primary key,
  brand jsonb not null default '{}'::jsonb,
  catalog jsonb not null default '[]'::jsonb,
  quote jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes_history (
  id text primary key,
  sync_key text not null,
  status text not null default 'enviada',
  brand jsonb not null default '{}'::jsonb,
  catalog jsonb not null default '[]'::jsonb,
  quote jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_history_sync_key_idx
  on public.quotes_history (sync_key, created_at desc);

create table if not exists public.work_orders (
  id text primary key,
  sync_key text not null,
  quote_id text not null,
  status text not null default 'pendiente',
  meta jsonb not null default '{}'::jsonb,
  brand jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_orders_sync_key_idx
  on public.work_orders (sync_key, created_at desc);

create index if not exists work_orders_quote_id_idx
  on public.work_orders (quote_id);

alter table public.shared_quotes enable row level security;
alter table public.quotes_history enable row level security;
alter table public.work_orders enable row level security;

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

drop policy if exists "quotes history is readable" on public.quotes_history;
create policy "quotes history is readable"
on public.quotes_history
for select
to anon, authenticated
using (true);

drop policy if exists "quotes history is writable" on public.quotes_history;
create policy "quotes history is writable"
on public.quotes_history
for insert
to anon, authenticated
with check (true);

drop policy if exists "quotes history is updatable" on public.quotes_history;
create policy "quotes history is updatable"
on public.quotes_history
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "work orders are readable" on public.work_orders;
create policy "work orders are readable"
on public.work_orders
for select
to anon, authenticated
using (true);

drop policy if exists "work orders are writable" on public.work_orders;
create policy "work orders are writable"
on public.work_orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "work orders are updatable" on public.work_orders;
create policy "work orders are updatable"
on public.work_orders
for update
to anon, authenticated
using (true)
with check (true);
