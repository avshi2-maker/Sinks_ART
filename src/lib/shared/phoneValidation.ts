// src/lib/shared/phoneValidation.ts
// Phase 35 — Israeli phone validation for intake forms (mobile + landline).

// Strips spaces, dashes, parentheses, leading +972 -> 0.
export function normalizeIlPhone(raw: string): string {
  let s = (raw || '').trim().replace(/[\s\-()]/g, '');
  if (s.startsWith('+972')) s = '0' + s.slice(4);
  else if (s.startsWith('972')) s = '0' + s.slice(3);
  return s;
}

// Valid Israeli mobile: 05X + 7 digits = 10 digits total (05 0/2/3/4/5/8/9...).
// Valid Israeli landline: 0X + 7 digits = 9 digits (area codes 02/03/04/08/09 + others).
export function isValidIlPhone(raw: string): boolean {
  const s = normalizeIlPhone(raw);
  if (!/^0\d+$/.test(s)) return false;
  // mobile: 10 digits, starts 05
  if (/^05\d{8}$/.test(s)) return true;
  // landline: 9 digits, starts 0 + area code digit (not 5)
  if (/^0[2-46-9]\d{7}$/.test(s)) return true;
  return false;
}

// Pretty display: 05X-XXXXXXX or 0X-XXXXXXX.
export function formatIlPhone(raw: string): string {
  const s = normalizeIlPhone(raw);
  if (/^05\d{8}$/.test(s)) return s.slice(0, 3) + '-' + s.slice(3);
  if (/^0[2-46-9]\d{7}$/.test(s)) return s.slice(0, 2) + '-' + s.slice(2);
  return raw;
}
