-- ════════════════════════════════════════════════════════════════
-- Phase D fix — Add anon INSERT policy on customers table
-- ════════════════════════════════════════════════════════════════
--
-- Context: /sinc Phase D save flow (Path B: create new customer)
-- needs to INSERT into customers from the browser anon client.
-- Existing policies allow SELECT for anon, but only authenticated
-- users can INSERT. This blocks the new-customer save path.
--
-- Action: add a single anon_insert_customers policy mirroring the
-- existing anon_insert_projects pattern.
--
-- Safety:
--   - Pure CREATE POLICY, no data touched
--   - Matches the existing project-level convention
--   - Aligns with Session 14 decision: "RLS open for anon writes
--     across the CRM. Tighter security is Phase 16+ work."
--
-- Rollback (if ever needed):
--   DROP POLICY anon_insert_customers ON customers;
--
-- Phase D fix file 2 of N (07/05/2026)
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE POLICY anon_insert_customers ON customers
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Verify the new policy exists
SELECT policyname, cmd, with_check::text AS with_check_clause
FROM pg_policies
WHERE tablename = 'customers'
  AND policyname = 'anon_insert_customers';

COMMIT;
