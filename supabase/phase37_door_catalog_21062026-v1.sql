-- Phase 37 — Flush-to-Zero Door module: door_catalog
-- Run in Supabase SQL Editor (Marble project: givcxgzhfoetujhrjgvc).
-- Idempotent. Seeds the 5 stones (render_url null until Nano renders are uploaded).

create extension if not exists "pgcrypto";

create table if not exists public.door_catalog (
  id                uuid primary key default gen_random_uuid(),
  stone_id          text unique not null,           -- 'calacatta' | 'statuario' | 'nero' | 'amperdor' | 'gold'
  name_he           text not null,
  swatch_hex        text not null,
  render_url        text,                            -- Cloudinary URL; null until uploaded
  base_price_ils    numeric not null default 0,      -- price at reference size 2000x1500, VAT-incl
  price_per_sqm_ils numeric not null default 0,      -- added per m² above the reference area
  sort_order        int not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.door_catalog enable row level security;
drop policy if exists "anon all door_catalog" on public.door_catalog;
create policy "anon all door_catalog" on public.door_catalog
  for all using (true) with check (true);

-- Seed the 5 stones (example prices — edit in the CRM door editor).
insert into public.door_catalog (stone_id, name_he, swatch_hex, base_price_ils, price_per_sqm_ils, sort_order)
values
  ('calacatta', 'קלקטה',       '#ECE9E2', 42000, 7000, 1),
  ('statuario', 'סטטוארית',    '#F1F0EC', 45000, 7200, 2),
  ('nero',      'נרו מרקינה',  '#232323', 47000, 7500, 3),
  ('amperdor',  'אמפרדור',     '#6B5240', 44000, 7000, 4),
  ('gold',      'קלקטה גולד',  '#C4A35A', 52000, 8500, 5)
on conflict (stone_id) do nothing;
