-- =====================================================================
-- Session 26 — Trial Campaign Asset System + Lead Capture
-- Date: 17/05/2026 (version 1)
-- Project: Marble Art Sinks
-- Run in: Sinks_ART Supabase SQL editor (SHARED database, not a new project)
--
-- This migration creates 4 new tables and extends 2 existing tables.
-- All tables designed mirror-compatible with future CRM structures
-- for zero-friction scaling once trial validates.
--
-- IDEMPOTENT — safe to re-run.
-- =====================================================================


-- =====================================================================
-- STEP 0 — DIAGNOSTIC (read-only, run FIRST)
-- =====================================================================
-- Confirm Phase 23 tables still exist and the project is healthy.

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'marble_samples', 'marble_sample_photos', 'concept_renderings',
    'sinks', 'customers', 'projects'
  )
ORDER BY table_name;

-- Expected: all 6 tables present. If any missing, STOP and ping back.


-- =====================================================================
-- STEP 1 — Create dealers table (marble suppliers)
-- =====================================================================
-- Tracks who Ales buys marble from. Each dealer can have many marble_samples.

CREATE TABLE IF NOT EXISTS dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name_he TEXT NOT NULL,
  name_en TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- Location
  address_he TEXT,
  city_he TEXT,
  region_he TEXT,

  -- Quality
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes_he TEXT,

  -- Lifecycle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dealers_active
  ON dealers(is_active) WHERE is_archived = FALSE;

-- Link marble_samples to dealers (structured replacement for old supplier_name text)
ALTER TABLE marble_samples
  ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES dealers(id);


-- =====================================================================
-- STEP 2 — Create sink_media (THE central asset table)
-- =====================================================================
-- 9 first-class facets for fast filtering, plus extensibility via
-- custom_tags[] and metadata JSONB. Both campaign site and CRM read here.

CREATE TABLE IF NOT EXISTS sink_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cloudinary anchor
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  original_filename TEXT,
  file_size_bytes BIGINT,
  width_px INTEGER,
  height_px INTEGER,
  mime_type TEXT,

  -- === LOCKED 9 FACETS (first-class columns) ===

  subject_type TEXT NOT NULL CHECK (subject_type IN (
    'finished_sink',          -- a real, completed sink (Ales workshop output)
    'marble_sample',          -- a marble slab or texture sample
    'workshop_process',       -- hands working, tools, in-progress
    'portrait',               -- person photo (Ales, Avshi, etc.)
    'bathroom_scene',         -- room context shot, no sink primary focus
    'competitor_research',    -- AliExpress, big-box ceramic shots (internal only)
    'concept_render',         -- AI-generated (Nano Banana) preview
    'sketch',                 -- hand-drawn line art (Ales)
    'other'
  )),

  sink_config TEXT CHECK (sink_config IN (
    'dual_pitch', 'single_pitch', 'double_basin', 'with_cabinet',
    'wall_mounted', 'freestanding', 'extra_wide', 'mixed', 'unknown'
  )),

  marble_family TEXT CHECK (marble_family IN (
    'white', 'beige', 'cream', 'grey', 'black',
    'green', 'brown', 'red', 'blue', 'multi_color', 'unknown'
  )),

  veining_intensity TEXT CHECK (veining_intensity IN (
    'none', 'subtle', 'moderate', 'dramatic', 'unknown'
  )),

  room_context TEXT CHECK (room_context IN (
    'installed_bathroom', 'installed_kitchen', 'workshop',
    'studio_isolated', 'outdoor', 'unknown'
  )),

  media_type TEXT NOT NULL CHECK (media_type IN (
    'photo', 'video', 'sketch_scan', 'ai_render', '3d_model'
  )),

  quality_tier TEXT NOT NULL DEFAULT 'supporting' CHECK (quality_tier IN (
    'hero',              -- campaign-ready, used on landing pages
    'supporting',        -- good but secondary
    'reference_only',    -- internal use only
    'archive'            -- old, kept for record
  )),

  media_source TEXT NOT NULL CHECK (media_source IN (
    'ales_workshop',          -- Ales took it
    'customer_install',       -- customer/architect sent it
    'nano_banana',            -- AI-generated
    'competitor_aliexpress',  -- competitor research
    'pinterest_ref',          -- internet reference
    'dealer_photo',           -- marble dealer's catalog
    'other'
  )),

  has_people BOOLEAN NOT NULL DEFAULT FALSE,

  -- === EXTENSIBILITY (no future migrations) ===

  custom_tags TEXT[] NOT NULL DEFAULT '{}',  -- e.g., ['client_gadi','project_2026_03']
  metadata JSONB NOT NULL DEFAULT '{}',       -- typed future fields

  -- === LINKED SOURCE REFERENCES ===

  marble_id UUID REFERENCES marble_samples(id),    -- if photo of a marble sample
  sink_id UUID REFERENCES sinks(id),                -- if photo of a catalog sink
  dealer_id UUID REFERENCES dealers(id),            -- if photo from a dealer

  -- === AI TAGGING AUDIT TRAIL ===

  ai_tagged_at TIMESTAMPTZ,
  ai_model TEXT,                                    -- e.g., 'claude-sonnet-4-6'
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence BETWEEN 0 AND 1),
  ai_raw_output JSONB,                              -- full model response, for debugging
  human_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  human_corrections JSONB,                          -- track what was changed

  -- === CAPTIONS ===

  caption_he TEXT,
  caption_en TEXT,

  -- === LIFECYCLE ===

  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,      -- gate for public/campaign gallery

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Filter performance indexes
CREATE INDEX IF NOT EXISTS idx_sink_media_subject
  ON sink_media(subject_type) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_sink_media_marble_family
  ON sink_media(marble_family) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_sink_media_quality
  ON sink_media(quality_tier) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_sink_media_published
  ON sink_media(is_published, quality_tier) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_sink_media_marble_ref ON sink_media(marble_id);
