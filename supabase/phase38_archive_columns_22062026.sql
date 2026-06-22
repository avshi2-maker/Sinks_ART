-- supabase/phase38_archive_columns_22062026.sql
-- Adds a reversible "hide from dashboard" flag to projects and communications.
-- Run this in the Supabase SQL Editor (Marble project) BEFORE deploying the code.
-- Existing rows get NULL (= visible). Hide a row by setting archived_at = now();
-- restore it by setting archived_at = NULL.

alter table projects
  add column if not exists archived_at timestamptz;

alter table customer_communications
  add column if not exists archived_at timestamptz;

-- Helpful partial indexes for the "still visible" lookups the dashboard does.
create index if not exists projects_archived_at_idx
  on projects (archived_at) where archived_at is null;

create index if not exists customer_communications_archived_at_idx
  on customer_communications (archived_at) where archived_at is null;
