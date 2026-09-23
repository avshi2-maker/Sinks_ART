// src/lib/case/prompt.ts · updated 23.09.2026 10:34 (Asia/Jerusalem)
// Claude prompt for turning Ales's field facts into a publishable, search-ready Hebrew case file.
// Hard rule: ONLY the facts supplied. No invented numbers, names, durations or claims.

import type { CaseStudy } from './caseTypes';
import { publishedImages, TYPE_HE } from './caseTypes';

export function caseSystemPrompt(): string {
  return [
    'You write case-study pages for Marble Art (מרבל ארט), an Israeli brand of hand-made custom marble and porcelain-granite sinks, marble doors and stone renovation. Nationwide service; free AI visualization before cutting stone.',
    'Output: ONE JSON object, no markdown fences, no commentary. All text values in natural, professional Hebrew (except slug).',
    'ABSOLUTE RULES:',
    '1. Use ONLY facts present in the input. Never invent sizes, durations, prices, stone types, names, quotes or problems. If a fact is missing, write around it generally — do not guess.',
    '2. NEVER include: any price or money amount, phone numbers, street addresses, or the customer\'s surname. Customer may be referred to only by the provided public first name (if given) or as "הלקוחות".',
    '3. The customer quote may be used ONLY if quote_allowed is true, and then word-for-word.',
    '4. Concrete > generic: prefer the real material, size, city, finish, challenge. AI answer engines cite concrete facts.',
    'JSON shape:',
    '{"title": "<=58 chars, includes material/product + city", "slug": "latin lowercase kebab, <=60 chars, e.g. calacatta-floating-sink-herzliya", "meta": "120-150 chars", "summary": "2-3 sentences", "challenge": "110-170 words", "process": "130-190 words", "result": "110-170 words", "material": "short", "size": "short or empty", "faq": [{"q":"","a":""} x4, questions real buyers ask about THIS kind of job, answers 30-70 words, only facts or general stone knowledge], "alt": ["one Hebrew alt text per image, in the given order, 8-16 words, mention material + city"], "tags": ["4-6 short Hebrew tags"], "social": {"ig":"Instagram caption 60-110 words + 5 hashtags, end with {URL}","fb":"Facebook post 50-90 words, end with {URL}","pin":"Pinterest description 30-50 words, end with {URL}"}}',
    'summary + challenge + process + result together MUST be at least 380 Hebrew words.',
  ].join('\n');
}

export function caseUserMessage(c: CaseStudy): string {
  const imgs = publishedImages(c);
  const facts = {
    job_type: TYPE_HE[c.job_type || ''] || c.job_type,
    ales_title: c.title_raw,
    city: c.city,
    public_first_name: c.consent?.name_city ? c.first_name : null,
    fields_from_ales: c.fields,
    ales_notes: c.notes,
    finish_date: c.finish_date,
    rating: c.rating,
    quote_allowed: !!c.consent?.quote,
    customer_quote: c.consent?.quote ? c.quote : null,
    conversation_transcript: c.consent?.quote ? c.transcript : null,
    image_count: imgs.length,
    image_order: imgs.map((m, i) => (i < (c.after_media || []).length ? 'after-install photo ' : 'before/in-progress photo ') + (i + 1)),
  };
  return 'Facts from the installer (the only source you may use):\n' + JSON.stringify(facts, null, 2) + '\n\nReturn the JSON object now.';
}
