-- =====================================================================
-- Phase 23 — Marble Library + Concept Renderings (Session 1: Schema)
-- Date: 15/05/2026 (version 1)
-- Project: Sinks_ART (Marble Art Sinks)
-- Run in: Supabase SQL editor for the Sinks_ART project
--
-- This migration:
--   1. Extends sinks.source_type to include 'sketch' (line-art catalog entries)
--   2. Creates marble_samples (dynamic material library)
--   3. Creates marble_sample_photos (0..N photos per marble)
--   4. Creates concept_renderings (per-lead AI-generated previews)
--
-- This migration is IDEMPOTENT — safe to re-run.
-- =====================================================================


-- =====================================================================
-- STEP 0 — DIAGNOSTIC (read-only, run first to inspect current state)
-- =====================================================================
-- Run these three SELECTs first. They are read-only. Confirm the output
-- looks sane before running Steps 1-4 below.
--
-- If source_type is an ENUM (not TEXT with CHECK), send me the output of
-- the second query and I'll provide an ENUM-style migration.
-- =====================================================================

-- 0a. What columns does the sinks table have?
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sinks'
ORDER BY ordinal_position;

-- 0b. What constraints does source_type have? (CHECK vs ENUM detection)
SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'sinks' AND con.contype = 'c';

-- 0c. Existing source_type values currently in use
SELECT source_type, COUNT(*) AS row_count
FROM sinks
GROUP BY source_type
ORDER BY row_count DESC;


-- =====================================================================
-- STEP 1 — Extend sinks.source_type to allow 'sketch'
-- =====================================================================
-- ASSUMES source_type is TEXT with a CHECK constraint (common Supabase pattern).
-- If diagnostic 0b shows an ENUM type instead, skip this block and ping me.

ALTER TABLE sinks DROP CONSTRAINT IF EXISTS sinks_source_type_check;

ALTER TABLE sinks ADD CONSTRAINT sinks_source_type_check
  CHECK (source_type IN ('concept', 'real_photo', 'inspiration', 'sketch'));

-- After this:
--   'concept'      = AI-rendered preview, approved by artist (the existing one)
--   'real_photo'   = actual finished sink photo
--   'inspiration'  = reference image, never publicly displayed
--   'sketch'       = NEW. Eli's line-art catalog entry (a structural primitive)


-- =====================================================================
-- STEP 2 — Create marble_samples (dynamic material library)
-- =====================================================================

CREATE TABLE IF NOT EXISTS marble_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name_he TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT NOT NULL,                       -- URL-safe, unique. e.g. "carrara-classico"

    -- Visual character (for filtering in the prompt generator)
    description_he TEXT,                      -- 1-2 line Hebrew description
    color_family TEXT CHECK (color_family IN (
        'white', 'beige', 'cream', 'grey', 'black',
        'green', 'brown', 'red', 'blue', 'multi'
    )),
    veining_intensity TEXT CHECK (veining_intensity IN (
        'none', 'subtle', 'moderate', 'dramatic'
    )),
    finish TEXT CHECK (finish IN (
        'polished', 'honed', 'leathered', 'brushed', 'flamed'
    )),

    -- Pricing (Q1: per square meter, ILS)
    price_per_sqm_ils NUMERIC(10, 2),         -- nullable, prices fluctuate
    price_updated_at TIMESTAMPTZ,

    -- Supplier & availability
    supplier_name TEXT,
    supplier_contact_he TEXT,                 -- phone or contact instructions
    availability_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (availability_status IN (
        'in_stock', 'low_stock', 'on_order', 'seasonal', 'discontinued', 'unknown'
    )),
    lead_time_days INTEGER,                   -- if not in_stock, days to source
    min_slab_size_cm TEXT,                    -- e.g. "100x200" or "120x240"
    last_seen_date DATE,                      -- when Eli last confirmed availability

    -- Free-form notes
    notes_he TEXT,

    -- Soft-delete (per "never delete" rule)
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT marble_samples_slug_unique UNIQUE (slug)
);

-- Indexes for prompt-generator filtering
CREATE INDEX IF NOT EXISTS idx_marble_samples_availability
  ON marble_samples(availability_status) WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_marble_samples_color
  ON marble_samples(color_family) WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_marble_samples_active
  ON marble_samples(is_archived, availability_status);


-- =====================================================================
-- STEP 3 — Create marble_sample_photos (Q2: 0..N photos per marble)
-- =====================================================================

