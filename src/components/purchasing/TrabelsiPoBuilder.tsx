'use client';

// src/components/purchasing/TrabelsiPoBuilder.tsx
// Trabelsi purchase-order builder: pick sketches (with saved material calcs) -> combined
// sheet order -> editable prices -> printable Hebrew PO + WhatsApp send.

import { useState, useMemo } from 'react';
import type { PoSketchOption } from '@/lib/purchasing/trabelsiPoData';
import { saveTrabelsiOrder, updateTrabelsiOrder, type TrabelsiOrder } from '@/lib/purchasing/trabelsiOrders';

const SHEET_M2 = 3.24; // 120×270 porcelain sheet
function ils(n: number): string { return '₪' + (Math.round(Number(n) || 0)).toLocaleString('he-IL'); }
function m2(n: number): string { return (Math.round(n * 100) / 100).toFixed(2) + ' מ"ר'; }
function today(): string {
  const d = new Date(); const p = (n: number) => String(n).padStart(2, '0');
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
}

interface Props {
  sketches: PoSketchOption[];
  defaultPricePerM2: number;
  defaultVatPct: number;
  editOrder?: TrabelsiOrder | null;
  onDoneEditing?: () => void;
}

export default function TrabelsiPoBuilder({ sketches, defaultPricePerM2, defaultVatPct, editOrder, onDoneEditing }: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [sheets, setSheets] = useState(editOrder ? String(editOrder.sheets) : '');
  const [pricePerM2, setPricePerM2] = useState(editOrder ? String(editOrder.price_per_m2) : String(defaultPricePerM2));
  const [crate, setCrate] = useState(editOrder ? String(editOrder.crate_ils) : '980');
  const [delivery, setDelivery] = useState(editOrder ? String(editOrder.delivery_ils) : '350');
  const [notes, setNotes] = useState(editOrder ? (editOrder.notes_he || '') : '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNum, setSavedNum] = useState('');

  const selected = sketches.filter((s) => picked.has(s.id));
  const editTitles = editOrder ? (editOrder.sketch_titles || '') : '';
  const autoSheets = selected.reduce((sum, s) => sum + s.sheets, 0);
  const sheetsNum = sheets === '' ? autoSheets : (Number(sheets) || 0);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setSheets('');
  }

  const calc = useMemo(() => {
    const areaM2 = sheetsNum * SHEET_M2;
    const materialIls = areaM2 * (Number(pricePerM2) || 0);
    const crateIls = Number(crate) || 0;
    const deliveryIls = Number(delivery) || 0;
    const subtotal = materialIls + crateIls + deliveryIls;
    const vatIls = subtotal * (defaultVatPct / 100);
    return { areaM2, materialIls, crateIls, deliveryIls, subtotal, vatIls, totalIls: subtotal + vatIls };
  }, [sheetsNum, pricePerM2, crate, delivery, defaultVatPct]);

  const poText = useMemo(() => {
    const L: string[] = [];
    L.push('הזמנת רכש — Marble Art · ' + today());
    L.push('לכבוד: טרבלסי');
    L.push('');
    const forLine = editOrder ? editTitles : selected.map((s) => s.title).join(' + ');
    if (forLine) L.push('עבור: ' + forLine);
    L.push('');
    L.push('• לוחות פורצלן 120×270, עובי 6 מ"מ — ' + sheetsNum + ' לוחות (' + m2(calc.areaM2) + ')');
    L.push('  מחיר: ' + ils(Number(pricePerM2) || 0) + '/מ"ר → ' + ils(calc.materialIls));
    if (calc.crateIls > 0) L.push('• אריזת עץ — ' + ils(calc.crateIls));
    if (calc.deliveryIls > 0) L.push('• הובלה לסטודיו ARVO — ' + ils(calc.deliveryIls));
    L.push('');
    L.push('סה"כ לפני מע"מ: ' + ils(calc.subtotal));
    L.push('מע"מ ' + defaultVatPct + '%: ' + ils(calc.vatIls));
    L.push('סה"כ לתשלום: ' + ils(calc.totalIls));
    if (notes.trim()) { L.push(''); L.push('הערות: ' + notes.trim()); }
    return L.join('\n');
  }, [selected, sheetsNum, pricePerM2, calc, notes, defaultVatPct]);

  function sendWhatsApp() {
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(poText), '_blank');
  }
  function doPrint() { window.print(); }
  function doCopy() {
    navigator.clipboard.writeText(poText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  async function saveOrder() {
    setSaving(true); setSavedNum('');
    const payload = {
      sketchTitles: editOrder ? editTitles : selected.map((s) => s.title).join(' + '),
      sheets: sheetsNum,
      areaM2: calc.areaM2,
      pricePerM2: Number(pricePerM2) || 0,
      crateIls: calc.crateIls,
      deliveryIls: calc.deliveryIls,
      vatPct: defaultVatPct,
      totalIls: calc.totalIls,
      notesHe: notes,
      poText,
    };
    const res = editOrder ? await updateTrabelsiOrder(editOrder.id, payload) : await saveTrabelsiOrder(payload);
    setSaving(false);
    if (!res.ok || !res.orderNumber) { window.alert('שמירת ההזמנה נכשלה: ' + (res.error || '')); return; }
    setSavedNum(res.orderNumber);
    if (editOrder && onDoneEditing) setTimeout(onDoneEditing, 1200);
  }

  const inp = 'px-2 py-1.5 text-sm border border-stone-300 rounded-md text-left bg-white';
  const card = 'bg-white border border-stone-200 rounded-lg p-4 mb-3';

  return (
    <div dir="rtl">
      <style>{`@media print { body * { visibility: hidden; } #trab-po, #trab-po * { visibility: visible; } #trab-po { position: absolute; inset: 0; } }`}</style>

      {editOrder && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-3 text-sm text-blue-800 no-print">
          ✏️ עריכת הזמנה <span className="font-bold" dir="ltr">{editOrder.order_number}</span> · {editTitles} — שמירה תעדכן את אותה הזמנה
        </div>
      )}
      <div className={card + ' no-print'} style={editOrder ? { display: 'none' } : undefined}>
        <div className="text-sm font-medium text-blue-700 mb-2">1 · עבור אילו כיורים? (מתוך חישובי חומר שמורים)</div>
        {sketches.length === 0 ? (
          <div className="text-sm text-amber-700">אין שרטוטים עם חישוב חומר שמור. פתח מחשבון חומר → 🧮 חשב → 💾 שמור חישוב לשרטוט.</div>
        ) : sketches.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} />
            <span className="font-medium text-stone-800">{s.title}</span>
            <span className="text-xs text-stone-400">{s.sheets} לוחות · {m2(s.neededM2)}</span>
          </label>
        ))}
        {selected.length >= 2 && (
          <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-amber-800">
            💡 יחד: {autoSheets} לוחות. ייתכן שאלס יוכל לקנן את הלוחות ולחסוך לוח (למשל {autoSheets - 1} במקום {autoSheets}) — לאשר איתו לפני ההזמנה, ולעדכן את הכמות למטה.
          </div>
        )}
      </div>

      <div className={card + ' no-print'}>
        <div className="text-sm font-medium text-amber-700 mb-2">2 · פרטי ההזמנה (ניתן לעריכה)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="text-xs text-stone-600">כמות לוחות<input type="number" value={sheets === '' ? sheetsNum : sheets} onChange={(e) => setSheets(e.target.value)} className={inp + ' w-full mt-1'} dir="ltr" /></label>
          <label className="text-xs text-stone-600">מחיר למ"ר<input type="number" value={pricePerM2} onChange={(e) => setPricePerM2(e.target.value)} className={inp + ' w-full mt-1'} dir="ltr" /></label>
          <label className="text-xs text-stone-600">אריזת עץ<input type="number" value={crate} onChange={(e) => setCrate(e.target.value)} className={inp + ' w-full mt-1'} dir="ltr" /></label>
          <label className="text-xs text-stone-600">הובלה<input type="number" value={delivery} onChange={(e) => setDelivery(e.target.value)} className={inp + ' w-full mt-1'} dir="ltr" /></label>
        </div>
        <label className="text-xs text-stone-600 block mt-3">הערות לטרבלסי<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inp + ' w-full mt-1 resize-y'} dir="rtl" placeholder="גוון, זמינות, מועד איסוף…" /></label>
      </div>

      <div id="trab-po" className="bg-white border border-stone-200 rounded-lg p-5 mb-3">
        <div className="flex justify-between items-start pb-3 mb-3 border-b border-stone-200">
          <div>
            <div className="text-lg font-bold text-stone-900">הזמנת רכש · Marble Art</div>
            <div className="text-xs text-stone-500">לכבוד: טרבלסי · תאריך: {today()}</div>
          </div>
          <div className="text-2xl">🪨</div>
        </div>
        {(editOrder ? editTitles : selected.length > 0) && (<div className="text-sm text-stone-600 mb-2">עבור: {editOrder ? editTitles : selected.map((s) => s.title).join(' + ')}</div>)}
        <table className="w-full text-sm mb-3">
          <tbody>
            <tr className="border-b border-stone-100"><td className="py-2">לוחות פורצלן 120×270 · 6 מ"מ</td><td className="py-2 text-left" dir="ltr">{sheetsNum} × {m2(SHEET_M2)}</td><td className="py-2 text-left font-medium" dir="ltr">{ils(calc.materialIls)}</td></tr>
            <tr className="border-b border-stone-100"><td className="py-2">אריזת עץ</td><td></td><td className="py-2 text-left" dir="ltr">{ils(calc.crateIls)}</td></tr>
            <tr className="border-b border-stone-100"><td className="py-2">הובלה לסטודיו ARVO</td><td></td><td className="py-2 text-left" dir="ltr">{ils(calc.deliveryIls)}</td></tr>
            <tr><td className="py-2 text-stone-500">מע"מ {defaultVatPct}%</td><td></td><td className="py-2 text-left text-stone-500" dir="ltr">{ils(calc.vatIls)}</td></tr>
            <tr className="border-t border-stone-300"><td className="py-2 font-bold">סה"כ לתשלום</td><td></td><td className="py-2 text-left font-bold text-lg" dir="ltr">{ils(calc.totalIls)}</td></tr>
          </tbody>
        </table>
        {notes.trim() && (
          <div className="mt-2 bg-amber-50 border-2 border-amber-400 rounded-md px-4 py-3">
            <div className="text-sm font-bold text-amber-900">⚠️ הערות חשובות: {notes}</div>
          </div>
        )}
      </div>

      <div className="flex gap-2 no-print">
        <button onClick={doPrint} disabled={sheetsNum === 0} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50">🖨️ הדפס / PDF</button>
        <button onClick={sendWhatsApp} disabled={sheetsNum === 0} className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-50">💬 שלח בוואטסאפ</button>
        <button onClick={doCopy} disabled={sheetsNum === 0} className="text-sm px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 disabled:opacity-50">{copied ? 'הועתק ✓' : '📋 העתק להצעת ARVO'}</button>
        <button onClick={saveOrder} disabled={sheetsNum === 0 || saving} className="text-sm px-4 py-2 bg-stone-800 text-white rounded-md font-semibold hover:bg-stone-900 disabled:opacity-50">{saving ? 'שומר…' : '💾 שמור הזמנה'}</button>
      </div>
      {savedNum && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 no-print">
          ✓ ההזמנה נשמרה בפנקס · <span className="font-bold" dir="ltr">{savedNum}</span> · עבור ללשונית 📋 פנקס הזמנות למעקב
        </div>
      )}
    </div>
  );
}
