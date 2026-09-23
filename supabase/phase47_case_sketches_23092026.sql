-- phase47 · sketches from Ales + AI sketch reading · 23.09.2026
alter table case_studies add column if not exists sketches jsonb not null default '[]'::jsonb;
alter table case_studies add column if not exists sketch_analysis jsonb not null default '[]'::jsonb; -- [{url, at, dims, shape, mount, drain, tap_hole, notes, raw, cost}]
