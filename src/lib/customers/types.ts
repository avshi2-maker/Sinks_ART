// src/lib/customers/types.ts
// Phase 16 — Customer page data model.
// Mirrors verified Supabase schema (diagnostic 07/05/2026).

export interface CustomerRow {
  id: string;
  name_he: string;
  name_en: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  source: string | null;
  source_details: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  customer_id: string;
  artist_id: string | null;
  project_code: string | null;
  title_he: string;
  description_he: string | null;
  status: string; // 'ליד' | 'הצעה נשלחה' | 'מאושר' | 'בייצור' | 'נמסר' | 'הושלם' | 'בוטל' (semantic — text column, no DB enum)
  shape: string | null;
  stone_type_he: string | null;
  dimensions: string | null;
  estimated_weight_kg: number | null;
  quoted_price_ils: number | null;
  customer_paid_ils: number | null;
  inquiry_date: string | null;
  quote_sent_date: string | null;
  approved_date: string | null;
  production_start_date: string | null;
  delivery_date: string | null;
  done_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationRow {
  id: string;
  customer_id: string;
  project_id: string | null;
  comm_type: string; // 'call' | 'email' | 'whatsapp' | 'meeting' | 'sms' | 'other'
  audio_url: string | null;
  transcript: string | null;
  duration_seconds: number | null;
  ai_analysis: Record<string, unknown> | null;
  subject: string | null;
  body: string | null;
  api_cost_usd: number | null;
  occurred_at: string;
  created_at: string;
  // Phase 19 — optionally joined from media_analyses by fetchCustomerPage
  media_analysis?: MediaAnalysisRow | null;
}

export interface MediaAnalysisRow {
  id: string;
  comm_id: string;
  customer_id: string;
  project_id: string | null;
  media_type: string; // 'photo' | 'mp4' | 'sketch' | 'audio'
  source_url: string | null;
  cloudinary_url: string | null;
  thumbnail_url: string | null;
  source_filename: string | null;
  extracted_dimensions: string | null;
  extracted_stone_type: string | null;
  extracted_shape: string | null;
  design_intent_he: string | null;
  reference_summary_he: string | null;
  ai_full_report: Record<string, unknown> | null;
  status: string; // 'pending' | 'analyzed' | 'approved' | 'rejected'
  approved_by: string | null;
  used_for_quote: boolean;
  api_cost_usd: number | null;
  created_at: string;
  updated_at: string;
}
export interface CustomerPageData {
  customer: CustomerRow;
  projects: ProjectRow[];
  comms: CommunicationRow[];
}