'use client';

// src/components/quotes/QuoteLineEditor.tsx
// Phase 32 Gear 2 — editable line table for a quote. Edit/add/delete lines, live total, save.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveQuoteLines, EditLine } from '@/lib/quotes/saveQuoteLines';
import type { QuoteLineRow } from '@/lib/quotes/types';
import type { OptionRow } from '@/lib/options/optionsCatalog';

interface Props {
  quoteId: string;
  customerId: string | null;
  vatRate: number;
  initialLines: QuoteLineRow[];
  catalogOptions?: OptionRow[];
  onDone?: () => void;
}

function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }
function round2(n: number): number { return Math.round(n * 100) / 100; }

function toEdit(l: QuoteLineRow): EditLine {
  return {
    description_he: l.description_he || '',
    unit: l.unit || "יח'",
    quantity: Number(l.quantity) || 1,
    unit_cost: Number(l.unit_cost) || 0,
    vat_applies: !!l.vat_applies,
    supplier_cost: Number(l.supplier_cost) || 0,
  };
}

export default function QuoteLineEditor({ quoteId, customerId, vatRate, initialLines, catalogOptions = [], onDone }: Props) {
  const router = useRouter();
  const [lines, setLines] = useState<EditLine[]>(initialLines.map(toEdit));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  function update(i: number, field: keyof EditLine, value: string | boolean) {
    const next = [...lines];
    if (field === 'vat_applies') next[i] = { ...next[i], vat_applies: value as boolean };
    else if (field === 'description_he' || field === 'unit') next[i] = { ...next[i], [field]: value as string };
    else next[i] = { ...next[i], [field]: parseFloat(value as string) || 0 };
    setLines(next);
  }
  function addLine() { setLines([...lines, { description_he: '', unit: "יח'", quantity: 1, unit_cost: 0, vat_applies: false, supplier_cost: 0 }]); }
  function addFromCatalog(id: string) {
    const o = catalogOptions.find((x) => x.id === id);
    if (!o) return;
    setLines([...lines, { description_he: o.name_he + (o.note_he ? ' (' + o.note_he + ')' : ''), unit: "יח'", quantity: 1, unit_cost: Number(o.customer_price) || 0, vat_applies: false, supplier_cost: Number(o.ales_cost) || 0 }]);
  }
  function removeLine(i: number) { setLines(lines.filter((_, idx) => idx !== i)); }

  let subtotal = 0, vatable = 0, cost = 0;
  for (const l of lines) {
    const lt = l.quantity * l.unit_cost;
    subtotal += lt;
    if (l.vat_applies) vatable += lt;
    cost += l.quantity * (l.supplier_cost || 0);
  }
  const vatAmount = round2(vatable * vatRate);
  const grand = round2(round2(subtotal) + vatAmount);
  const margin = round2(round2(subtotal) - round2(cost));

  async function handleSave() {
    setError(null); setSavedMsg(null); setSaving(true);
    const res = await saveQuoteLines({ quoteId, customerId, vatRate, lines });
    setSaving(false);
    if (!res.ok) { setError(res.error || 'שמירה נכשלה'); return; }
    setSavedMsg('נשמר ✓ · סה"כ ' + ils(res.totalGrand || grand));
    router.refresh();
    if (onDone) onDone();
  }

  return (
    <div dir="rtl">
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm mb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-right">
              <th className="py-2 px-2 font-medium">תיאור</th>
              <th className="py-2 px-2 font-medium w-16">כמות</th>
              <th className="py-2 px-2 font-medium w-20">יח׳</th>
              <th className="py-2 px-2 font-medium w-24">מחיר ללקוח</th>
              <th className="py-2 px-2 font-medium w-24">עלות (פנימי)</th>
              <th className="py-2 px-2 font-medium w-12">מע"מ</th>
              <th className="py-2 px-2 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-stone-100">
                <td className="py-1.5 px-2"><input value={l.description_he} onChange={(e) => update(i, 'description_he', e.target.value)} className="w-full px-2 py-1 border border-stone-300 rounded-md" dir="rtl" /></td>
                <td className="py-1.5 px-2"><input value={String(l.quantity)} onChange={(e) => update(i, 'quantity', e.target.value)} inputMode="decimal" className="w-full px-2 py-1 border border-stone-300 rounded-md" dir="ltr" /></td>
                <td className="py-1.5 px-2"><input value={l.unit} onChange={(e) => update(i, 'unit', e.target.value)} className="w-full px-2 py-1 border border-stone-300 rounded-md" dir="rtl" /></td>
                <td className="py-1.5 px-2"><input value={String(l.unit_cost)} onChange={(e) => update(i, 'unit_cost', e.target.value)} inputMode="decimal" className="w-full px-2 py-1 border border-stone-300 rounded-md" dir="ltr" /></td>
                <td className="py-1.5 px-2"><input value={String(l.supplier_cost)} onChange={(e) => update(i, 'supplier_cost', e.target.value)} inputMode="decimal" className="w-full px-2 py-1 border border-stone-300 rounded-md" dir="ltr" /></td>
                <td className="py-1.5 px-2 text-center"><input type="checkbox" checked={l.vat_applies} onChange={(e) => update(i, 'vat_applies', e.target.checked)} /></td>
                <td className="py-1.5 px-2 text-center"><button onClick={() => removeLine(i)} className="text-stone-400 hover:text-red-600" title="מחק">🗑️</button></td>
              </tr>
            ))}
            {lines.length === 0 && (<tr><td colSpan={7} className="py-4 text-center text-stone-400 text-sm">אין שורות — הוסף שורה</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={addLine} className="text-sm text-blue-600 hover:underline">+ הוסף שורה</button>
          {catalogOptions.length > 0 && (
            <select onChange={(e) => { if (e.target.value) { addFromCatalog(e.target.value); e.target.value = ""; } }} defaultValue="" className="text-xs px-2 py-1 border border-stone-300 rounded-md bg-white">
              <option value="">➕ הוסף מהמחירון...</option>
              {catalogOptions.map((o) => (<option key={o.id} value={o.id}>{o.name_he} · ₪{o.customer_price}</option>))}
            </select>
          )}
        </div>
        <div className="text-sm text-stone-700 flex gap-4">
          <span>ביניים: <strong>{ils(round2(subtotal))}</strong></span>
          <span>מע"מ: <strong>{ils(vatAmount)}</strong></span>
          <span>סה"כ: <strong className="text-stone-900">{ils(grand)}</strong></span>
          <span className={margin > 0 ? 'text-green-700' : 'text-stone-400'}>מרווח: <strong>{ils(margin)}</strong></span>
        </div>
      </div>

      {error && (<div className="text-xs text-red-600 mb-2">{error}</div>)}
      {savedMsg && (<div className="text-xs text-green-700 mb-2">{savedMsg}</div>)}

      <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50">{saving ? 'שומר...' : '💾 שמור שינויים'}</button>
    </div>
  );
}
