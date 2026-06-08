// src/lib/sorter/extractItems.ts
// Phase 30 — extract {item, price, remark} rows from price-related text.
// SERVER ONLY — imports ANTHROPIC_API_KEY. Mirrors sortCorrespondence.ts.

const MODEL              = 'claude-sonnet-4-6';
const MAX_OUTPUT_TOKENS  = 3000;
const ANTHROPIC_VERSION  = '2023-06-01';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const INPUT_COST_PER_M   = 3.00;
const OUTPUT_COST_PER_M  = 15.00;

export interface ExtractedItem {
  item: string;
  price: number;
  remark: string;
}

export interface ExtractResult {
  items: ExtractedItem[];
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
    'אתה עוזר שבונה טיוטת הצעת מחיר לעסק כיורי שיש, מתוך תכתובת וואטסאפ.',
    'קבל טקסט (עברית, מעורבב) וחלץ ממנו פריטים לתמחור.',
    'לכל פריט החזר:',
    '- item: שם הפריט בעברית (לדוגמה: כיור שיש, התקנה, הובלה, ברז, סיפון).',
    '- price: המחיר במספר בלבד (אם לא ברור — 0).',
    '- remark: הערה קצרה אם יש (לדוגמה: "לברר אם כולל מע\u05f4מ", "תלוי אזור"). אם אין — מחרוזת ריקה.',
    'אל תמציא מחירים. אם מוזכר סכום בלי הקשר ברור, שים אותו עם remark שמסביר.',
    'אחד פריטים כפולים. החזר JSON בלבד, ללא markdown. מבנה:',
    '{"items":[{"item":"התקנה","price":700,"remark":"תלוי אזור"}]}',
  ].join('\n');
}

export async function extractItems(text: string): Promise<ExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in environment');

  const requestBody = {
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: systemPrompt(),
    messages: [{ role: 'user', content: 'חלץ פריטים לתמחור מהטקסט הבא:\n\n' + text }],
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

  let parsed: { items?: unknown };
  try {
    parsed = JSON.parse(cleanText);
  } catch (e) {
    throw new Error('Claude response was not valid JSON: ' + (e instanceof Error ? e.message : String(e)) + ' | ' + cleanText.substring(0, 200));
  }

  const rawArr = Array.isArray(parsed.items) ? parsed.items : [];
  const items: ExtractedItem[] = rawArr.map((m) => {
    const obj = (m && typeof m === 'object') ? m as Record<string, unknown> : {};
    const item = typeof obj.item === 'string' ? obj.item : '';
    const price = typeof obj.price === 'number' ? obj.price : (parseFloat(String(obj.price)) || 0);
    const remark = typeof obj.remark === 'string' ? obj.remark : '';
    return { item, price, remark };
  }).filter((m) => m.item.trim().length > 0);

  const inputTokens = data.usage.input_tokens || 0;
  const outputTokens = data.usage.output_tokens || 0;
  const costUsd = (inputTokens / 1_000_000) * INPUT_COST_PER_M + (outputTokens / 1_000_000) * OUTPUT_COST_PER_M;

  return { items, inputTokens, outputTokens, costUsd };
}
