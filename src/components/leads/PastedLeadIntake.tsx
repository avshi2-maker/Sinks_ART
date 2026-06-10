'use client';

// src/components/leads/PastedLeadIntake.tsx
// Phase 43 — unified paste-a-lead: Instagram / WhatsApp toggle -> Claude extract -> review -> save.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPastedLead } from '@/lib/leads/leadsData';

type Source = 'instagram' | 'whatsapp';

export default function PastedLeadIntake() {
  const router = useRouter();
  const [source, setSource] = useState<Source>('instagram');
  const [dm, setDm] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<null | { full_name: string; phone: string; city_he: string; style_he: string; notes_he: string }>(null);

  async function analyze() {
    setError(null);
    if (!dm.trim()) { setError('הדבק שיחה'); return; }
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-dm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dmText: dm }) });
      const data = await res.json();
      setAnalyzing(false);
      if (!data.success) { setError(data.error || 'ניתוח נכשל'); return; }
      const p = data.parsed || {};
      setExtracted({
        full_name: p.full_name || '',
        phone: p.phone || '',
        city_he: p.city_he || '',
        style_he: p.style_he || '',
        notes_he: [p.project_type_raw, p.budget_raw, p.summary_he].filter(Boolean).join(' · '),
      });
    } catch (e) {
      setAnalyzing(false);
      setError('שגיאת רשת: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function save() {
    if (!extracted) return;
    setSaving(true);
    const res = await createPastedLead({ ...extracted, source });
    setSaving(false);
    if (!res.ok) { setError('שמירה נכשלה: ' + (res.error || '')); return; }
    setDm(''); setExtracted(null);
    router.refresh();
  }

  const accent = source === 'whatsapp' ? 'from-green-500 to-emerald-500' : 'from-pink-500 to-orange-500';

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 mb-4 shadow-sm" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-stone-800">📥 פנייה חדשה — הדבק שיחה</span>
        <div className="flex gap-1 mr-auto">
          <button onClick={() => setSource('instagram')} className={source === 'instagram' ? 'text-xs px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold' : 'text-xs px-3 py-1 rounded-full bg-stone-100 text-stone-500'}>📸 אינסטגרם</button>
          <button onClick={() => setSource('whatsapp')} className={source === 'whatsapp' ? 'text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold' : 'text-xs px-3 py-1 rounded-full bg-stone-100 text-stone-500'}>💬 וואטסאפ</button>
        </div>
      </div>
      <textarea value={dm} onChange={(e) => setDm(e.target.value)} placeholder="הדבק כאן את השיחה (שם, טלפון, מה רוצים, תקציב, עיר)..." rows={4} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={analyze} disabled={analyzing} className={'text-sm px-4 py-1.5 rounded-md bg-gradient-to-r ' + accent + ' text-white font-semibold hover:opacity-90 disabled:opacity-50'}>{analyzing ? 'מנתח…' : '✨ נתח עם AI'}</button>
      </div>
      {error && (<div className="text-xs text-red-600 mt-2">{error}</div>)}

      {extracted && (
        <div className="mt-3 border-t border-stone-200 pt-3 space-y-2">
          <div className="text-xs font-semibold text-stone-600">ליד שחולץ — בדוק ואשר:</div>
          <div className="grid grid-cols-2 gap-2">
            <input value={extracted.full_name} onChange={(e) => setExtracted({ ...extracted, full_name: e.target.value })} placeholder="שם" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            <input value={extracted.phone} onChange={(e) => setExtracted({ ...extracted, phone: e.target.value })} placeholder="טלפון" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
            <input value={extracted.city_he} onChange={(e) => setExtracted({ ...extracted, city_he: e.target.value })} placeholder="עיר" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            <input value={extracted.style_he} onChange={(e) => setExtracted({ ...extracted, style_he: e.target.value })} placeholder="סגנון" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
          </div>
          <textarea value={extracted.notes_he} onChange={(e) => setExtracted({ ...extracted, notes_he: e.target.value })} placeholder="הערות" rows={2} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
          <button onClick={save} disabled={saving} className="text-sm px-4 py-1.5 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-50">{saving ? 'שומר…' : '✓ צור ליד ב-CRM'}</button>
        </div>
      )}
    </div>
  );
}
