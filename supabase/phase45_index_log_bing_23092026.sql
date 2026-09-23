-- phase45 · index_log Bing columns · 23.09.2026
alter table index_log add column if not exists bing_sent_at timestamptz;     -- IndexNow ping sent from CRM
alter table index_log add column if not exists bing_indexed_at timestamptz;  -- confirmed visible in Bing
