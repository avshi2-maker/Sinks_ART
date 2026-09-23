// src/lib/case/gates.ts · updated 23.09.2026 10:33 (Asia/Jerusalem)
// The 10 publish gates. Pure functions — run in the editor (live) and again on the server before publish.

import type { CaseStudy, CaseGen } from './caseTypes';
import { publishedImages, fieldStr } from './caseTypes';

export interface Gate { id: string; label: string; pass: boolean; hint: string }

const PRICE_RE = /₪|ש["״]ח|\bשקל|\bNIS\b|\d[\d,.]*\s?(?:ש"ח|שח|שקלים)/i;
const PHONE_RE = /(?:\+?972[-\s]?|0)(?:[23489]|5\d|7\d)[-\s]?\d{3}[-\s]?\d{4}/;

export function storyText(g: CaseGen): string {
  return [g.summary, g.challenge, g.process, g.result].filter(Boolean).join(' ');
}

export function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

export function allPublicText(g: CaseGen): string {
  const faq = (g.faq || []).map((f) => f.q + ' ' + f.a).join(' ');
  return [g.title, g.meta, storyText(g), faq, (g.alt || []).join(' ')].filter(Boolean).join(' ');
}

export function surname(c: CaseStudy): string {
  const parts = (c.customer_name || '').trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export function runGates(c: CaseStudy, g: CaseGen, slugTaken = false): Gate[] {
  const imgs = publishedImages(c);
  const text = allPublicText(g);
  const sn = surname(c);
  const alt = g.alt || [];
  const words = wordCount(storyText(g));
  const slugOk = !!g.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.slug) && g.slug.length <= 80 && !slugTaken;
  const titleLen = (g.title || '').length;
  const metaLen = (g.meta || '').length;
  const leaks: string[] = [];
  if (PRICE_RE.test(text)) leaks.push('מחיר');
  if (PHONE_RE.test(text)) leaks.push('טלפון');
  if (sn && sn.length > 1 && text.includes(sn)) leaks.push('שם משפחה');
  return [
    { id: 'consent', label: 'הסכמת פרסום תמונות', pass: !!c.consent?.photos, hint: 'הלקוח לא אישר פרסום תמונות — אי אפשר לפרסם' },
    { id: 'photos', label: '≥4 תמונות אמיתיות', pass: imgs.length >= 4, hint: 'יש ' + imgs.length + ' תמונות — צריך לפחות 4' },
    { id: 'words', label: '≥350 מילים בסיפור', pass: words >= 350, hint: words + ' מילים כרגע' },
    { id: 'leak', label: 'בלי מחיר / טלפון / שם משפחה', pass: leaks.length === 0, hint: leaks.length ? 'נמצא: ' + leaks.join(', ') : '' },
    { id: 'city', label: 'עיר מוגדרת', pass: !!(c.city || '').trim(), hint: 'חסרה עיר' },
    { id: 'stone', label: 'חומר / אבן מוגדר', pass: !!((g.material || '').trim() || fieldStr(c, 'stone')), hint: 'חסר חומר' },
    { id: 'alt', label: 'ALT לכל תמונה', pass: imgs.length > 0 && alt.length >= imgs.length && alt.slice(0, imgs.length).every((a) => (a || '').trim().length >= 8), hint: alt.length + '/' + imgs.length + ' תיאורים' },
    { id: 'faq', label: '≥3 שאלות נפוצות', pass: (g.faq || []).filter((f) => f.q && f.a).length >= 3, hint: (g.faq || []).length + ' שאלות' },
    { id: 'slug', label: 'כתובת (slug) תקינה וייחודית', pass: slugOk, hint: slugTaken ? 'הכתובת כבר בשימוש' : 'אותיות לטיניות קטנות, ספרות ומקפים' },
    { id: 'lens', label: 'כותרת ≤60 · מטא ≤155', pass: titleLen > 0 && titleLen <= 60 && metaLen >= 50 && metaLen <= 155, hint: 'כותרת ' + titleLen + ' · מטא ' + metaLen },
  ];
}

export function allPass(gates: Gate[]): boolean {
  return gates.every((g) => g.pass);
}