CREATE INDEX IF NOT EXISTS idx_sink_media_sink_ref ON sink_media(sink_id);
CREATE INDEX IF NOT EXISTS idx_sink_media_dealer_ref ON sink_media(dealer_id);
CREATE INDEX IF NOT EXISTS idx_sink_media_created
  ON sink_media(created_at DESC);

-- GIN indexes for array + JSONB filtering (the extensibility win)
CREATE INDEX IF NOT EXISTS idx_sink_media_custom_tags
  ON sink_media USING GIN(custom_tags);
CREATE INDEX IF NOT EXISTS idx_sink_media_metadata
  ON sink_media USING GIN(metadata);


-- =====================================================================
-- STEP 3 — Link existing tables to sink_media (source-of-truth pattern)
-- =====================================================================
-- After this, marble_samples.primary_media_id and sinks.primary_media_id
-- point into sink_media. No more duplicate image URLs across tables.

ALTER TABLE marble_samples
  ADD COLUMN IF NOT EXISTS primary_media_id UUID REFERENCES sink_media(id);

ALTER TABLE sinks
  ADD COLUMN IF NOT EXISTS primary_media_id UUID REFERENCES sink_media(id);


-- =====================================================================
-- STEP 4 — Create leads table (campaign form submissions)
-- =====================================================================
-- Designed mirror-compatible with customers table. When trial validates,
-- promotion to customer is a simple INSERT INTO customers SELECT * FROM leads WHERE status='won'.

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('whatsapp', 'phone', 'email')),

  -- Project context
  city_he TEXT,
  project_type TEXT CHECK (project_type IN (
    'new_construction', 'renovation', 'replacement', 'commercial', 'other'
  )),
  has_architect BOOLEAN,
  architect_name TEXT,

  -- === THE PRICE-TOLERANCE DATA (the whole point of the trial) ===
  budget_tier TEXT CHECK (budget_tier IN (
    'tier_1_8k_15k',     -- 8,000 - 15,000 ILS
    'tier_2_15k_25k',    -- 15,000 - 25,000 ILS
    'tier_3_25k_50k',    -- 25,000 - 50,000 ILS
    'tier_4_50k_plus'    -- 50,000+ ILS
  )),

  -- What they want
  inspiration_image_urls TEXT[],                    -- if they uploaded reference images
  preferred_marble_family TEXT,                     -- if they picked from gallery
  preferred_sink_config TEXT,
  notes_he TEXT,                                    -- free-form from form

  -- Marketing attribution (CRITICAL for ROI analysis)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  referrer_url TEXT,
  landing_page TEXT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'spam'
  )),
  follow_up_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,

  -- Conversion link (when won → real customer/project)
  converted_to_customer_id UUID REFERENCES customers(id),
  converted_to_project_id UUID REFERENCES projects(id),

  -- Internal
  internal_notes_he TEXT,

  -- Lifecycle
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status
  ON leads(status) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_budget
  ON leads(budget_tier) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_created
  ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_utm
  ON leads(utm_source, utm_campaign);


