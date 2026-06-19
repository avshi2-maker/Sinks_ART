'use client';

// src/components/rfq/RfqCreateForm.tsx
// Build a MULTI-SINK RFQ for Ales: title, project, one-or-more sinks, asset URLs
// -> create -> shareable link. Each sink carries name/dimensions/stone/notes; Ales
// prices each one separately on his page.
import { useState } from 'react';
import { createRfq, RfqAsset, RfqSink } from '@/lib/rfq/rfqData';

function newSink(): RfqSink {
  return { id: 's_' + Math.random().toString(36).slice(2, 9), name: '', dimensions: '', stone: '', notes: '' };
}

export default function RfqCreateForm() {
  const [title, setTitle] = useState('');
  const [projectRef, setProjectRef] = useState('');
  const [customerHint, setCustomerHint] = useState('');
  const [sinks, setSinks] = useState<RfqSink[]>([newSink()]);
  const [assetText, setAssetText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function setSinkField(id: string, field: keyof RfqSink, value: string) {
    setSinks((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }
  function addSink() { setSinks((prev) => [...prev, newSink()]); }
  function removeSink(id: string) { setSinks((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev)); }

  function guessKind(url: string): RfqAsset['kind'] {
    const u = url.toLowerCase();
    if (u.match(/\.(mp4|mov|webm|m4v|avi)(\?|$)/) || u.includes('/video/upload/')) return 'video';
    if (u.match(/\.(mp3|wav|ogg|m4a|aac)(\?|$)/)) return 'audio';
    if (u.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/)) return 'image';
    return 'file';
  }

  function resetAll() {
    setLink(null); setTitle(''); setProjectRef(''); setCustomerHint('');
    setSinks([newSink()]); setAssetText('');
  }

  async function create() {
    setError(null);
    if (!title.trim()) { setError('הזן כותרת'); return; }
    const cleanSinks = sinks
      .map((s) => ({ ...s, name: s.name.trim(), dimensions: (s.dimensions || '').trim(), stone: (s.stone || '').trim(), notes: (s.notes || '').trim() }))
      .filter((s) => s.name || s.dimensions || s.stone || s.notes);
    if (cleanSinks.length === 0) { setError('הוסף לפחות כיור אחד עם שם'); return; }
    // ensure each sink has a name (fallback to a number)
    cleanSinks.forEach((s, i) => { if (!s.name) s.name = 'כיור ' + (i + 1); });

    setBusy(true);
    const assets: RfqAsset[] = assetText.split(/\s+/).map((s) => s.trim()).filter(Boolean).map((url) => ({ url, kind: guessKind(url) }));
    const res = await createRfq({
      title_he: title,
      project_ref: projectRef,
      customer_hint: customerHint,
      sinks: cleanSinks,
      assets,
    });
    setBusy(false);
    if (!res.ok || !res.token) { setError('יצירה נכשלה: ' + (res.error || '')); return; }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setLink(origin + '/rfq/' + res.token);
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function waLink() {
    if (!link) return;
    const txt = encodeURIComponent('שלום אלס, בקשת תמחור חדשה:\n' + title + '\n' + link);
    window.open('https://api.whatsapp.com/send?text=' + txt, '_blank');
  }

  if (link) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3" dir="rtl">
        <div className="text-sm font-semibold text-emerald-800">✓ ה-RFQ נוצר — הקישור מוכן לשליחה</div>
        <div className="bg-white border border-stone-300 rounded-md p-2 text-xs text-stone-700 break-all" dir="ltr">{link}</div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={copyLink} className="text-sm px-4 py-1.5 bg-stone-700 text-white rounded-md hover:bg-stone-800">{copied ? '✓ הועתק' : '📋 העתק קישור'}</button>
          <button onClick={waLink} className="text-sm px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700">💬 שלח לאלס</button>
          <button onClick={resetAll} className="text-sm px-4 py-1.5 border border-stone-300 text-stone-600 rounded-md hover:bg-stone-100">+ RFQ חדש</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3" dir="rtl">
      <div className="grid grid-cols-2 gap-2">
        <label className="block col-span-2">
          <span className="block text-xs font-medium text-stone-600 mb-1">כותרת ה-RFQ *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: 2 כיורים - עדי מילילובסקי" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-stone-600 mb-1">פרויקט / לקוח</span>
          <input value={projectRef} onChange={(e) => setProjectRef(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-stone-600 mb-1">עיר / רמז ללקוח</span>
          <input value={customerHint} onChange={(e) => setCustomerHint(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
        </label>
      </div>

      <div className="border-t border-stone-200 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-stone-700">כיורים לתמחור ({sinks.length})</div>
          <button onClick={addSink} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium">+ הוסף כיור</button>
        </div>

        <div className="space-y-3">
          {sinks.map((s, i) => (
            <div key={s.id} className="border border-stone-200 rounded-lg p-3 bg-stone-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500">כיור {i + 1}</span>
                {sinks.length > 1 && (<button onClick={() => removeSink(s.id)} className="text-xs text-stone-400 hover:text-red-600">🗑️ הסר</button>)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block col-span-2">
                  <span className="block text-xs font-medium text-stone-600 mb-1">שם / תיאור הכיור</span>
                  <input value={s.name} onChange={(e) => setSinkField(s.id, 'name', e.target.value)} placeholder="למשל: כיור אמבט הורים 240 ס\u0022מ" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-stone-600 mb-1">מידות</span>
                  <input value={s.dimensions} onChange={(e) => setSinkField(s.id, 'dimensions', e.target.value)} placeholder="2400×500×250" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-stone-600 mb-1">שיש</span>
                  <input value={s.stone} onChange={(e) => setSinkField(s.id, 'stone', e.target.value)} placeholder="קלקטה" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
                </label>
                <label className="block col-span-2">
                  <span className="block text-xs font-medium text-stone-600 mb-1">הערות לכיור</span>
                  <textarea value={s.notes} onChange={(e) => setSinkField(s.id, 'notes', e.target.value)} rows={2} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-200 pt-3">
        <label className="block">
          <span className="block text-xs font-medium text-stone-600 mb-1">קישורי מדיה (תמונות/וידאו/קול של הלקוח + שרטוט)</span>
          <textarea value={assetText} onChange={(e) => setAssetText(e.target.value)} rows={3} placeholder="הדבק כתובות URL, אחת בכל שורה" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="ltr" />
          <span className="text-[11px] text-stone-400">כל כתובת בשורה נפרדת. סוג הקובץ מזוהה אוטומטית.</span>
        </label>
      </div>

      {error && (<div className="text-xs text-red-600">{error}</div>)}
      <button onClick={create} disabled={busy} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50">{busy ? 'יוצר...' : '🔗 צור RFQ וקבל קישור'}</button>
    </div>
  );
}
