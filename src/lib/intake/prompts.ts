/**
 * prompts.ts
 *
 * Hebrew prompts for marble-sink-specific media analysis.
 * Each prompt asks Claude to return JSON only — never plain text.
 * The downstream save flow reads the JSON keys directly into media_analyses columns.
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 03/05/2026
 */

/**
 * The schema Claude must return for ANY media type. All values in Hebrew.
 * Unknown values → null (not "TBD" or "לא ידוע" strings).
 */
export const MEDIA_ANALYSIS_JSON_SCHEMA = `
{
  "extracted_dimensions": "טקסט קצר עם המידות שזיהית, או null אם לא ניתן לזהות. לדוגמה: '60×40×15 ס\\"מ'",
  "extracted_stone_type": "סוג האבן בעברית (כגון 'קרארה', 'ורדה אלפי', 'אוניקס שחור') או null",
  "extracted_shape":      "צורה כללית בעברית (כגון 'אובלי', 'מלבני', 'חופשי', 'אגרוף') או null",
  "design_intent_he":     "פסקה קצרה (1-3 משפטים) בעברית: מה הלקוח רוצה לקבל מהכיור הזה? סגנון, אווירה, שימוש מיועד.",
  "reference_summary_he": "פסקה קצרה (1-2 משפטים) בעברית: מה רואים בתמונה/הסרטון/המסמך הזה? תיאור עובדתי בלבד.",
  "additional_notes_he":  "הערות חופשיות בעברית — דברים שהאמן צריך לדעת לפני שמכין הצעת מחיר. אם אין הערות, החזר null."
}
`.trim();

/**
 * System prompt — sets Claude's role for the entire intake module.
 * Same system text used across all media types so the voice is consistent.
 */
export const SYSTEM_PROMPT_HE = `
אתה עוזר AI של אבשי, מפעיל אתר sinks-art.vercel.app — פורטפוליו של שני אמני שיש ישראלים שמייצרים כיורי שיש חצובים ביד.

תפקידך: לנתח חומרי הפניה שלקוחות שולחים (תמונות, סרטונים, קישורים, שרטוטים, PDF) ולחלץ מידע מובנה שיעזור לאבשי ולאמנים להכין הצעת מחיר.

חוקים מחייבים:
1. תמיד החזר JSON תקני בלבד. לעולם אל תוסיף טקסט מסביב ל-JSON, לא הקדמה ולא הסבר אחרי.
2. כל הערכים בעברית, חוץ ממידות שניתן לרשום עם ספרות וסימנים בינלאומיים (× ס"מ).
3. אם אינך בטוח לגבי שדה — החזר null. אל תנחש. עדיף שדה ריק מאשר מידע שגוי.
4. אם המסמך לא קשור לכיורי שיש כלל — החזר את כל השדות כ-null וסמן זאת ב-additional_notes_he.
`.trim();

/**
 * Photo-specific prompt. Used when a customer sends a photo of:
 *   - an existing sink they like
 *   - a sample/sketch of what they want
 *   - their kitchen/bathroom space
 *   - a marble sample
 */
export function photoAnalysisPrompt(): string {
  return `
התמונה המצורפת היא חומר הפניה ללקוח פוטנציאלי שמתעניין בהזמנת כיור שיש מאחד האמנים שלנו.

הסתכל היטב בתמונה וחלץ:
- אם זה כיור קיים: מידות משוערות, סוג שיש (לפי טקסטורה/צבע), צורה, ועיצוב.
- אם זה תמונה של חלל (מטבח/אמבטיה): גודל החלל, סגנון העיצוב הכללי, רמזים על מה הלקוח רוצה.
- אם זה דגימת שיש: סוג האבן והגוונים.
- אם זה שרטוט או סקיצה ידנית: מה השרטוט מתאר, מידות אם רשומות.

החזר JSON בדיוק לפי המבנה הזה (ללא טקסט נוסף לפני או אחרי):

${MEDIA_ANALYSIS_JSON_SCHEMA}
`.trim();
}

