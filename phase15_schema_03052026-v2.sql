-- ════════════════════════════════════════════════════════════════════
-- Phase 15 — Multi-Format Media Intake — Schema Migration
-- File: phase15_schema_03052026-v2.sql
-- Date: 03 May 2026
-- v2 fix: PRESERVES existing comm_type values ('call', 'whatsapp', 'email',
--         'meeting', 'photo', 'note', 'document', 'other') and ADDS the
--         6 new ones ('sketch', 'mp4', 'pdf', 'youtube', 'instagram', 'url').
-- Run in: Supabase SQL Editor → click Run
-- Expected result: "Success. No rows returned"
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Create media_analyses table ──────────────────────────────────
create table if not exists media_analyses (
  id              uuid primary key default gen_random_uuid(),
  comm_id         uuid not null references customer_communications(id) on delete cascade,
  customer_id     uuid not null references customers(id),
  project_id      uuid references projects(id),

  -- Source
  media_type      text not null check (media_type in (
                    'photo','sketch','mp4','pdf','youtube','instagram','url'
                  )),
  source_url      text,                       -- youtube/instagram/url; null for direct uploads
  cloudinary_url  text,                       -- the uploaded asset (null for URL-only types)
  thumbnail_url   text,                       -- preview JPEG for video/pdf
  source_filename text,                       -- original filename when uploaded

  -- Structured AI output
  extracted_dimensions  text,                 -- "60x40x15cm" or "TBD"
  extracted_stone_type  text,                 -- "carrara", "verde alpi", null if unclear
  extracted_shape       text,                 -- "oval", "rectangle", "freeform", null
  design_intent_he      text,                 -- short Hebrew paragraph of customer intent
  reference_summary_he  text,                 -- short Hebrew description of the reference itself
  ai_full_report        jsonb,                -- complete structured output (all fields)

  -- Workflow
  status          text not null default 'analyzed' check (status in (
                    'uploaded','analyzed','approved','rejected'
                  )),
  approved_by     text,                       -- 'avshi' or 'ales' once approved
  used_for_quote  boolean not null default false,

  -- Cost tracking
  api_cost_usd    numeric,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes for common lookup paths
create index if not exists media_analyses_comm_id_idx     on media_analyses(comm_id);
create index if not exists media_analyses_customer_id_idx on media_analyses(customer_id);
create index if not exists media_analyses_project_id_idx  on media_analyses(project_id);
create index if not exists media_analyses_status_idx      on media_analyses(status);

-- ── 2. Auto-update updated_at on row updates ────────────────────────
create or replace function set_media_analyses_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists media_analyses_updated_at_trigger on media_analyses;
create trigger media_analyses_updated_at_trigger
  before update on media_analyses
  for each row execute function set_media_analyses_updated_at();

-- ── 3. Row Level Security (matches existing tables for now) ─────────
alter table media_analyses enable row level security;

drop policy if exists "anon_select_media_analyses" on media_analyses;
create policy "anon_select_media_analyses" on media_analyses
  for select using (true);

drop policy if exists "anon_insert_media_analyses" on media_analyses;
create policy "anon_insert_media_analyses" on media_analyses
  for insert with check (true);

drop policy if exists "anon_update_media_analyses" on media_analyses;
create policy "anon_update_media_analyses" on media_analyses
  for update using (true) with check (true);

-- ── 4. Extend customer_communications.comm_type whitelist ───────────
-- v2: PRESERVES the existing 8 values, ADDS 6 new media types.
alter table customer_communications drop constraint if exists customer_communications_comm_type_check;

alter table customer_communications add constraint customer_communications_comm_type_check
  check (comm_type in (
    -- Existing values (preserved from yesterday's schema)
    'call',
    'whatsapp',
    'email',
    'meeting',
    'photo',
    'note',
    'document',
    'other',
    -- New values for Phase 15
    'sketch',
    'mp4',
    'pdf',
    'youtube',
    'instagram',
    'url'
  ));

-- ════════════════════════════════════════════════════════════════════
-- End of migration. Verify with the query in the next message.
-- ════════════════════════════════════════════════════════════════════
