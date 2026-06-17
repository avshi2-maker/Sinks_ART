'use client';

// src/components/rfq/RfqCreateForm.tsx
// Build an RFQ for Ales: title, project, spec, asset URLs -> create -> shareable link.
import { useState } from 'react';
import { createRfq, RfqAsset } from '@/lib/rfq/rfqData';

export default function RfqCreateForm() {
  const [title, setTitle] = useState('');
  const [projectRef, setProjectRef] = useState('');
  const [customerHint, setCustomerHint] = useState('');
  const [modelName, setModelName] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [stone, setStone] = useState('');
  const [specNotes, setSpecNotes] = useState('');
  const [assetText, setAssetText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function guessKind(url: string): RfqAsset['kind'] {
    const u = url.toLowerCase();
    if (u.match(/\.(mp4|mov|webm|m4v|avi)(\?|$)/) || u.includes('/video/upload/')) return 'video';
    if (u.match(/\.(mp3|wav|ogg|m4a|aac)(\?|$)/)) return 'audio';
    if (u.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/)) return 'image';
    return 'file';
  }

  async function create() {
    setError(null);
    if (!title.trim()) { setError('הזן כותרת'); return; }
    setBusy(true);
    const assets: RfqAsset[] = assetText.split(/\s+/).map((s) => s.trim()).filter(Boolean).map((url) => ({ url, kind: guessKind(url) }));
    const res = await createRfq({
      title_he: title,
      project_ref: projectRef,
      customer_hint: customerHint,
      spec: { modelName, dimensions, stone, notes: specNotes },
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
          <button onClick={() => { setLink(null); setTitle(''); setProjectRef(''); setCustomerHint(''); setModelName(''); setDimensions(''); setStone(''); setSpecNotes(''); setAssetText(''); }} className="text-sm px-4 py-1.5 border border-stone-300 text-stone-600 rounded-md hover:bg-stone-100">+ RFQ חדש</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3" dir="rtl">
      <div className="grid grid-cols-2 gap-2">
        <label className="block col-span-2">
          <span className="block text-xs font-medium text-stone-600 mb-1">כותרת ה-RFQ *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: כיור כפול - זיו אלטשולר" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
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
        <div className="text-xs font-semibold text-stone-700 mb-2">מפרט הכיור (מה שאלס יראה)</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">דגם</span>
            <input value={modelName} onChange={(e) => setModelName(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">מידות</span>
            <input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder='2950×450×250' className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
          </label>
          <label className="block col-span-2">
            <span className="block text-xs font-medium text-stone-600 mb-1">שיש</span>
            <input value={stone} onChange={(e) => setStone(e.target.value)} placeholder="קלקטה" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
          </label>
          <label className="block col-span-2">
            <span className="block text-xs font-medium text-stone-600 mb-1">הערות מפרט</span>
            <textarea value={specNotes} onChange={(e) => setSpecNotes(e.target.value)} rows={2} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
          </label>
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
