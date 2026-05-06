/**
 * src/lib/sinc/types.ts
 *
 * TypeScript types for SinC-ART (call intake system).
 * All data shapes used by the audio pipeline, claude analysis,
 * customer linking, and the React UI.
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 */

// ════════════════════════════════════════════════════════════════
// 1. AUDIO + TRANSCRIPTION (input side)
// ════════════════════════════════════════════════════════════════

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

/** A single word in ElevenLabs diarization output. */
export interface TranscriptWord {
  word:       string;
  start:      number;          // seconds
  end:        number;
  speaker_id: string;          // "speaker_0", "speaker_1", etc.
}

/** Whole call broken into editable bubbles per speaker turn. */
export interface SpeakerBubble {
  speaker_id:    string;       // raw id from ElevenLabs
  speaker_label: string;       // user-facing label (e.g. "אבשי", "סיגל")
  text:          string;       // concatenated text
  start:         number;       // first word start
  end:           number;        // last word end
}

export interface TranscriptionResult {
  rawText:    string;          // full transcript without speaker tags
  bubbles:    SpeakerBubble[];
  words:      TranscriptWord[];
  durationSec: number;
}

// ════════════════════════════════════════════════════════════════
// 2. CLAUDE ANALYSIS (output side)
// ════════════════════════════════════════════════════════════════

/** Hebrew analysis of a customer call. Each field may be empty. */
export interface CallAnalysis {
  // High-level summary
  summary_he:        string;     // 2-3 sentence Hebrew summary

  // Customer info extracted from the call
  customer_name_he:  string;     // "סיגל לוי"
  customer_phone:    string;     // E.164 if mentioned
  customer_location: string;     // city / neighborhood

  // Project intent
  project_type:      string;     // "מטבח", "חדר אמבטיה", "כניסה", etc.
  desired_style:     string;     // "מינימליסטי", "כפרי", "ארט-דקו"
  budget_signal:     string;     // anything indicating budget

  // Practical specifics
  dimensions:        string;     // free-form, "כיור 60 ס״מ עומק 12"
  stone_preference:  string;     // "שיש לבן", "אבן גירנית", "פתוח להצעות"
  faucet_setup:      string;     // "ברז קיר", "ברז משטח"
  delivery_timeline: string;     // "בעוד חודש", "אחרי החגים"

  // Action items + open questions
  action_items_he:   string[];   // things YOU need to do next
  open_questions_he: string[];   // things to ask the customer
  red_flags_he:      string[];   // budget mismatch, timeline conflict, etc.

  // Raw catch-all
  notes_he:          string;     // anything else worth capturing
}

// ════════════════════════════════════════════════════════════════
// 3. API ENDPOINT CONTRACTS (browser ↔ server)
// ════════════════════════════════════════════════════════════════

export interface SincAnalyzeRequest {
  transcriptText: string;        // full call transcript (Hebrew)
  durationSec:    number;        // for cost tracking
  filename:       string;        // for logging
}

export interface SincAnalyzeResponse {
  success:       boolean;
  analysis?:     CallAnalysis;
  rawJson?:      Record<string, unknown>;   // for debugging
  inputTokens?:  number;
  outputTokens?: number;
  apiCostUsd?:   number;
  error?:        string;
}

// ════════════════════════════════════════════════════════════════
// 4. CUSTOMER / PROJECT LINKING (Supabase shapes)
// ════════════════════════════════════════════════════════════════

export interface SincCustomerRow {
  id:         string;
  name_he:    string;
  phone:      string | null;
  email:      string | null;
  source:     string | null;
  notes:      string | null;
  created_at: string;
}

export interface SincProjectRow {
  id:          string;
  customer_id: string;
  title_he:    string;
  status:      string;          // one of 8 Hebrew status values
  notes_jsonb: Record<string, unknown> | null;
  created_at:  string;
}

export interface SincCustomerWithActiveProject {
  customer:       SincCustomerRow;
  activeProject:  SincProjectRow | null;
}

/** Payload written to customer_communications when a call is saved. */
export interface SincCallSavePayload {
  customer_id:  string;
  project_id:   string | null;
  comm_type:    'call';
  subject:      string;          // auto-generated from analysis
  body:         string;          // full transcript or summary
  ai_analysis:  CallAnalysis;
  audio_url:    string | null;
  api_cost_usd: number;
}

// ════════════════════════════════════════════════════════════════
// 5. API METER (cost tracking)
// ════════════════════════════════════════════════════════════════

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
