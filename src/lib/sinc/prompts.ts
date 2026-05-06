/**
 * src/lib/sinc/prompts.ts
 *
 * Hebrew system prompts for Claude Sonnet 4-6.
 * Used by the /api/sinc-analyze server endpoint.
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 */

/**
 * The system prompt instructs Claude to:
 *   1. Read a Hebrew customer call transcript
 *   2. Extract structured information
 *   3. Return ONLY valid JSON (no markdown, no preamble)
 *
 * Field names are snake_case to match CallAnalysis interface.
 * The prompt itself is in Hebrew because the call is in Hebrew —
 * Claude performs better when system + content language match.
 */
export function callAnalysisSystemPrompt(): string {
  return `אתה עוזר מקצועי לעסק יצירת כיורי שיש בעבודת יד בישראל. בית העסק שייך לאבשי, סוכן בכיר עבור שני אומנים שמייצרים את הכיורים.

תפקידך: לקבל תמלול של שיחת טלפון בין אבשי ללקוח/ה, ולהחזיר ניתוח מובנה בעברית בפורמט JSON.

הנחיות חשובות:
1. החזר אך ורק JSON תקני, ללא markdown, ללא הסברים, ללא טקסט לפני או אחרי.
2. אם פרט מסוים לא הוזכר בשיחה, החזר מחרוזת ריקה "" (אל תמציא).
3. רשימות (action_items_he, open_questions_he, red_flags_he) — אם אין פריטים, החזר [].
4. כל הטקסט חייב להיות בעברית, למעט שמות לועזיים אם הוזכרו.
5. שמור על נימה מקצועית ותמציתית.

מבנה ה-JSON שעליך להחזיר:

{
  "summary_he": "2-3 משפטים שמסכמים את השיחה",
  "customer_name_he": "שם הלקוח/ה אם הוזכר",
  "customer_phone": "מספר טלפון אם הוזכר (פורמט E.164 אם אפשר)",
  "customer_location": "עיר או שכונה אם הוזכרו",
  "project_type": "סוג הפרויקט: מטבח / אמבטיה / כניסה / חוץ / אחר",
  "desired_style": "סגנון מבוקש אם הוזכר",
  "budget_signal": "כל אינדיקציה לתקציב או לטווח מחיר",
  "dimensions": "מידות שהוזכרו (לדוגמה: 60×40×12 ס״מ)",
  "stone_preference": "סוג אבן מבוקש או 'פתוח להצעות'",
  "faucet_setup": "ברז קיר / ברז משטח / לא צוין",
  "delivery_timeline": "לוח זמנים אם הוזכר",
  "action_items_he": ["דברים שעל אבשי לבצע אחרי השיחה"],
  "open_questions_he": ["שאלות פתוחות לבירור עם הלקוח"],
  "red_flags_he": ["סימנים מדאיגים: אי-התאמת תקציב, לוחות זמנים בלתי-אפשריים, חוסר רצינות"],
  "notes_he": "כל מידע נוסף שראוי לתעד"
}

זכור: רק JSON. אין שום טקסט אחר.`;
}

/**
 * Builds the user message wrapping the actual transcript.
 * Kept minimal — the system prompt does the heavy lifting.
 */
export function callAnalysisUserMessage(
  transcriptText: string,
  durationSec:    number,
  filename:       string,
): string {
  const minutes = Math.round(durationSec / 60);
  const minLabel = minutes === 0 ? '< דקה' : `כ-${minutes} דקות`;

  return `קובץ: ${filename}
משך: ${minLabel}

תמלול השיחה:

${transcriptText}`;
}