-- =====================================================================
-- STEP 5 — Create cost_rates (Phase 24 placeholder)
-- =====================================================================
-- Mirrors Avshi's Excel structure. Empty by default. Populated when Quote Engine ships.

CREATE TABLE IF NOT EXISTS cost_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  rate_type TEXT NOT NULL CHECK (rate_type IN (
    'monthly_fixed',      -- warehouse, insurance, accountant, etc.
    'daily_labor',        -- Ales, Ruslan, Avshi daily rates
    'material_per_sqm',   -- marble, ceramic, adhesive, paint, polishing
    'project_fee',        -- one-time fees
    'markup_percent',     -- margin %
    'other'
  )),

  name_he TEXT NOT NULL,
  name_en TEXT,

  amount_ils NUMERIC(10,2),                         -- for fixed amounts
  percent NUMERIC(5,2),                             -- for markup_percent type

  unit TEXT,                                        -- 'month','day','sqm','project','percent'

  -- Validity window (track price changes over time)
  active_from DATE NOT NULL DEFAULT CURRENT_DATE,
  active_to DATE,                                   -- NULL = currently active

  notes_he TEXT,
  display_order INTEGER NOT NULL DEFAULT 100,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_rates_type
  ON cost_rates(rate_type) WHERE active_to IS NULL;


-- =====================================================================
-- STEP 6 — Auto-update triggers
-- =====================================================================
-- Reuses set_updated_at() function from Phase 23 (Session 1).

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dealers_updated ON dealers;
CREATE TRIGGER trg_dealers_updated BEFORE UPDATE ON dealers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_sink_media_updated ON sink_media;
CREATE TRIGGER trg_sink_media_updated BEFORE UPDATE ON sink_media
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_leads_updated ON leads;
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cost_rates_updated ON cost_rates;
CREATE TRIGGER trg_cost_rates_updated BEFORE UPDATE ON cost_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =====================================================================
-- STEP 7 — Verification (run after migration completes)
-- =====================================================================

-- 7a. Confirm 4 new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sink_media', 'leads', 'cost_rates', 'dealers')
ORDER BY table_name;
-- Expected: 4 rows

-- 7b. Confirm linking columns added to existing tables
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('primary_media_id', 'dealer_id')
ORDER BY table_name, column_name;
-- Expected: marble_samples.dealer_id, marble_samples.primary_media_id, sink_media.dealer_id,
--           sink_media.marble_id, sink_media.sink_id, sinks.primary_media_id

-- 7c. Confirm indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sink_media', 'leads', 'cost_rates', 'dealers')
ORDER BY tablename, indexname;
-- Expected: ~15 indexes total


-- =====================================================================
-- DONE. Next steps in Session 26:
--   1. Verify STEP 7 output looks right
--   2. Ping me back, I deliver the AI tagger script + .env.local template
--   3. Run tagger on test batch (Google Drive download)
--   4. Review tagging quality in sink_media
--   5. Phase 23.7 Next.js scaffold begins
-- =====================================================================
