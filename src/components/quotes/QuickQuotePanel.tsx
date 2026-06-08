'use client';

// src/components/quotes/QuickQuotePanel.tsx
// Phase 27 — Quick Quote panel.
// Phase 27b — mini cost calculator.
// Phase 27c — sent-tracking: mark-sent button after save.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizePhoneForWaMe } from '@/lib/shared/exportFormats';
import { createQuickQuote } from '@/lib/quotes/quickQuoteActions';
import { markQuoteSent } from '@/lib/quotes/markQuoteSent';

interface ProjectLite { id: string; title_he: string | null; }
interface Props {
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  projects?: ProjectLite[];
}

function roundTo10(n: number): number { return Math.round(n / 10) * 10; }
function ils(n: number): string { return '₪' + (Math.round(n) || 0).toLocaleString('he-IL'); }
function sumCalc(expr: string): number {
  return expr.split('+').reduce((acc, part) => acc + (parseFloat(part.trim()) || 0), 0);
}

export default function QuickQuotePanel({ customerId, customerName, customerPhone, projects = [] }: Props) {
  const router = useRouter();
  const [cost, setCost] = useState('');
  const [label, setLabel] = useState('Ales');
  const [mode, setMode] = useState<'markup' | 'final'>('markup');
  const [markupPct, setMarkupPct] = useState('40');
  const [finalPrice, setFinalPrice] = useState('');
  const [included, setIncluded] = useState('כיור שיש בעבודת יד, מותקן');
  const [projectId, setProjectId] = useState('');
  const [calc, setCalc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNo, setSavedNo] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const costNum = parseFloat(cost) || 0;
  const calcTotal = sumCalc(calc);
  const price = mode === 'markup' ? roundTo10(costNum * (1 + (parseFloat(markupPct) || 0) / 100)) : (parseFloat(finalPrice) || 0);
  const margin = price - costNum;

  const message = 'היי 🙂 על הכיור שדיברנו — בערך ' + ils(price) + ' כולל הכל' + (included.trim() ? ' (' + included.trim() + ')' : '') + '. אשמח לעשות לך אחד מדהים.';

  function copyMessage() { navigator.clipboard.writeText(message); }

  function openWhatsApp() {
    const phone = normalizePhoneForWaMe(customerPhone || '');
    const text = encodeURIComponent(message);
    const url = phone ? 'https://api.whatsapp.com/send?phone=' + phone + '&text=' + text : 'https://api.whatsapp.com/send?text=' + text;
    window.open(url, '_blank');
  }

  async function handleSave() {
    setError(null);
    if (price <= 0) { setError('יש להזין מחיר ללקוח'); return; }
    setSaving(true);
    const res = await createQuickQuote({
      customerId, customerName, customerPhone,
      projectId: projectId || null,
      supplierCost: costNum, supplierLabel: label,
      customerPrice: price, includedText: included,
      markupNote: mode === 'markup' ? 'מרקאפ ' + markupPct + '%' : 'מחיר ידני',
      messageText: message,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error || 'שמירה נכשלה'); return; }
    setSavedNo(res.quoteNumber || '');
    setSavedId(res.quoteId || null);
    setSentAt(null);
    router.refresh();
  }

  async function handleMarkSent() {
    if (!savedId) return;
    setMarking(true);
    const res = await markQuoteSent(savedId, customerId);
    setMarking(false);
    if (!res.ok) { setError('סימון כנשלח נכשל: ' + (res.error || '')); return; }
    setSentAt(res.sentAt || new Date().toISOString());
    router.refresh();
  }

  return (
    <section className="bg-white border border-amber-200 rounded-lg p-4 mb-6 shadow-sm" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚡</span>
        <h2 className="text-sm font-semibold text-stone-800">הצעת מחיר מהירה</h2>
        <span className="text-xs text-stone-400">(הודעה ידידותית לוואטסאפ — נשמרת בתיק הלקוח)</span>
      </div>

      <div className="mb-3 bg-stone-50 border border-stone-200 rounded-md px-3 py-2">
        <label className="block text-xs text-stone-500 mb-1">🧮 מחשבון עלות — הקלד סכומים עם + (לדוגמה: 8500+700+300)</label>
        <div className="flex items-center gap-2">
          <input value={calc} onChange={(e) => setCalc(e.target.value)} inputMode="text" placeholder="8500+700" className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-amber-400" dir="ltr" />
          <span className="text-sm text-stone-700 whitespace-nowrap">= <strong>{ils(calcTotal)}</strong></span>
          <button type="button" onClick={() => setCost(String(calcTotal))} disabled={calcTotal <= 0} className="text-xs px-2 py-1.5 rounded-md bg-stone-700 text-white hover:bg-stone-800 disabled:opacity-40 whitespace-nowrap">➡️ העתק לעלות</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1">עלות (פנימי)</label>
          <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" placeholder="0" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-amber-400" dir="ltr" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">ספק</label>
          <select value={label} onChange={(e) => setLabel(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-amber-400">
            <option value="Ales">אלס</option>
            <option value="Trabelsi">טרבלסי</option>
            <option value="אבשי">אבשי</option>
          </select>
        </div>
        {projects.length > 0 ? (
          <div>
            <label className="block text-xs text-stone-500 mb-1">פרויקט (לא חובה)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-amber-400">
              <option value="">— ללא —</option>
              {projects.map((p) => (<option key={p.id} value={p.id}>{p.title_he || p.id.slice(0, 8)}</option>))}
            </select>
          </div>
        ) : (<div></div>)}
      </div>

      <div className="flex items-center gap-4 mb-3 text-sm">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={mode === 'markup'} onChange={() => setMode('markup')} />
          <span>מרקאפ %</span>
        </label>
        {mode === 'markup' && (
          <input value={markupPct} onChange={(e) => setMarkupPct(e.target.value)} inputMode="decimal" className="w-20 px-2 py-1 text-sm border border-stone-300 rounded-md" dir="ltr" />
        )}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={mode === 'final'} onChange={() => setMode('final')} />
          <span>מחיר סופי ידני</span>
        </label>
        {mode === 'final' && (
          <input value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} inputMode="decimal" placeholder="₪" className="w-28 px-2 py-1 text-sm border border-stone-300 rounded-md" dir="ltr" />
        )}
      </div>

      <div className="mb-3">
        <label className="block text-xs text-stone-500 mb-1">מה כלול (שורה אחת)</label>
        <input value={included} onChange={(e) => setIncluded(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-amber-400" dir="rtl" />
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-3 text-sm bg-stone-50 rounded-md px-3 py-2">
        <span className="text-stone-600">מחיר ללקוח: <strong className="text-stone-900">{ils(price)}</strong></span>
        <span className={margin > 0 ? 'text-green-700' : 'text-red-600'}>מרווח גס: <strong>{ils(margin)}</strong></span>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-stone-500 mb-1">ההודעה שתישלח</label>
        <div className="text-sm text-stone-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 whitespace-pre-wrap">{message}</div>
      </div>

      {error && (<div className="text-xs text-red-600 mb-2">{error}</div>)}
      {savedNo && !sentAt && (<div className="text-xs text-green-700 mb-2">נשמר בתיק הלקוח ✓ (מספר {savedNo})</div>)}
      {sentAt && (<div className="text-xs text-blue-700 mb-2">✓ נשלח ללקוח · {new Date(sentAt).toLocaleDateString('he-IL')} {new Date(sentAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>)}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={openWhatsApp} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">💬 וואטסאפ</button>
        <button onClick={copyMessage} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-md hover:bg-stone-200">📋 העתק</button>
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50">{saving ? 'שומר...' : '💾 שמור בתיק'}</button>
        {savedId && !sentAt && (
          <button onClick={handleMarkSent} disabled={marking} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{marking ? '...' : '✓ סמן כנשלח'}</button>
        )}
      </div>
    </section>
  );
}
