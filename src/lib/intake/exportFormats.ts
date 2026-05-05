/**
 * exportFormats.ts — v3 (Phase 15.5 fixes round 2)
 *
 * v3 changes:
 *   - REMOVED footer from email/Gmail/WhatsApp bodies (was leaking internal data)
 *   - Footer now ONLY in print HTML (your records)
 *   - RTL marker (U+200F) prepended to body for Outlook/Gmail RTL hint
 */

import type { AnalysisResult } from '@/components/intake/analyzers/PhotoAnalyzer';
import type { CustomerWithProject } from '@/lib/supabase';

const MEDIA_TYPE_LABEL_HE: Record<'photo' | 'sketch', string> = {
  photo:  'תמונה',
  sketch: 'שרטוט',
};

const RTL_MARKER = '\u200F';

export function buildSubject(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): string {
  const parts: string[] = ['ניתוח ' + MEDIA_TYPE_LABEL_HE[result.mediaType]];
  if (customer) parts.push(customer.customer.name_he);
  parts.push(result.sourceFilename);
  return parts.join(' · ');
}

export function buildPlainTextBody(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): string {
  return RTL_MARKER + buildBodyCore(result, customer);
}

export function buildPlainTextBodyForCustomer(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): string {
  return RTL_MARKER + buildBodyCore(result, customer);
}

export function buildGmailUrl(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): string {
  const to      = customer?.customer.email || '';
  const subject = encodeURIComponent(buildSubject(result, customer));
  const body    = encodeURIComponent(buildPlainTextBody(result, customer));

  return 'https://mail.google.com/mail/?view=cm&fs=1' +
         (to ? '&to=' + encodeURIComponent(to) : '') +
         '&su=' + subject +
         '&body=' + body;
}

export function buildOutlookHandoffUrl(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): string {
  const to      = customer?.customer.email || '';
  const subject = encodeURIComponent(buildSubject(result, customer));
  return 'mailto:' + to + '?subject=' + subject;
}

export async function copyAnalysisForOutlook(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): Promise<boolean> {
  const body = buildPlainTextBody(result, customer);

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

export function buildWhatsAppUrl(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): string {
  const text  = encodeURIComponent(buildPlainTextBodyForCustomer(result, customer));
  const phone = normalizePhoneForWaMe(customer?.customer.phone || '');

  return phone
    ? 'https://wa.me/' + phone + '?text=' + text
    : 'https://wa.me/?text=' + text;
}

export function normalizePhoneForWaMe(raw: string): string {
  const digits = (raw || '').replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0'))   return '972' + digits.substring(1);
  return digits;
}

export function openPrintWindow(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): void {
  const html = buildPrintHtml(result, customer);
  const win  = window.open('', '_blank');
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

function buildBodyCore(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): string {
  const lines: string[] = [];

  lines.push('📋 ניתוח ' + MEDIA_TYPE_LABEL_HE[result.mediaType]);
  lines.push('');

  if (customer) {
    lines.push('לקוח: ' + customer.customer.name_he);
    if (customer.activeProject) {
      lines.push('פרויקט: ' + customer.activeProject.title_he + ' [' + customer.activeProject.status + ']');
    }
    lines.push('');
  }

  lines.push('קובץ: ' + result.sourceFilename);
  lines.push('');

  if (result.extractedDimensions)  lines.push('📐 מידות: '   + result.extractedDimensions);
  if (result.extractedStoneType)   lines.push('🪨 סוג אבן: ' + result.extractedStoneType);
  if (result.extractedShape)       lines.push('🔹 צורה: '    + result.extractedShape);

  if (result.designIntentHe) {
    lines.push('');
    lines.push('🎨 כוונת העיצוב:');
    lines.push(result.designIntentHe);
  }

  if (result.referenceSummaryHe) {
    lines.push('');
    lines.push('📝 תיאור החומר:');
    lines.push(result.referenceSummaryHe);
  }

  if (result.additionalNotesHe) {
    lines.push('');
    lines.push('💡 הערות נוספות:');
    lines.push(result.additionalNotesHe);
  }

  if (result.cloudinaryUrl) {
    lines.push('');
    lines.push('🖼️ צפייה בתמונה: ' + result.cloudinaryUrl);
  }

  return lines.join('\n');
}

function buildPrintHtml(
  result: AnalysisResult,
  customer: CustomerWithProject | null
): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const customerLine = customer
    ? '<p><strong>לקוח:</strong> ' + escape(customer.customer.name_he) +
      (customer.activeProject
        ? ' &middot; <strong>פרויקט:</strong> ' + escape(customer.activeProject.title_he) +
          ' [' + escape(customer.activeProject.status) + ']'
        : '') +
      '</p>'
    : '';

  const fieldRow = (label: string, value: string | null | undefined) =>
    value ? '<tr><th style="text-align:right;padding:6px;background:#f5f5f5;width:30%">' + label +
            '</th><td style="padding:6px">' + escape(value) + '</td></tr>'
          : '';

  const longField = (label: string, value: string | null | undefined) =>
    value ? '<h3 style="margin:14px 0 4px;font-size:13px">' + label + '</h3>' +
            '<p style="margin:0 0 12px;line-height:1.5">' + escape(value) + '</p>'
          : '';

  const imageBlock = result.cloudinaryUrl
    ? '<div style="margin:16px 0;text-align:center"><img src="' + result.cloudinaryUrl +
      '" style="max-width:100%;max-height:400px;border:1px solid #ddd" alt="" /></div>'
    : '';

  return '<!doctype html>' +
    '<html lang="he" dir="rtl">' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<title>' + escape(buildSubject(result, customer)) + '</title>' +
      '<style>' +
        'body{font-family:system-ui,Arial,sans-serif;max-width:780px;margin:24px auto;padding:0 16px;color:#111}' +
        'h1{font-size:20px;margin:0 0 8px}' +
        'h2{font-size:14px;margin:18px 0 8px;color:#444}' +
        'table{width:100%;border-collapse:collapse;margin:8px 0}' +
        'tr{border-bottom:1px solid #eee}' +
        '@media print{body{margin:0}}' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<h1>📋 ניתוח ' + MEDIA_TYPE_LABEL_HE[result.mediaType] + '</h1>' +
      customerLine +
      '<p style="color:#666;font-size:12px">קובץ: ' + escape(result.sourceFilename) + '</p>' +
      imageBlock +
      '<h2>פרטים שחולצו</h2>' +
      '<table>' +
        fieldRow('מידות',   result.extractedDimensions) +
        fieldRow('סוג אבן', result.extractedStoneType) +
        fieldRow('צורה',    result.extractedShape) +
      '</table>' +
      longField('כוונת העיצוב',   result.designIntentHe) +
      longField('תיאור החומר',    result.referenceSummaryHe) +
      longField('הערות נוספות',   result.additionalNotesHe) +
      '<hr style="margin:24px 0;border:none;border-top:1px solid #ddd">' +
      '<p style="color:#888;font-size:11px;text-align:center">Marble Art Sinks &middot; ניתוח אוטומטי &middot; עלות API: $' +
        result.apiCostUsd.toFixed(4) + '</p>' +
    '</body>' +
    '</html>';
}
