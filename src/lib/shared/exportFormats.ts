/**
 * src/lib/shared/exportFormats.ts
 *
 * Generic Hebrew formatters for report exports.
 * Used by ExportFooter to produce text for: print, email (Outlook + Gmail), WhatsApp.
 *
 * Replaces src/lib/intake/exportFormats.ts (hardcoded to photo/sketch/MP4).
 * The new design takes a generic ReportSnapshot, so it works for:
 *   - /intake photo analysis
 *   - /intake sketch analysis
 *   - /intake MP4 analysis
 *   - /sinc call analysis (Phase D)
 *   - future: PDF, YouTube, library, etc.
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 *
 * Session 17 emoji fix (06/05/2026):
 *   buildWhatsAppUrl uses https://api.whatsapp.com/send instead of https://wa.me/.
 *   The wa.me redirect mishandles 4-byte UTF-8 percent-escapes (all emoji),
 *   stranding the leading byte and producing one U+FFFD per emoji on the
 *   receiving side. api.whatsapp.com/send is the older official Click-to-Chat
 *   endpoint and preserves emoji bytes correctly on both web and mobile.
 *   Hebrew (2-byte UTF-8) was unaffected by the wa.me bug.
 */

// ════════════════════════════════════════════════════════════════
// 1. THE GENERIC SNAPSHOT INTERFACE
// ════════════════════════════════════════════════════════════════

/**
 * Every consumer of ExportFooter builds one of these.
 * Keep it flat and stringly-typed — keeps formatters dumb and reliable.
 */
export interface ReportSnapshot {
  /** Hebrew label for the kind of report (e.g. "ניתוח תמונה", "שיחה עם לקוח"). */
  reportTypeHe:    string;
  /** A short subject suffix (filename, customer name, etc.). */
  subjectSuffix:   string;
  /** Optional customer for the To: + WhatsApp number + greeting. */
  customer?:       ReportCustomer;
  /** Optional active project context for the subject line. */
  projectContext?: string;
  /** Sections rendered in order — each is a heading + body. */
  sections:        ReportSection[];
  /** Optional URL appended at the bottom (Cloudinary asset, etc.). */
  primaryAssetUrl?: string;
  primaryAssetLabelHe?: string;
  /** API cost for the print-only footer (NOT included in email/WhatsApp bodies). */
  apiCostUsd?:     number;
}

export interface ReportCustomer {
  nameHe:   string;
  email?:   string | null;
  phone?:   string | null;
}

export interface ReportSection {
  /** Hebrew heading + emoji (e.g. "📐 מידות"). */
  headingHe: string;
  /** Body text. Empty/null sections are skipped. */
  bodyHe:    string | null | undefined;
}

// ── RTL marker for email clients ──────────────────────────────
const RTL_MARKER = '\u200F';

// ════════════════════════════════════════════════════════════════
// 2. SUBJECT + BODY (used by all electronic channels)
// ════════════════════════════════════════════════════════════════

export function buildSubject(snap: ReportSnapshot): string {
  const parts: string[] = [snap.reportTypeHe];
  if (snap.customer && snap.customer.nameHe) parts.push(snap.customer.nameHe);
  if (snap.subjectSuffix) parts.push(snap.subjectSuffix);
  return parts.join(' · ');
}

/**
 * Body for email (Outlook + Gmail) and WhatsApp.
 * NO footer (no internal cost, no branding) — protects customer-facing messages.
 * RTL marker prepended to nudge email clients toward right-to-left rendering.
 */
export function buildPlainTextBody(snap: ReportSnapshot): string {
  const lines: string[] = [];
  lines.push(`📋 ${snap.reportTypeHe}`);
  lines.push('');

  if (snap.customer) {
    lines.push('לקוח: ' + snap.customer.nameHe);
    if (snap.projectContext) {
      lines.push('פרויקט: ' + snap.projectContext);
    }
    lines.push('');
  }

  if (snap.subjectSuffix) {
    lines.push('פריט: ' + snap.subjectSuffix);
    lines.push('');
  }

  for (const section of snap.sections) {
    const body = (section.bodyHe || '').trim();
    if (!body) continue;
    lines.push(section.headingHe);
    lines.push(body);
    lines.push('');
  }

  if (snap.primaryAssetUrl) {
    const label = snap.primaryAssetLabelHe || 'קישור';
    lines.push(`🖼️ ${label}: ${snap.primaryAssetUrl}`);
  }

  return RTL_MARKER + lines.join('\n').trimEnd();
}

// ════════════════════════════════════════════════════════════════
// 3. PER-CHANNEL URL BUILDERS
// ════════════════════════════════════════════════════════════════

export function buildGmailUrl(snap: ReportSnapshot): string {
  const to      = snap.customer?.email || '';
  const subject = encodeURIComponent(buildSubject(snap));
  const body    = encodeURIComponent(buildPlainTextBody(snap));

  return 'https://mail.google.com/mail/?view=cm&fs=1' +
    (to ? '&to=' + encodeURIComponent(to) : '') +
    '&su=' + subject +
    '&body=' + body;
}

