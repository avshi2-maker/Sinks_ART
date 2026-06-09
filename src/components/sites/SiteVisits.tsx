'use client';

// src/components/sites/SiteVisits.tsx
// Phase 34 — site visit reports: add form + list. Refine fields after real visit.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addSiteVisit } from '@/lib/sites/siteMutations';
import type { SiteVisit } from '@/lib/sites/sitesData';

function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString('he-IL'); }

export default function SiteVisits({ siteId, visits }: { siteId: string; visits: SiteVisit[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendees, setAttendees] = useState('');
  const [zones, setZones] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [findings, setFindings] = useState('');
  const [photos, setPhotos] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    setBusy(true);
    const res = await addSiteVisit({ siteId, visit_date: date, attendees_he: attendees, zones_he: zones, measurements_he: measurements, findings_he: findings, photos_note_he: photos });
    setBusy(false);
    if (!res.ok) { setError(res.error || 'נכשל'); return; }
    setAttendees(''); setZones(''); setMeasurements(''); setFindings(''); setPhotos(''); setOpen(false);
    router.refresh();
  }

  return (
    <section className="mb-6" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-stone-700">דוחות ביקור ({visits.length})</h2>
        <button onClick={() => setOpen(!open)} className="text-xs text-blue-600 hover:underline">{open ? 'ביטול' : '+ דוח ביקור חדש'}</button>
      </div>

      {open && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500">תאריך:</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="ltr" />
          </div>
          <input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="נוכחים (מי השתתף בביקור)" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl" />
          <input value={zones} onChange={(e) => setZones(e.target.value)} placeholder="אזורים / קומות שנסקרו" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl" />
          <textarea value={measurements} onChange={(e) => setMeasurements(e.target.value)} placeholder="מידות עיקריות" rows={2} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white resize-y" dir="rtl" />
          <textarea value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="ממצאים והערות" rows={3} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white resize-y" dir="rtl" />
          <input value={photos} onChange={(e) => setPhotos(e.target.value)} placeholder="הערה על תמונות (היכן נשמרו)" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl" />
          {error && (<div className="text-xs text-red-600">{error}</div>)}
          <button onClick={add} disabled={busy} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{busy ? 'שומר...' : 'שמור דוח'}</button>
        </div>
      )}

      {visits.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-4 text-center text-sm text-stone-500">אין דוחות ביקור.</div>
      ) : (
        <div className="space-y-1.5">
          {visits.map((v) => (
            <div key={v.id} className="bg-white border border-stone-200 rounded-lg p-3">
              <div className="text-sm font-medium text-stone-800">ביקור · {fmtDate(v.visit_date)}{v.attendees_he ? <span className="text-stone-400 font-normal"> · {v.attendees_he}</span> : null}</div>
              {v.zones_he && (<div className="text-xs text-stone-500 mt-1">אזורים: {v.zones_he}</div>)}
              {v.measurements_he && (<div className="text-sm text-stone-600 mt-1 whitespace-pre-wrap">מידות: {v.measurements_he}</div>)}
              {v.findings_he && (<div className="text-sm text-stone-700 mt-1 whitespace-pre-wrap">{v.findings_he}</div>)}
              {v.photos_note_he && (<div className="text-xs text-stone-400 mt-1">📷 {v.photos_note_he}</div>)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
