/**
 * src/lib/sinc/types.ts
 *
 * TypeScript types for SinC-ART (call intake system).
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 * Phase D — Save flow extensions (Session 18, 06/05/2026)
 * Phase D fix — schema reality: projects has description_he + notes (text), NOT notes_jsonb (06/05/2026)
 */

// ════════════════════════════════════════════════
// 1. AUDIO + TRANSCRIPTION (input side)
// ════════════════════════════════════════════════

export interface AudioMetadata {
  filename:    string;
  bytes:       number;
  durationSec: number;
  mimeType:    string;
}

export interface CloudinaryAudioUploadResult {
  url:          string;
  publicId:     string;
  durationSec:  number;
  bytes:        number;
}

export interface TranscriptWord {
  word:       string;
  start:      number;
  end:        number;
  speaker_id: string;
}

export interface SpeakerBubble {
  speaker_id:    string;
  speaker_label: string;
  text:          string;
  start:         number;
  end:           number;
}

export interface TranscriptionResult {
  rawText:    string;
  bubbles:    SpeakerBubble[];
  words:      TranscriptWord[];
  durationSec: number;
}

// ════════════════════════════════════════════════
// 2. CLAUDE ANALYSIS (output side)
// ════════════════════════════════════════════════

export interface CallAnalysis {
  summary_he:        string;
  customer_name_he:  string;
  customer_phone:    string;
  customer_location: string;
  project_type:      string;
  desired_style:     string;
  budget_signal:     string;
  dimensions:        string;
  stone_preference:  string;
  faucet_setup:      string;
  delivery_timeline: string;
  action_items_he:   string[];
  open_questions_he: string[];
  red_flags_he:      string[];
  notes_he:          string;
}

// ════════════════════════════════════════════════
// 3. API ENDPOINT CONTRACTS (browser ↔ server)
// ════════════════════════════════════════════════

export interface SincAnalyzeRequest {
  transcriptText: string;
  durationSec:    number;
  filename:       string;
}

export interface SincAnalyzeResponse {
  success:       boolean;
  analysis?:     CallAnalysis;
  rawJson?:      Record<string, unknown>;
  inputTokens?:  number;
  outputTokens?: number;
  apiCostUsd?:   number;
  error?:        string;
}

// ════════════════════════════════════════════════
// 4. CUSTOMER / PROJECT LINKING (Supabase shapes)
// ════════════════════════════════════════════════

export interface SincCustomerRow {
  id:         string;
  name_he:    string;
  phone:      string | null;
  email:      string | null;
  source:     string | null;
  notes:      string | null;
  created_at: string;
}

/**
 * Matches the actual `projects` table schema.
 * Note: there is NO notes_jsonb column. Description goes in description_he,
 * any structured metadata goes in notes (plain text).
 */
export interface SincProjectRow {
  id:             string;
  customer_id:    string;
  title_he:       string;
  status:         string;
  description_he: string | null;
  notes:          string | null;
  inquiry_date:   string | null;
  created_at:     string;
}

export interface SincCustomerWithActiveProject {
  customer:       SincCustomerRow;
  activeProject:  SincProjectRow | null;
}

/**
 * @deprecated Use SincCallFullSavePayload (Phase D) instead.
 */
export interface SincCallSavePayload {
  customer_id:  string;
  project_id:   string | null;
  comm_type:    'call';
  subject:      string;
  body:         string;
  ai_analysis:  CallAnalysis;
  audio_url:    string | null;
  api_cost_usd: number;
}

// ════════════════════════════════════════════════
// 5. PHASE D — FULL SAVE PAYLOAD
// ════════════════════════════════════════════════

export interface SincCallFullSavePayload {
  customer_id:  string;
  project_id:   string | null;
  subject:      string;
  body:         string;
  ai_analysis:  CallAnalysis;
  audio_url:    string;
  api_cost_usd: number;

  source_filename:     string;
  speaker_map:         Record<string, string>;
  bubbles:             SpeakerBubble[];
  raw_transcript_text: string;
  duration_sec:        number;
}

export interface SincCallSaveResult {
  comm_id:           string;
  media_analysis_id: string;
  project_id:        string;
  project_was_new:   boolean;
}

// ════════════════════════════════════════════════
// 6. API METER (cost tracking)
// ════════════════════════════════════════════════

export type ApiMeterStage = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'done' | 'error';

export interface ApiMeterReading {
  stage:         ApiMeterStage;
  moduleLabel:   string;
  startedAt:     number;
  finishedAt?:   number;
  inputTokens?:  number;
  outputTokens?: number;
  costUsd?:      number;
  errorMsg?:     string;
}
