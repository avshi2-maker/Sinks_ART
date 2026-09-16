// src/app/api/draft-reply/route.ts
// Draft a personalized FIRST WhatsApp reply to a new lead, from the extracted lead fields.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const FORM_URL = 'https://marble-art.co.il/#lead-form';

const SYSTEM = `אתה כותב הודעת וואטסאפ ראשונה, אישית וחמה, מטעם "Marble Art / מרבל ארט" — עסק ישראלי יוקרתי לכיורי שיש וגרניט פורצלן בעבודת יד בהזמנה אישית. מקבל פרטי ליד שחולצו מפנייה. כתוב הודעה קצרה (2-4 שורות), בעברית, בגוף פונה אישית ללקוח לפי שמו אם קיים, שמאזכרת בקצרה את מה שהלקוח ביקש (סוג הכיור/הפרויקט/העיר אם רלוונטי), מודה על הפנייה, ומפנה אותו למלא את הטופס הקצר כדי לקבל הצעת מחיר והדמיה מותאמת. שלב את הקישור לטופס בדיוק כפי שיינתן לך. אימוג'ים מדודים (לכל היותר 1-2, שחור/יוקרתי כמו 🖤). אל תמציא פרטים שלא נמסרו. החזר אך ורק JSON תקין ללא markdown: {"reply_he":"..."}`;

export async function POST(req: Request) {
  try {
    const { full_name, city_he, sinks_he, notes_he, style_he } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });

    const details = [
      full_name ? 'שם: ' + full_name : '',
      city_he ? 'עיר: ' + city_he : '',
      style_he ? 'סגנון: ' + style_he : '',
      sinks_he ? 'כיורים/מידות: ' + sinks_he : '',
      notes_he ? 'הערות: ' + notes_he : '',
    ].filter(Boolean).join('\n');

    const userMsg = 'פרטי הליד:\n' + (details || '(מעט פרטים — כתוב הודעה כללית וחמה)') + '\n\nקישור לטופס לשילוב בהודעה: ' + FORM_URL;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ success: false, error: data?.error?.message || 'Claude error' }, { status: 500 });

    const text = (data.content || []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('').trim();
    const clean = text.replace(/```json|```/g, '').trim();
    let parsed: { reply_he?: string } = {};
    try { parsed = JSON.parse(clean); } catch { parsed = { reply_he: clean }; }

    const inTok = Number(data.usage?.input_tokens || 0);
    const outTok = Number(data.usage?.output_tokens || 0);
    const cost = (inTok / 1e6) * 3 + (outTok / 1e6) * 15;

    return NextResponse.json({ success: true, reply_he: parsed.reply_he || '', apiCostUsd: cost });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