CREATE TABLE IF NOT EXISTS marble_sample_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marble_id UUID NOT NULL REFERENCES marble_samples(id) ON DELETE CASCADE,

    -- Cloudinary anchor (per Architectural Rule)
    cloudinary_url TEXT NOT NULL,
    cloudinary_public_id TEXT,                -- for management/deletion later

    -- Photo metadata
    photo_kind TEXT CHECK (photo_kind IN (
        'hero', 'macro', 'on_sink', 'slab', 'workshop', 'other'
    )),
    display_order INTEGER NOT NULL DEFAULT 0,
    caption_he TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marble_sample_photos_marble
  ON marble_sample_photos(marble_id, display_order);

-- Enforce exactly one primary photo per marble (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_marble_sample_photos_one_primary
  ON marble_sample_photos(marble_id) WHERE is_primary = TRUE;


-- =====================================================================
-- STEP 4 — Create concept_renderings (per-lead AI-generated previews)
-- =====================================================================

CREATE TABLE IF NOT EXISTS concept_renderings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Required FKs per Architectural Rule
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,

    -- What was rendered (both nullable to support free-form prompts)
    sketch_id UUID REFERENCES sinks(id),
    marble_id UUID REFERENCES marble_samples(id),

    -- The prompt and output
    prompt_text TEXT NOT NULL,
    prompt_version TEXT,                      -- e.g. "v1", tracks prompt-generator iterations
    output_cloudinary_url TEXT,               -- nullable while pending/generating
    output_cloudinary_public_id TEXT,

    -- Generation lineage
    generation_source TEXT NOT NULL CHECK (generation_source IN ('forward', 'reverse')),
    -- 'forward' = operator picked sketch+marble
    -- 'reverse' = lead's inspiration image analyzed and matched to catalog

    lead_reference_image_url TEXT,            -- (reverse) the lead's uploaded inspiration
    analyzer_output_jsonb JSONB,              -- (reverse) what Claude vision extracted

    -- Cost tracking (per Rule #11 / Architectural Rule)
    gemini_cost_usd NUMERIC(10, 4),
    analyzer_cost_usd NUMERIC(10, 4),
    total_cost_usd NUMERIC(10, 4) GENERATED ALWAYS AS (
        COALESCE(gemini_cost_usd, 0) + COALESCE(analyzer_cost_usd, 0)
    ) STORED,

    -- Status flow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'generating', 'completed', 'failed', 'sent_to_lead', 'rejected'
    )),
    error_message TEXT,

    -- Outbound delivery
    sent_to_lead_at TIMESTAMPTZ,
    sent_via TEXT CHECK (sent_via IN ('whatsapp', 'email', 'in_person', 'other')),
    lead_feedback TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concept_renderings_customer
  ON concept_renderings(customer_id);

CREATE INDEX IF NOT EXISTS idx_concept_renderings_project
  ON concept_renderings(project_id);

CREATE INDEX IF NOT EXISTS idx_concept_renderings_status
  ON concept_renderings(status);

CREATE INDEX IF NOT EXISTS idx_concept_renderings_created
  ON concept_renderings(created_at DESC);


-- =====================================================================
-- STEP 5 — Auto-update updated_at on row changes
-- =====================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marble_samples_updated ON marble_samples;
CREATE TRIGGER trg_marble_samples_updated
  BEFORE UPDATE ON marble_samples
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_concept_renderings_updated ON concept_renderings;
CREATE TRIGGER trg_concept_renderings_updated
  BEFORE UPDATE ON concept_renderings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- STEP 6 — Verification (run after the migration completes)
-- =====================================================================
-- These should all return rows / OK statuses.

-- 6a. Confirm sinks.source_type accepts 'sketch'
SELECT pg_get_constraintdef(con.oid)
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'sinks' AND con.conname = 'sinks_source_type_check';

-- 6b. Confirm new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('marble_samples', 'marble_sample_photos', 'concept_renderings')
ORDER BY table_name;

-- 6c. Confirm indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('marble_samples', 'marble_sample_photos', 'concept_renderings')
ORDER BY indexname;


-- =====================================================================
-- DONE. Next steps:
--   - Confirm STEP 6 verification returns expected rows
--   - Ping back so I deliver Phase 23 seed sketches (10 catalog entries)
--   - Then Phase 23 Session 2 = /dashboard/marbles admin UI
-- =====================================================================
