// src/lib/supabase.ts
// Single Supabase client used across the marble sinks app.
// Reads credentials from environment variables; never hardcodes them.
//
// Updated 04/05/2026 (Phase 15):
//   - Added Customer, Project, MediaAnalysis types
//   - Disabled auth subsystem (we don't use Supabase Auth yet)
//   - Original Sink/SinkImage/SinkWithImage types preserved exactly as gallery uses them

import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (and Vercel project settings for production).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:     false,
    autoRefreshToken:   false,
    detectSessionInUrl: false,
  },
});

// ─────────────────────────────────────────────────────────────────
// Sink catalog types (used by gallery/page.tsx and others)
// ─────────────────────────────────────────────────────────────────

export type SourceType = 'concept' | 'real_photo' | 'inspiration';

export interface Sink {
  id:                  string;
  slug:                string;
  artist_id:           string | null;
  name_he:             string;
  description_he:      string | null;
  shape:               string | null;
  stone_type_he:       string | null;
  stone_type_en:       string | null;
  default_dimensions:  string | null;
  weight_kg:           number | null;
  price_band:          string | null;
  source_type:         SourceType;
  ai_prompt:           string | null;
  ai_model:            string | null;
  ai_seed:             string | null;
  source_reference:    string | null;
  approved_by_artist:  boolean;
  is_published:        boolean;
  sort_order:          number | null;
  created_at:          string;
  updated_at:          string;
}

export interface SinkImage {
  cloudinary_url: string;
  is_primary:     boolean;
}

/**
 * Sink with attached images + flattened convenience fields.
 *
 * The gallery query does:
 *   .select('..., artists!inner(name_he), sink_images(cloudinary_url, is_primary)')
 *
 * Then flattens these in JS:
 *   primary_image_url = (sink_images.find(i => i.is_primary) ?? sink_images[0])?.cloudinary_url
 *   artist_name_he    = artists.name_he
 *
 * So SinkWithImage = the original sink fields + the relation arrays + the two flattened fields.
 */
export interface SinkWithImage extends Sink {
  artists:           { name_he: string } | { name_he: string }[];
  sink_images:       SinkImage[];
  primary_image_url: string | null;
  artist_name_he:    string;
}

// ─────────────────────────────────────────────────────────────────
// Customer / Project types (Session 13 — CRM)
// ─────────────────────────────────────────────────────────────────

export interface Customer {
  id:        string;
  name_he:   string;
  phone:     string | null;
  email:     string | null;
  source:    string | null;
  is_active: boolean;
}

export type ProjectStatus =
  | 'ליד'
  | 'שיחת בירור'
  | 'הצעת מחיר נשלחה'
  | 'אושר'
  | 'שולמה מקדמה'
  | 'תשלום מלא'
  | 'הסתיים'
  | 'אבוד';

export interface Project {
  id:           string;
  customer_id:  string;
  title_he:     string;
  status:       ProjectStatus;
  notes:        string | null;
  updated_at:   string;
}

/** A customer + their most recent active project (if any). */
export interface CustomerWithProject {
  customer:      Customer;
  activeProject: Project | null;
}

/** Statuses that count as closed — projects in these statuses are not the customer's "active" one. */
export const CLOSED_STATUSES: ProjectStatus[] = ['הסתיים', 'אבוד'];

// ─────────────────────────────────────────────────────────────────
// Media analysis types (Phase 15 — multi-format intake)
// ─────────────────────────────────────────────────────────────────

export type MediaTypeDB = 'photo' | 'sketch' | 'mp4' | 'pdf' | 'youtube' | 'instagram' | 'url';

export type MediaAnalysisStatus = 'uploaded' | 'analyzed' | 'approved' | 'rejected';

export interface MediaAnalysis {
  id:                    string;
  comm_id:               string;
  customer_id:           string;
  project_id:            string | null;
  media_type:            MediaTypeDB;
  source_url:            string | null;
  cloudinary_url:        string | null;
  thumbnail_url:         string | null;
  source_filename:       string | null;
  extracted_dimensions:  string | null;
  extracted_stone_type:  string | null;
  extracted_shape:       string | null;
  design_intent_he:      string | null;
  reference_summary_he:  string | null;
  ai_full_report:        Record<string, unknown> | null;
  status:                MediaAnalysisStatus;
  approved_by:           string | null;
  used_for_quote:        boolean;
  api_cost_usd:          number | null;
  created_at:            string;
  updated_at:            string;
}