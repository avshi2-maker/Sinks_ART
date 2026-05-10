-- ============================================================================
-- Phase 27a — quotes + quote_lines tables (Stage 1 schema)
-- File: quotes_tables_10052026-v1.sql
-- Date: 10/05/2026
--
-- Marble Art Sinks — Quote Engine, extracted/adapted from Beni's POF module.
-- Uses separate quote_lines table (not JSONB) for queryability and future links
-- to sinks gallery + marble samples. B2C-specific (no contractor/tender fields).
-- Anon RLS open for read+write during testing (tighten Phase 20+).
-- ============================================================================

-- 1. quotes table — header info per quote
CREATE TABLE IF NOT EXISTS public.quotes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  quote_number        text NOT NULL UNIQUE,

  customer_id         uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  project_id          uuid REFERENCES public.projects(id)  ON DELETE SET NULL,

  customer_name_he    text,
  customer_phone      text,
  customer_email      text,
  customer_address    text,

  project_title_he    text,
  project_location_he text,

  status              text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','sent','approved','rejected','expired')),

  vat_rate            numeric(5,4) NOT NULL DEFAULT 0.18,
  total_subtotal      numeric(12,2) NOT NULL DEFAULT 0,
  total_vat           numeric(12,2) NOT NULL DEFAULT 0,
  total_grand         numeric(12,2) NOT NULL DEFAULT 0,

  currency_code       text DEFAULT 'ILS',

  valid_until         date,
  start_date          date,
  end_date            date,

  notes_he            text,
  payment_terms_he    text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  sent_at             timestamptz,
  approved_at         timestamptz,
  rejected_at         timestamptz,

  source              text DEFAULT 'manual'
                      CHECK (source IN ('manual','from_call','from_intake','imported'))
);

-- 2. quote_lines table
CREATE TABLE IF NOT EXISTS public.quote_lines (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id            uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,

  line_number         int NOT NULL,

  description_he      text NOT NULL,
  unit                text NOT NULL
                      CHECK (unit IN ('ס"ע','מ"ר','מ"ל','יח''','טון','שעות','פאושלי','קג','מ"ק')),
  quantity            numeric(12,3) NOT NULL DEFAULT 0,
  unit_cost           numeric(12,2) NOT NULL DEFAULT 0,

  vat_applies         boolean NOT NULL DEFAULT true,

  line_total          numeric(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  sink_id             uuid,
  marble_sample_id    uuid,

  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS quotes_customer_idx       ON public.quotes (customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS quotes_project_idx        ON public.quotes (project_id)  WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS quotes_status_created_idx ON public.quotes (status, created_at DESC);
CREATE INDEX IF NOT EXISTS quote_lines_quote_idx     ON public.quote_lines (quote_id, line_number);

-- 4. Enable RLS
ALTER TABLE public.quotes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_lines ENABLE ROW LEVEL SECURITY;

-- 5. Anon policies (tighten Phase 20+)
CREATE POLICY quotes_anon_select       ON public.quotes      FOR SELECT TO anon USING (true);
CREATE POLICY quotes_anon_insert       ON public.quotes      FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY quotes_anon_update       ON public.quotes      FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY quotes_anon_delete       ON public.quotes      FOR DELETE TO anon USING (true);
CREATE POLICY quote_lines_anon_select  ON public.quote_lines FOR SELECT TO anon USING (true);
CREATE POLICY quote_lines_anon_insert  ON public.quote_lines FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY quote_lines_anon_update  ON public.quote_lines FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY quote_lines_anon_delete  ON public.quote_lines FOR DELETE TO anon USING (true);

-- 6. Seed quote
INSERT INTO public.quotes (
  quote_number, customer_name_he, project_title_he, status,
  notes_he, payment_terms_he, total_subtotal, total_vat, total_grand
) VALUES (
  'MARB-2026-001',
  'בדיקה ראשונה (ניתן למחוק)',
  'הצעת מחיר לבדיקת המערכת',
  'draft',
  'הצעת מחיר לבדיקה. ניתן למחוק.',
  '50% מקדמה, יתרה במסירה',
  4500.00,
  810.00,
  5310.00
);

-- 7. Seed lines
WITH q AS (SELECT id FROM public.quotes WHERE quote_number = 'MARB-2026-001')
INSERT INTO public.quote_lines (quote_id, line_number, description_he, unit, quantity, unit_cost, vat_applies)
SELECT q.id, 1, 'כיור שיש Carrara - מרובע 50x40', 'יח''', 1, 3500.00, true FROM q
UNION ALL
SELECT q.id, 2, 'התקנה במקום הלקוח', 'שעות', 4, 250.00, true FROM q;

-- 8. Verify
SELECT 'Quotes: ' || count(*)::text AS quotes      FROM public.quotes
UNION ALL
SELECT 'Lines: '  || count(*)::text                FROM public.quote_lines;
