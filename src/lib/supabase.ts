// src/lib/supabase.ts
// Single Supabase client used across the marble sinks app.
// Reads credentials from environment variables; never hardcodes them.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (and Vercel project settings).",
  );
}

// Public, browser-safe client — uses the anon key.
// RLS policies in Supabase enforce what this client can read/write.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Domain types (manually typed for now; can regen later with `supabase gen types`) ──

export type Shape =
  | "round"
  | "oval"
  | "rectangular"
  | "square"
  | "freeform"
  | "asymmetric";

export type SourceType = "concept" | "real_photo" | "inspiration";

export type PriceBand = "low" | "mid" | "high" | "premium";

export interface Artist {
  id: string;
  slug: string;
  name_he: string;
  name_en: string | null;
  bio_he: string | null;
  portrait_url: string | null;
  instagram: string | null;
  whatsapp: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Sink {
  id: string;
  slug: string;
  artist_id: string;
  name_he: string;
  description_he: string | null;
  shape: Shape;
  stone_type_he: string;
  stone_type_en: string | null;
  default_dimensions: string | null;
  weight_kg: number | null;
  price_band: PriceBand | null;
  source_type: SourceType;
  ai_prompt: string | null;
  ai_model: string | null;
  ai_seed: string | null;
  source_reference: string | null;
  approved_by_artist: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SinkImage {
  id: string;
  sink_id: string;
  cloudinary_url: string;
  cloudinary_public_id: string | null;
  alt_he: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

// Convenience type for "sink with primary image attached"
export interface SinkWithImage extends Sink {
  primary_image_url: string | null;
  artist_name_he: string;
}