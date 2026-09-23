-- phase43 · case_studies · 23.09.2026
-- One row per finished Ales job → edited/approved in CRM /case-studies → published on marble-art.co.il/projects/[slug].
create table if not exists case_studies (
  id               uuid primary key default gen_random_uuid(),
  ales_job_id      uuid unique,                       -- source row in the Ales project (oqqviohkynhmbfsqntxr)
  status           text not null default 'new',       -- new | generated | published | archived
  job_type         text,
  title_raw        text,
  city             text,
  customer_name    text,                              -- INTERNAL only, never published
  customer_id      uuid,                              -- optional link to customers
  first_name       text,
  fields           jsonb not null default '{}'::jsonb, -- Ales per-type fields (stone, size, story…)
  notes            text,
  before_media     jsonb not null default '[]'::jsonb,
  after_media      jsonb not null default '[]'::jsonb,
  voice            jsonb,                             -- {url, public_id, durationSec}
  rating           int,
  quote            text,
  consent          jsonb not null default '{}'::jsonb, -- {photos, name_city, quote, stamped_at}
  finish_date      date,
  ales_created_at  timestamptz,
  transcript       text,
  transcript_cost  numeric,
  gen              jsonb not null default '{}'::jsonb, -- generated + edited case file
  slug             text unique,
  gen_tokens_in    int,
  gen_tokens_out   int,
  gen_cost         numeric,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists case_studies_status_idx on case_studies (status);
create index if not exists case_studies_published_idx on case_studies (published_at desc);

alter table case_studies enable row level security;
drop policy if exists "anon all case_studies" on case_studies;
create policy "anon all case_studies" on case_studies for all to anon using (true) with check (true);
