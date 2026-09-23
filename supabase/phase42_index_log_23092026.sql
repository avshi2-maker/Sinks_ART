-- phase42 · index_log · 23.09.2026
-- Manual Google indexing tracker: one row per public URL of marble-art.co.il.
-- Rows are created automatically when a URL first appears in the live sitemap.
create table if not exists index_log (
  url           text primary key,
  kind          text not null default 'page',   -- project | guide | city | core | video
  first_seen    timestamptz not null default now(),
  submitted_at  timestamptz,                    -- you pressed "Request indexing" in Search Console
  indexed_at    timestamptz,                    -- you confirmed it shows in Google
  note          text
);
create index if not exists index_log_first_seen_idx on index_log (first_seen desc);

alter table index_log enable row level security;
drop policy if exists "anon all index_log" on index_log;
create policy "anon all index_log" on index_log for all to anon using (true) with check (true);
