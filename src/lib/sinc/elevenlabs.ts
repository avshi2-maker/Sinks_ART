/**
 * src/lib/sinc/elevenlabs.ts
 *
 * Server-side ElevenLabs Scribe v1 transcription.
 * Takes a Cloudinary audio URL, returns Hebrew transcript + speaker
 * diarization grouped into editable bubbles.
 *
 * SECURITY: Uses process.env.ELEVENLABS_API_KEY. Server-only.
 * Only the /api/sinc-transcribe route should import this.
 *
 * Phase B/C — Audio pipeline (Session 17, 06/05/2026)
 */

import type {
  TranscriptionResult,
  TranscriptWord,
  SpeakerBubble,
} from './types';

// ── Configuration ─────────────────────────────────────────────
const ELEVENLABS_ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text';
const DEFAULT_MODEL_ID    = 'scribe_v1';

// Hebrew language code per ElevenLabs docs
const LANGUAGE_HE = 'heb';

// Bubble grouping: if same speaker continues for under N seconds gap,
// keep their words in one bubble. Larger gap → new bubble.
const SAME_SPEAKER_GAP_SEC = 1.5;

// ── Public API ────────────────────────────────────────────────

export interface TranscribeAudioParams {
  audioUrl:    string;        // Cloudinary URL
  durationSec: number;        // for cost calculation
}

/**
 * Transcribe audio via ElevenLabs Scribe v1.
 * Returns raw transcript + structured speaker bubbles for the UI.
 */
export async function transcribeAudio(params: TranscribeAudioParams): Promise<TranscriptionResult> {
  const apiKey  = process.env.ELEVENLABS_API_KEY;
  const modelId = process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set in environment');
  }

  // Step 1: fetch the audio bytes from Cloudinary so we can stream them to ElevenLabs.
  // (ElevenLabs supports both URL fetch and multipart upload; multipart is more reliable.)
  const audioRes = await fetch(params.audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Failed to fetch audio from Cloudinary: ${audioRes.status}`);
  }
  const audioBlob = await audioRes.blob();

  // Step 2: build multipart request to ElevenLabs
  const form = new FormData();
  form.append('file',                    audioBlob, 'audio.bin');
  form.append('model_id',                modelId);
  form.append('language_code',           LANGUAGE_HE);
  form.append('diarize',                 'true');
  form.append('timestamps_granularity',  'word');
  form.append('tag_audio_events',        'false');

  const elRes = await fetch(ELEVENLABS_ENDPOINT, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: form,
  });

  if (!elRes.ok) {
    const errBody = await elRes.text().catch(() => '');
    throw new Error(`ElevenLabs API ${elRes.status}: ${errBody.substring(0, 300)}`);
  }

  const data = await elRes.json();

  // Step 3: extract words. ElevenLabs Scribe returns either `words` (array) at top level,
  // or nested under `transcripts[0].words`. Handle both shapes defensively.
  const rawWords = extractWords(data);

  // Step 4: clean Hebrew hallucinations that Scribe v1 sometimes inserts
  // (the speaker prefix bug from v7).
  const cleanedWords = stripHallucinatedSpeakerPrefixes(rawWords);

  // Step 5: build the full transcript text + speaker bubbles
  const rawText = cleanedWords.map((w) => w.word).join(' ').trim();
  const bubbles = groupWordsIntoBubbles(cleanedWords);

  return {
    rawText,
    bubbles,
    words:       cleanedWords,
    durationSec: params.durationSec,
  };
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * ElevenLabs response shapes vary slightly. Pull words from wherever they live.
 */
function extractWords(data: unknown): TranscriptWord[] {
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;

  // Top-level `words` array
  if (Array.isArray(obj.words)) {
    return obj.words.map(normalizeWord).filter(isValidWord);
  }

  // Nested `transcripts[0].words`
  if (Array.isArray(obj.transcripts)) {
    const first = (obj.transcripts as Array<Record<string, unknown>>)[0];
    if (first && Array.isArray(first.words)) {
      return first.words.map(normalizeWord).filter(isValidWord);
    }
  }

  return [];
}

function normalizeWord(raw: unknown): TranscriptWord {
  const r = (raw || {}) as Record<string, unknown>;
  return {
    word:       typeof r.text === 'string' ? r.text : (typeof r.word === 'string' ? r.word : ''),
    start:      typeof r.start === 'number' ? r.start : 0,
    end:        typeof r.end   === 'number' ? r.end   : 0,
    speaker_id: typeof r.speaker_id === 'string' ? r.speaker_id : 'speaker_0',
  };
}

function isValidWord(w: TranscriptWord): boolean {
  return Boolean(w.word && w.word.trim().length > 0);
}

/**
 * Scribe v1 sometimes outputs hallucinated prefixes like "דובר 1:" or "Speaker 1:"
 * at the start of speaker turns when transcribing Hebrew. Strip them out.
 * (Documented bug from v7 era.)
 */
function stripHallucinatedSpeakerPrefixes(words: TranscriptWord[]): TranscriptWord[] {
  const PREFIX_PATTERNS = [
    /^דובר\s*\d+:?$/,
    /^speaker\s*\d+:?$/i,
    /^דוברת\s*\d+:?$/,
    /^[סס]באקר\s*\d+:?$/,
  ];

  return words.filter((w) => {
    const text = w.word.trim();
    return !PREFIX_PATTERNS.some((p) => p.test(text));
  });
}

/**
 * Group consecutive words from the same speaker into a single bubble.
 * Start a new bubble when:
 *   1. Speaker changes
 *   2. Same speaker but gap > SAME_SPEAKER_GAP_SEC (likely interruption / pause)
 */
function groupWordsIntoBubbles(words: TranscriptWord[]): SpeakerBubble[] {
  if (words.length === 0) return [];

  const bubbles: SpeakerBubble[] = [];
  let currentWords: TranscriptWord[] = [words[0]];
  let currentSpeakerId = words[0].speaker_id;

  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    const prev = words[i - 1];

    const speakerChanged = w.speaker_id !== currentSpeakerId;
    const longGap = (w.start - prev.end) > SAME_SPEAKER_GAP_SEC;

    if (speakerChanged || longGap) {
      bubbles.push(buildBubble(currentSpeakerId, currentWords));
      currentWords = [w];
      currentSpeakerId = w.speaker_id;
    } else {
      currentWords.push(w);
    }
  }

  bubbles.push(buildBubble(currentSpeakerId, currentWords));
  return bubbles;
}

function buildBubble(speakerId: string, words: TranscriptWord[]): SpeakerBubble {
  return {
    speaker_id:    speakerId,
    speaker_label: defaultLabelForSpeaker(speakerId),
    text:          words.map((w) => w.word).join(' ').trim(),
    start:         words[0].start,
    end:           words[words.length - 1].end,
  };
}

function defaultLabelForSpeaker(speakerId: string): string {
  // speaker_0 → "דובר 1", speaker_1 → "דובר 2", etc.
  const match = speakerId.match(/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10) + 1;
    return `דובר ${num}`;
  }
  return speakerId;
}
