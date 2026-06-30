-- supabase/phase40_ales_price_breaks_30062026.sql
-- Ales turnkey labor price-breaks by configuration (width / sinks / etc).
-- The offer builder's base-price picker reads from here. All rows editable;
-- new configs added freely over time. Run BEFORE deploying the builder code.

create table if not exists ales_price_breaks (
  id          uuid primary key default gen_random_uuid(),
  label_he    text not null,            -- e.g. '1.0 מטר', '2.0 מטר', 'כיור כפול'
  price_ils   numeric not null default 0,
  kind        text not null default 'base',  -- 'base' = standalone config, 'addon' = +extra (e.g. double sink)
  sort_order  int not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ales_price_breaks_active_idx
  on ales_price_breaks (sort_order) where archived_at is null;

-- Open anon RLS (matches the CRM's existing pattern; tighten with real auth later).
alter table ales_price_breaks enable row level security;
drop policy if exists "anon all ales_price_breaks" on ales_price_breaks;
create policy "anon all ales_price_breaks" on ales_price_breaks for all to anon using (true) with check (true);

-- Seed with Avshi's real price-breaks.
insert into ales_price_breaks (label_he, price_ils, kind, sort_order) values
  ('1.0 מטר',          6000, 'base',  10),
  ('1.5 מטר',          7000, 'base',  20),
  ('2.0 מטר',          8000, 'base',  30),
  ('מעל 2.0 מטר',     10000, 'base',  40),
  ('כיור כפול (תוספת)', 2000, 'addon', 50);