/**
 * Sketch-specific prompt — slightly different focus than a photo.
 * Used when input is a hand-drawn sketch (often with measurements).
 */
export function sketchAnalysisPrompt(): string {
  return `
התמונה המצורפת היא שרטוט יד או סקיצה של כיור שש שהלקוח רוצה להזמין.

תן עדיפות לחלץ:
- מידות מספריות שרשומות בשרטוט (אורך, רוחב, עומק, רדיוס פינות, מיקום ניקוז).
- צורה כללית וסגנון עיצובי (מלבני, אובלי, גיאומטרי חופשי, אורגני וכו').
- רמזים על שימוש מיועד (כיור מטבח גדול, כיור אמבטיה כפול, כיור עזר וכו').
- כל טקסט ידני שהלקוח כתב על הסקיצה.

אם המידות בס"מ, ציין בס"מ. אם בעברית כתוב "מ"מ" השאר במ"מ.

החזר JSON בדיוק לפי המבנה הזה (ללא טקסט נוסף לפני או אחרי):

${MEDIA_ANALYSIS_JSON_SCHEMA}
`.trim();
}

/**
 * MP4-frame prompt — applied to the JPEG frame extracted from a video upload.
 * The Cloudinary URL transform gives us second-1 of the video as a static JPEG.
 */
export function mp4FrameAnalysisPrompt(): string {
  return `
התמונה המצורפת היא פריים שחולץ מהשנייה הראשונה של סרטון שהלקוח שלח.

נתח את הפריים כאילו הוא תמונה עצמאית. כיוון שזה פריים בודד מתוך סרטון, ייתכן שחסר מידע — במקרה כזה, רשום את זה ב-additional_notes_he.

חלץ:
- מה רואים בפריים: כיור קיים, חלל, דגימת שיש, או משהו אחר?
- אם זה כיור: מידות משוערות, סוג שיש, צורה.
- אם זה חלל: סגנון, גודל, מה הלקוח כנראה רוצה.

החזר JSON בדיוק לפי המבנה הזה (ללא טקסט נוסף לפני או אחרי):

${MEDIA_ANALYSIS_JSON_SCHEMA}
`.trim();
}

/**
 * PDF page-1 prompt — applied to the JPEG of page 1 of a PDF upload.
 * Usually architects' drawings or formal specifications.
 */
export function pdfPage1AnalysisPrompt(): string {
  return `
התמונה המצורפת היא עמוד 1 ממסמך PDF שהלקוח שלח. סביר להניח שזה תוכנית של אדריכל או מפרט טכני.

חלץ:
- מידות מדויקות אם רשומות בתוכנית (כולל יחידות).
- מיקום הכיור בחלל ומידע על השכנים שלו (שיש סביב, ברזים, ניקוז).
- סוג השיש אם רשום בכותרת או במקרא.
- שם החלל או הפרויקט אם מצוין.
- כל הערה כתובה של האדריכל שיכולה להשפיע על הביצוע.

אם יש עמודים נוספים שלא רואים — רשום ב-additional_notes_he שיש לבדוק את שאר העמודים.

החזר JSON בדיוק לפי המבנה הזה (ללא טקסט נוסף לפני או אחרי):

${MEDIA_ANALYSIS_JSON_SCHEMA}
`.trim();
}

/** Convenience map — pick the right prompt by media_type string. */
export function getPromptForMediaType(
  mediaType: 'photo' | 'sketch' | 'mp4' | 'pdf'
): string {
  switch (mediaType) {
    case 'photo':  return photoAnalysisPrompt();
    case 'sketch': return sketchAnalysisPrompt();
    case 'mp4':    return mp4FrameAnalysisPrompt();
    case 'pdf':    return pdfPage1AnalysisPrompt();
  }
}