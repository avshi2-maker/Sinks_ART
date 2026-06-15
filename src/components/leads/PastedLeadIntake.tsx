'use client';

// src/components/leads/PastedLeadIntake.tsx
// Unified paste intake. Counterparty toggle: לקוח (customer lead) | ספק (supplier price offer, e.g. Ales).
// Customer path -> /api/analyze-dm -> createPastedLead (unchanged).
// Supplier path -> /api/analyze-supplier -> editable line-items -> createSupplierOffer.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPastedLead } from '@/lib/leads/leadsData';
import { createSupplierOffer, OfferLine } from '@/lib/suppliers/suppliersData';

type Party = 'customer' | 'supplier';
type Source = 'instagram' | 'whatsapp' | 'call';

interface SupplierExtract {
  supplier_name: string;
  supplier_phone: string;
  trade: string;
  project_ref: string;
  notes_he: string;
  line_items: OfferLine[];
  total_ils: number;
}

export default function PastedLeadIntake() {
  const router = useRouter();
  const [party, setParty] = useState<Party>('customer');
  const [source, setSource] = useState<Source>('instagram');
  const [dm, setDm] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // customer extract (unchanged shape)
  const [extracted, setExtracted] = useState<null | { full_name: string; phone: string; city_he: string; style_he: string; notes_he: string }>(null);
  // supplier extract
  const [sup, setSup] = useState<SupplierExtract | null>(null);
  const [saveToDir, setSaveToDir] = useState(true);

  function resetOut() { setExtracted(null); setSup(null); setError(null); setOk(null); }

  async function analyze() {
    resetOut();
    if (!dm.trim()) { setError(party === 'supplier' ? 'הדבק הצעת מחיר מהספק' : 'הדבק שיחה'); return; }
    setAnalyzing(true);
    try {
      if (party === 'supplier') {
        const res = await fetch('/api/analyze-supplier', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ offerText: dm }) });
        const data = await res.json();
        setAnalyzing(false);
        if (!data.success) { setError(data.error || 'ניתוח נכשל'); return; }
        const p = data.parsed || {};
        setSup({
          supplier_name: p.supplier_name || '',
          supplier_phone: p.supplier_phone || '',
          trade: '',
          project_ref: p.project_ref || '',
          notes_he: p.notes_he || '',
          line_items: Array.isArray(p.line_items) && p.line_items.length ? p.line_items : [{ desc: '', price: 0 }],
          total_ils: Number(p.total_ils) || 0,
        });
      } else {
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
      }
    } catch (e) {
      setAnalyzing(false);
      setError('שגיאת רשת: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  // ----- supplier line-item editing -----
  const supTotal = sup ? sup.line_items.reduce((s, it) => s + (Number(it.price) || 0), 0) : 0;
  function setItem(i: number, field: keyof OfferLine, val: string) {
    if (!sup) return;
    const items = sup.line_items.map((it, idx) => idx === i ? { ...it, [field]: field === 'price' ? (Number(val) || 0) : val } : it);
    setSup({ ...sup, line_items: items });
  }
  function addItem() { if (sup) setSup({ ...sup, line_items: [...sup.line_items, { desc: '', price: 0 }] }); }
  function removeItem(i: number) { if (sup) setSup({ ...sup, line_items: sup.line_items.filter((_, idx) => idx !== i) }); }

  async function saveCustomer() {
    if (!extracted) return;
    setSaving(true);
    const res = await createPastedLead({ ...extracted, source });
    setSaving(false);
    if (!res.ok) { setError('שמירה נכשלה: ' + (res.error || '')); return; }
    setDm(''); resetOut(); setOk('הליד נשמר ב-CRM');
    router.refresh();
  }

  async function saveSupplier() {
    if (!sup) return;
    setSaving(true);
    const items = sup.line_items.filter((it) => (it.desc || '').trim() || (Number(it.price) || 0) > 0);
    const res = await createSupplierOffer({
      supplier_name: sup.supplier_name,
      supplier_phone: sup.supplier_phone,
      trade: sup.trade,
      project_ref: sup.project_ref,
      source,
      raw_message: dm,
      line_items: items,
      total_ils: supTotal,
      save_to_directory: saveToDir,
    });
    setSaving(false);
    if (!res.ok) { setError('שמירה נכשלה: ' + (res.error || '')); return; }
    setDm(''); resetOut(); setOk('הצעת הספק נשמרה · זמינה בלשונית ספקים ליצירת טיוטה');
    router.refresh();
  }

  const accent = party === 'supplier' ? 'from-amber-500 to-orange-600' : (source === 'whatsapp' ? 'from-green-500 to-emerald-500' : 'from-pink-500 to-orange-500');
  const placeholder = party === 'supplier'
    ? 'הדבק כאן את הצעת המחיר מהספק (אלס): פירוט עבודות + מחירים, כולל מע"מ...'
    : 'הדבק כאן את השיחה (שם, טלפון, מה רוצים, תקציב, עיר)...';

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 mb-4 shadow-sm" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-stone-800">📥 פנייה חדשה — הדבק והפק</span>
        <div className="flex gap-1 mr-auto bg-stone-100 rounded-full p-0.5">
          <button onClick={() => { setParty('customer'); resetOut(); }} className={party === 'customer' ? 'text-xs px-3 py-1 rounded-full bg-white text-stone-800 font-semibold shadow-sm' : 'text-xs px-3 py-1 rounded-full text-stone-500'}>🧑 לקוח</button>
          <button onClick={() => { setParty('supplier'); resetOut(); }} className={party === 'supplier' ? 'text-xs px-3 py-1 rounded-full bg-white text-amber-700 font-semibold shadow-sm' : 'text-xs px-3 py-1 rounded-full text-stone-500'}>🏭 ספק / אלס</button>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-2">
        <span className="text-[11px] text-stone-400 ml-1">מקור:</span>
        <button onClick={() => setSource('instagram')} className={source === 'instagram' ? 'text-xs px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold' : 'text-xs px-3 py-1 rounded-full bg-stone-100 text-stone-500'}>📸 אינסטגרם</button>
        <button onClick={() => setSource('whatsapp')} className={source === 'whatsapp' ? 'text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold' : 'text-xs px-3 py-1 rounded-full bg-stone-100 text-stone-500'}>💬 וואטסאפ</button>
        <button onClick={() => setSource('call')} className={source === 'call' ? 'text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold' : 'text-xs px-3 py-1 rounded-full bg-stone-100 text-stone-500'}>📞 שיחה</button>
      </div>

      <textarea value={dm} onChange={(e) => setDm(e.target.value)} placeholder={placeholder} rows={4} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={analyze} disabled={analyzing} className={'text-sm px-4 py-1.5 rounded-md bg-gradient-to-r ' + accent + ' text-white font-semibold hover:opacity-90 disabled:opacity-50'}>{analyzing ? 'מנתח…' : '✨ נתח עם AI'}</button>
      </div>
      {error && (<div className="text-xs text-red-600 mt-2">{error}</div>)}
      {ok && (<div className="text-xs text-emerald-600 mt-2">✓ {ok}</div>)}

      {party === 'customer' && extracted && (
        <div className="mt-3 border-t border-stone-200 pt-3 space-y-2">
          <div className="text-xs font-semibold text-stone-600">ליד שחולץ — בדוק ואשר:</div>
          <div className="grid grid-cols-2 gap-2">
            <input value={extracted.full_name} onChange={(e) => setExtracted({ ...extracted, full_name: e.target.value })} placeholder="שם" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            <input value={extracted.phone} onChange={(e) => setExtracted({ ...extracted, phone: e.target.value })} placeholder="טלפון" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
            <input value={extracted.city_he} onChange={(e) => setExtracted({ ...extracted, city_he: e.target.value })} placeholder="עיר" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            <input value={extracted.style_he} onChange={(e) => setExtracted({ ...extracted, style_he: e.target.value })} placeholder="סגנון" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
          </div>
          <textarea value={extracted.notes_he} onChange={(e) => setExtracted({ ...extracted, notes_he: e.target.value })} placeholder="הערות" rows={2} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
          <button onClick={saveCustomer} disabled={saving} className="text-sm px-4 py-1.5 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-50">{saving ? 'שומר…' : '✓ צור ליד ב-CRM'}</button>
        </div>
      )}

      {party === 'supplier' && sup && (
        <div className="mt-3 border-t border-amber-200 pt-3 space-y-2">
          <div className="text-xs font-semibold text-amber-700">הצעת ספק שחולצה — בדוק, ערוך ואשר:</div>
          <div className="grid grid-cols-3 gap-2">
            <input value={sup.supplier_name} onChange={(e) => setSup({ ...sup, supplier_name: e.target.value })} placeholder="שם ספק" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            <input value={sup.supplier_phone} onChange={(e) => setSup({ ...sup, supplier_phone: e.target.value })} placeholder="טלפון" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
            <input value={sup.trade} onChange={(e) => setSup({ ...sup, trade: e.target.value })} placeholder="תחום (קבלן, ספק אבן…)" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
          </div>
          <input value={sup.project_ref} onChange={(e) => setSup({ ...sup, project_ref: e.target.value })} placeholder="עבור איזה פרויקט / כיור" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />

          <div className="border border-stone-200 rounded-md overflow-hidden">
            <div className="flex items-center bg-stone-50 text-[11px] font-semibold text-stone-500 px-2 py-1">
              <span className="flex-1">תיאור</span>
              <span className="w-24 text-center">מחיר ₪</span>
              <span className="w-8"></span>
            </div>
            {sup.line_items.map((it, i) => (
              <div key={i} className="flex items-center gap-1 px-2 py-1 border-t border-stone-100">
                <input value={it.desc} onChange={(e) => setItem(i, 'desc', e.target.value)} placeholder="תיאור פריט" className="flex-1 px-2 py-1 text-sm border border-stone-200 rounded" dir="rtl" />
                <input type="number" value={it.price || ''} onChange={(e) => setItem(i, 'price', e.target.value)} placeholder="0" className="w-24 px-2 py-1 text-sm border border-stone-200 rounded text-center" dir="ltr" />
                <button onClick={() => removeItem(i)} title="מחק שורה" className="w-8 text-stone-400 hover:text-red-600 text-sm">🗑️</button>
              </div>
            ))}
            <div className="flex items-center justify-between px-2 py-1 border-t border-stone-200 bg-stone-50">
              <button onClick={addItem} className="text-xs text-blue-600 hover:underline">+ הוסף שורה</button>
              <div className="text-sm font-semibold text-stone-800">סה"כ כולל מע"מ: ₪{supTotal.toLocaleString()}</div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-stone-600">
            <input type="checkbox" checked={saveToDir} onChange={(e) => setSaveToDir(e.target.checked)} />
            <span>שמור גם את הספק לספריית הספקים</span>
          </label>
          <div className="text-[11px] text-stone-400">טיוטה בלבד · אלס מעתיק לפנקס ההצעות שלו (לוגו, ח.פ., כתובת) ושולח ללקוח. אבשי לא מוכר ישירות.</div>
          <button onClick={saveSupplier} disabled={saving} className="text-sm px-4 py-1.5 bg-amber-600 text-white rounded-md font-semibold hover:bg-amber-700 disabled:opacity-50">{saving ? 'שומר…' : '💾 שמור הצעת ספק'}</button>
        </div>
      )}
    </div>
  );
}
