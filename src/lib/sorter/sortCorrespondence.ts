// src/lib/sorter/sortCorrespondence.ts
// Phase 29 — correspondence sorter: split a WhatsApp blob into messages,
// each tagged bucket + party. Mirrors src/lib/sinc/claudeAnalysis.ts.
// SERVER ONLY — imports ANTHROPIC_API_KEY. Never import from a client component.

const MODEL              = 'claude-sonnet-4-6';
const MAX_OUTPUT_TOKENS  = 4000;
const ANTHROPIC_VERSION  = '2023-06-01';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const INPUT_COST_PER_M   = 3.00;
const OUTPUT_COST_PER_M  = 15.00;

export const SORTER_BUCKETS = ['price', 'spec', 'options', 'logistics', 'general'] as const;
export type SorterBucket = typeof SORTER_BUCKETS[number];
export type SorterParty = 'customer' | 'ales' | 'unknown';

export interface SortedMessage {
  text: string;
  bucket: SorterBucket;
  party: SorterParty;
}

export interface SortResult {
  messages: SortedMessage[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

interface AnthropicMessageResponse {
  content: Array<{ type: string; text?: string }>;
  usage: { input_tokens: number; output_tokens: number };
}

function systemPrompt(): string {
  return [
    'אתה עוזר שממיין תכתובות וואטסאפ של עסק כיורי שיש.',
    'קבל בלוק טקסט של הודעות (מעורבב, עברית) ופצל אותו להודעות בודדות.',
    'לכל הודעה קבע:',
    '- bucket: אחד מ price (מחירים/עלויות/סכומים), spec (מידות/סוג אבן/צורה/ניקוז), options (תוספות/צבעים/ברזים/גימור/בחירות), logistics (אספקה/הובלה/תאריכים/ביקור באתר/מיקום), general (ברכות/תיאום/כללי).',
    '- party: customer (הלקוח), ales (הספק אלס/בעל המלאכה), או unknown אם לא ברור.',
    'החזר JSON בלבד, ללא טקסט נוסף, ללא markdown. מבנה:',
    '{"messages":[{"text":"...","bucket":"price","party":"customer"}]}',
  ].join('\n');
}

export async function sortCorrespondence(blob: string): Promise<SortResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in environment');

  const requestBody = {
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: systemPrompt(),
    messages: [{ role: 'user', content: 'מיין את התכתובת הבאה:\n\n' + blob }],
  };

  const response = await fetch(ANTHROPIC_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error('Anthropic API returned ' + response.status + ': ' + errBody.substring(0, 300));
  }

  const data = (await response.json()) as AnthropicMessageResponse;
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock || !textBlock.text) throw new Error('Claude response contained no text block');

  const cleanText = textBlock.text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsed: { messages?: unknown };
  try {
    parsed = JSON.parse(cleanText);
  } catch (e) {
    throw new Error('Claude response was not valid JSON: ' + (e instanceof Error ? e.message : String(e)) + ' | ' + cleanText.substring(0, 200));
  }

  const rawArr = Array.isArray(parsed.messages) ? parsed.messages : [];
  const messages: SortedMessage[] = rawArr.map((m) => {
    const obj = (m && typeof m === 'object') ? m as Record<string, unknown> : {};
    const text = typeof obj.text === 'string' ? obj.text : '';
    const bucket = (SORTER_BUCKETS as readonly string[]).includes(obj.bucket as string) ? obj.bucket as SorterBucket : 'general';
    const party: SorterParty = (obj.party === 'customer' || obj.party === 'ales') ? obj.party : 'unknown';
    return { text, bucket, party };
  }).filter((m) => m.text.trim().length > 0);

  const inputTokens = data.usage.input_tokens || 0;
  const outputTokens = data.usage.output_tokens || 0;
  const costUsd = (inputTokens / 1_000_000) * INPUT_COST_PER_M + (outputTokens / 1_000_000) * OUTPUT_COST_PER_M;

  return { messages, inputTokens, outputTokens, costUsd };
}
