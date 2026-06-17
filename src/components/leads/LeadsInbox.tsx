'use client';

// src/components/leads/LeadsInbox.tsx
// Phase 37 — leads inbox: list + one-click convert + archive. Shows uploaded photos/videos.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { convertLead, archiveLead, linkLeadToExisting, LeadRow, CustomerLite } from '@/lib/leads/leadsData';

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('he-IL'); }

function isVideo(url: string) { return url.includes('/video/upload/'); }

export default function LeadsInbox({ leads, customers }: { leads: LeadRow[]; customers: CustomerLite[] }) {
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function convert(id: string) {
    if (!window.confirm('להמיר ליד זה ללקוח + פרויקט חדש?')) return;
    setBusyId(id);
    const res = await convertLead(id);
    setBusyId(null);
    if (!res.ok) { window.alert('המרה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
    if (res.customerId) router.push('/customers/' + res.customerId);
  }

  async function linkExisting(leadId: string, customerId: string) {
    if (!customerId) return;
    setBusyId(leadId);
    const res = await linkLeadToExisting(leadId, customerId);
    setBusyId(null);
    setLinkingId(null);
    if (!res.ok) { window.alert('קישור נכשל: ' + (res.error || '')); return; }
    router.refresh();
    if (res.customerId) router.push('/customers/' + res.customerId);
  }

  async function archive(id: string) {
    if (!window.confirm('להעביר ליד זה לארכיון?')) return;
    setBusyId(id);
    const res = await archiveLead(id);
    setBusyId(null);
    if (!res.ok) { window.alert('ארכוב נכשל: ' + (res.error || '')); return; }
    router.refresh();
  }

  if (leads.length === 0) {
    return <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-8 text-center text-sm text-stone-500">אין פניות חדשות מהאתר.</div>;
  }

  return (
    <div className="space-y-2" dir="rtl">
      {leads.map((l) => {
        const converted = !!l.converted_to_customer_id;
        const media = Array.isArray(l.inspiration_image_urls) ? l.inspiration_image_urls : [];
        return (
          <div key={l.id} className={converted ? 'bg-stone-50 border border-stone-200 rounded-lg p-4 opacity-70' : 'bg-white border border-blue-200 rounded-lg p-4 shadow-sm'}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900">{l.full_name || 'ללא שם'}</span>
                  {l.phone && (<span className="text-xs text-stone-500" dir="ltr">{l.phone}</span>)}
                  {converted && (<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ הומר ללקוח</span>)}
                </div>
                <div className="text-xs text-stone-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {l.project_type && (<span>🚿 {l.project_type}</span>)}
                  {l.budget_tier && (<span>💰 {l.budget_tier}</span>)}
                  {l.preferred_marble_family && (<span>🪨 {l.preferred_marble_family}</span>)}
                  {l.city_he && (<span>📍 {l.city_he}</span>)}
                  {l.utm_source && (<span className="text-stone-400">מקור: {l.utm_source}</span>)}
                </div>
                {l.notes_he && (<div className="text-sm text-stone-600 mt-2 bg-stone-50 rounded p-2 whitespace-pre-line">{l.notes_he}</div>)}
                {media.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {media.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative block w-16 h-16 rounded-md overflow-hidden border border-stone-200 bg-stone-100 hover:ring-2 hover:ring-blue-400">
                        {isVideo(url) ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url.replace('/video/upload/', '/video/upload/so_1,w_120,h_120,c_fill,f_jpg/').replace(/\.(mp4|mov|webm|avi|m4v)(\?.*)?$/i, '.jpg$2')} alt={'media ' + (i + 1)} className="w-full h-full object-cover" />
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xl drop-shadow">▶</span>
                          </>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url.replace('/image/upload/', '/image/upload/w_120,h_120,c_fill/')} alt={'media ' + (i + 1)} className="w-full h-full object-cover" />
                        )}
                      </a>
                    ))}
                  </div>
                )}
                <div className="text-xs text-stone-400 mt-1">{fmtDate(l.created_at)}</div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {converted ? (
                  <Link href={'/customers/' + l.converted_to_customer_id} className="text-xs text-blue-600 hover:underline">פתח לקוח →</Link>
                ) : (
                  <>
                  <button onClick={() => convert(l.id)} disabled={busyId === l.id} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{busyId === l.id ? 'ממיר...' : 'המר ללקוח חדש'}</button>
                  {linkingId === l.id ? (
                    <select autoFocus defaultValue="" onChange={(e) => linkExisting(l.id, e.target.value)} disabled={busyId === l.id} className="text-xs px-2 py-1.5 border border-stone-300 rounded-md bg-white max-w-[160px]" dir="rtl">
                      <option value="">— בחר לקוח קיים —</option>
                      {customers.map((cu) => (<option key={cu.id} value={cu.id}>{cu.name_he}{cu.phone ? ' · ' + cu.phone : ''}</option>))}
                    </select>
                  ) : (
                    <button onClick={() => setLinkingId(l.id)} disabled={busyId === l.id} className="text-xs px-3 py-1.5 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 disabled:opacity-50">קשר לקיים</button>
                  )}
                  </>
                )}
                <button onClick={() => archive(l.id)} disabled={busyId === l.id} title="ארכב" className="text-stone-300 hover:text-red-600 text-sm">🗑️</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
