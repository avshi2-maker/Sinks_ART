-- phase44 · case_studies.social_log · 23.09.2026
-- Written by Content Studio (studio.marble-art.co.il/cases) when a case is marked posted per network.
alter table case_studies add column if not exists social_log jsonb not null default '{}'::jsonb;