export function buildOutlookHandoffUrl(snap: ReportSnapshot): string {
  const to      = snap.customer?.email || '';
  const subject = encodeURIComponent(buildSubject(snap));
  return 'mailto:' + to + '?subject=' + subject;
}

export async function copyBodyForOutlook(snap: ReportSnapshot): Promise<boolean> {
  const body = buildPlainTextBody(snap);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(body);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = body;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    console.error('Clipboard write failed:', e);
    return false;
  }
}

/**
 * Build a Click-to-Chat URL that pre-fills a WhatsApp message.
 *
 * Uses https://api.whatsapp.com/send (the older official endpoint) instead of
 * https://wa.me/. The wa.me redirect mishandles 4-byte UTF-8 percent-escapes
 * (all emoji), turning them into U+FFFD ("�") on the receiving side. The
 * api.whatsapp.com endpoint preserves the bytes correctly on both web and mobile.
 *
 * Hebrew text (2-byte UTF-8) is unaffected by either path — the bug only shows
 * up for emoji-heavy bodies. We still went with api.whatsapp.com globally because
 * every export body opens with 📋 and ends with 🖼️, so wa.me always corrupted at
 * least two glyphs.
 */
export function buildWhatsAppUrl(snap: ReportSnapshot): string {
  const text  = encodeURIComponent(buildPlainTextBody(snap));
  const phone = normalizePhoneForWaMe(snap.customer?.phone || '');
  return phone
    ? 'https://api.whatsapp.com/send?phone=' + phone + '&text=' + text
    : 'https://api.whatsapp.com/send?text=' + text;
}

/**
 * Normalize a raw phone number to the digits-only E.164 form expected by
 * WhatsApp Click-to-Chat (no '+' sign, country code first).
 *
 * Name kept as `normalizePhoneForWaMe` for backwards-compatibility with any
 * existing imports — the OUTPUT format is identical to what wa.me accepted, so
 * the rename to api.whatsapp.com doesn't change this helper's behavior.
 */
export function normalizePhoneForWaMe(raw: string): string {
  const digits = (raw || '').replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0'))   return '972' + digits.substring(1);
  return digits;
}

// ════════════════════════════════════════════════════════════════
// 4. PRINT (HTML window with cost footer)
// ════════════════════════════════════════════════════════════════

export function openPrintWindow(snap: ReportSnapshot): void {
  const html = buildPrintHtml(snap);
  const win = window.open('', '_blank');
  if (!win) {
    alert('הדפסה חסומה - אפשר חלונות קופצים בדפדפן');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

function buildPrintHtml(snap: ReportSnapshot): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const customerLine = snap.customer
    ? '<p><strong>לקוח:</strong> ' + escape(snap.customer.nameHe) +
      (snap.projectContext
        ? ' &middot; <strong>פרויקט:</strong> ' + escape(snap.projectContext)
        : '') +
      '</p>'
    : '';

  const sectionBlock = (sec: ReportSection) => {
    const body = (sec.bodyHe || '').trim();
    if (!body) return '';
    return '<h3 style="margin:14px 0 4px;font-size:13px">' + escape(sec.headingHe) + '</h3>' +
           '<p style="margin:0 0 12px;line-height:1.5;white-space:pre-wrap">' + escape(body) + '</p>';
  };

  const assetBlock = snap.primaryAssetUrl
    ? '<p style="margin:14px 0;font-size:12px"><strong>' +
      escape(snap.primaryAssetLabelHe || 'קישור') +
      ':</strong> <a href="' + snap.primaryAssetUrl + '">' +
      escape(snap.primaryAssetUrl) + '</a></p>'
    : '';

  const footer = typeof snap.apiCostUsd === 'number'
    ? '<hr style="margin:24px 0;border:none;border-top:1px solid #ddd">' +
      '<p style="color:#888;font-size:11px;text-align:center">Marble Art Sinks &middot; ניתוח אוטומטי &middot; עלות API: $' +
      snap.apiCostUsd.toFixed(4) + '</p>'
    : '';

  return '<!doctype html>' +
    '<html lang="he" dir="rtl">' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<title>' + escape(buildSubject(snap)) + '</title>' +
      '<style>' +
        'body{font-family:system-ui,Arial,sans-serif;max-width:780px;margin:24px auto;padding:0 16px;color:#111}' +
        'h1{font-size:20px;margin:0 0 8px}' +
        'h2{font-size:14px;margin:18px 0 8px;color:#444}' +
        '@media print{body{margin:0}}' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<h1>📋 ' + escape(snap.reportTypeHe) + '</h1>' +
      customerLine +
      (snap.subjectSuffix ? '<p style="color:#666;font-size:12px">פריט: ' + escape(snap.subjectSuffix) + '</p>' : '') +
      snap.sections.map(sectionBlock).join('') +
      assetBlock +
      footer +
    '</body>' +
    '</html>';
}
