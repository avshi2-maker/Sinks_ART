-- ============================================================================
-- Phase 17.5 — tasks table + RLS policies
-- File: tasks_table_10052026-v1.sql
-- Date: 10/05/2026 (Sunday)
--
-- Adds the tasks table to support the dashboard's TasksStrip.
-- Source enum: whatsapp / call / email / manual / calendar (matches Mockup v2)
-- Status enum:  open / done / cancelled
-- Anon RLS open for read+write (tighten in Phase 20+ when real auth ships)
-- ============================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  project_id      uuid REFERENCES public.projects(id)  ON DELETE SET NULL,
  title_he        text NOT NULL,
  notes_he        text,
  source          text NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('whatsapp','call','email','manual','calendar')),
  due_date        date,
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','done','cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  cancelled_at    timestamptz
);

-- 2. Indexes for common queries
CREATE INDEX IF NOT EXISTS tasks_status_due_idx ON public.tasks (status, due_date)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS tasks_customer_idx   ON public.tasks (customer_id)
  WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tasks_project_idx    ON public.tasks (project_id)
  WHERE project_id IS NOT NULL;

-- 3. Enable Row-Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. Open policies for anon during user testing (tighten in Phase 20+)
CREATE POLICY tasks_anon_select ON public.tasks FOR SELECT TO anon USING (true);
CREATE POLICY tasks_anon_insert ON public.tasks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY tasks_anon_update ON public.tasks FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY tasks_anon_delete ON public.tasks FOR DELETE TO anon USING (true);

-- 5. Insert ONE seed task so we can verify reads work end-to-end
INSERT INTO public.tasks (title_he, source, due_date, status)
VALUES ('משימה ראשונה - בדיקה (ניתן למחוק)', 'manual', CURRENT_DATE, 'open');

-- 6. Verify everything
SELECT 'Table created with rows: ' || count(*)::text AS result FROM public.tasks;
