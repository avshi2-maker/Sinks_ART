// src/lib/case/caseAlert.ts · updated 23.09.2026 14:22 (Asia/Jerusalem)
// Email alerts for Ales case files (Resend, same key as lead + RFQ alerts).
//  • new finished job → immediate email with a big "open in CRM" button
//  • not opened after 24h → daily reminder until the case is opened in the CRM

import { Resend } from 'resend';
import { crmDb, syncFromAles } from './caseData';
import { TYPE_HE, publishedImages } from './caseTypes';
import type { CaseStudy } from './caseTypes';

const CRM = 'https://crm.marble-art.co.il';
const DAY = 24 * 60 * 60 * 1000;

function card(c: CaseStudy): string {
  const img = publishedImages(c)[0];
  const url = CRM + '/case-studies/' + c.id;
  const pic = img ? '<img src="' + img.url + '" width="120" height="120" style="object-fit:cover;border-radius:8px;display:block" alt="">' : '';
  return '<table style="width:100%;border:1px solid #E6DCC8;border-radius:10px;margin:10px 0;border-collapse:separate"><tr>'
    + '<td style="padding:10px;width:130px;vertical-align:top">' + pic + '</td>'
    + '<td style="padding:10px;vertical-align:top;font-size:15px">'
    + '<b>' + (c.title_raw || 'ללא כותרת') + '</b><br>'
    + '<span style="color:#6b6155">' + [TYPE_HE[c.job_type || ''] || c.job_type, c.city, c.finish_date].filter(Boolean).join(' · ') + '</span><br>'
    + '<span style="color:#6b6155">📸 ' + (c.after_media || []).length + ' אחרי · ' + (c.before_media || []).length + ' לפני' + (c.voice?.url ? ' · 🎙️ הקלטה' : '') + (c.rating ? ' · ' + '★'.repeat(c.rating) : '') + '</span><br>'
    + '<a href="' + url + '" style="display:inline-block;margin-top:8px;background:#4F46E5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:700">📂 פתח ב-CRM</a>'
    + '</td></tr></table>';
}

function wrap(title: string, intro: string, cases: CaseStudy[]): string {
  return '<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c">'
    + '<h2 style="margin:0 0 8px">' + title + '</h2>'
    + '<p style="margin:0 0 12px;color:#444">' + intro + '</p>'
    + cases.map(card).join('')
    + '<div style="margin:18px 0"><a href="' + CRM + '/case-studies" style="display:inline-block;background:#B08D57;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;font-size:16px">📂 כל תיקי הפרויקט</a></div>'
    + '<p style="color:#8a8175;font-size:12px">תזכורת יומית תישלח עד שתפתח את התיק ב-CRM. ✨ צור → ✅ אשר ופרסם → עמוד באתר + גוגל + בינג + סטודיו.</p></div>';
}

function textOf(title: string, cases: CaseStudy[]): string {
  return [title, '', ...cases.map((c) => '• ' + (c.title_raw || '') + ' · ' + (c.city || '') + '\n  ' + CRM + '/case-studies/' + c.id), '', 'כל התיקים: ' + CRM + '/case-studies'].join('\n');
}

async function send(subject: string, html: string, text: string): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CASE_ALERT_EMAIL || process.env.LEAD_ALERT_EMAIL || 'avshi2@gmail.com';
  if (!apiKey) return 'skip: RESEND_API_KEY missing';
  const r = await new Resend(apiKey).emails.send({ from: 'Marble Art · אלס <onboarding@resend.dev>', to: [to], subject, html, text });
  return r.error ? 'error: ' + r.error.message : 'sent';
}

export interface AlertRun { synced: number; newSent: number; reminded: number; results: string[] }

export async function runCaseAlerts(): Promise<AlertRun> {
  const out: AlertRun = { synced: 0, newSent: 0, reminded: 0, results: [] };
  const s = await syncFromAles();
  out.synced = s.added;
  if (!s.ok) out.results.push('sync: ' + s.error);
  const db = crmDb();
  const now = Date.now();

  // 1) brand-new from Ales, never emailed
  const { data: fresh } = await db.from('case_studies').select('*').is('notified_at', null).neq('status', 'archived');
  const nw = (fresh || []) as CaseStudy[];
  if (nw.length) {
    const title = nw.length === 1 ? '🔔 אלס סיים עבודה: ' + (nw[0].title_raw || '') : '🔔 אלס סיים ' + nw.length + ' עבודות';
    const res = await send(title, wrap(title, 'עבודה חדשה הגיעה מהשטח ומחכה לך ב-CRM להפקת תיק פרויקט.', nw), textOf(title, nw));
    out.results.push('new: ' + res);
    if (res === 'sent') {
      await db.from('case_studies').update({ notified_at: new Date().toISOString() }).in('id', nw.map((c) => c.id));
      out.newSent = nw.length;
    }
  }

  // 2) daily nag: emailed >24h ago, still not opened, not published/archived
  const { data: stale } = await db.from('case_studies').select('*').is('opened_at', null).not('notified_at', 'is', null).in('status', ['new', 'generated']);
  const due = ((stale || []) as (CaseStudy & { notified_at: string; last_reminder_at: string | null })[])
    .filter((c) => now - new Date(c.notified_at).getTime() > DAY && (!c.last_reminder_at || now - new Date(c.last_reminder_at).getTime() > DAY));
  if (due.length) {
    const title = '⏰ תזכורת: ' + due.length + ' תיקי פרויקט מאלס עדיין לא נפתחו';
    const res = await send(title, wrap(title, 'כל יום שעבודה לא מתפרסמת = עמוד שגוגל ו-AI לא רואים. 2 דקות ב-CRM.', due), textOf(title, due));
    out.results.push('remind: ' + res);
    if (res === 'sent') {
      await db.from('case_studies').update({ last_reminder_at: new Date().toISOString() }).in('id', due.map((c) => c.id));
      out.reminded = due.length;
    }
  }
  return out;
}
