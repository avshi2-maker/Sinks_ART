'use client';

// src/components/demos/AlesFinalizePanel.tsx
// FERRARI finalize panel for creating an Ales work order from a sketch card.
// Opens on the card, shows a LIVE cut-list preview (sheets/m²/leftover/material cost),
// collects order amount + commission, shows live Ales profit, then creates the PO.
//
// SEPARATE COMPONENT (not inside DemoCard) so the finalize flow can grow independently
// — multi-sink picker, addons, doors — without touching the gallery card.

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMaterialSettings } from '@/lib/offers/materialSettings';
import { calcMaterial, type MaterialSettings, type MaterialFactors } from '@/lib/offers/materialCalc';
import { sketchSpecToDims } from '@/lib/po/sketchSpecToDims';
import { createWorkOrderFromSketch } from '@/lib/po/createWorkOrderFromSketch';

const FACTORS: MaterialFactors = { laminate: true, wastePct: 12, miterPct: 8, slopePct: 3 };
function ils(n: number): string { return '₪' + (Math.round(Number(n) || 0)).toLocaleString('he-IL'); }
function m2(n: number): string { return (Math.round(n * 100) / 100).toFixed(2) + ' מ"ר'; }

interface Props {
  sketchId: string;
  spec: Record<string, unknown> | null;
  onClose: () => void;
}

export default function AlesFinalizePanel({ sketchId, spec, onClose }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState<MaterialSettings | null>(null);
  const [orderAmount, setOrderAmount] = useState('');
  const [commission, setCommission] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchMaterialSettings().then(setSettings); }, []);

  // live cut list computed in the browser (pure calc, no server round-trip)
  const cut = useMemo(() => {
    if (!settings) return null;
    const dims = sketchSpecToDims(spec);
    if (!dims.lenCm) return null;
    return calcMaterial(dims, FACTORS, settings);
  }, [settings, spec]);

  const materialIls = cut ? cut.totalIls : 0;
  const orderNum = Number(orderAmount) || 0;
  const commNum = Number(commission) || 0;
  const alesProfit = orderNum - materialIls - commNum;
  const canCreate = !!cut && orderNum > 0 && !busy;

  async function create() {
    if (!canCreate) return;
    setBusy(true);
    const res = await createWorkOrderFromSketch({ sketchId, orderAmountIls: orderNum, commissionIls: commNum });
    if (!res.ok || !res.poId) { window.alert('יצירת הוראת עבודה נכשלה: ' + (res.error || '')); setBusy(false); return; }
    router.push('/po/' + res.poId + '/ales');
  }

  const box = 'w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md text-left';

  return (
    <div className="w-full mt-2 border border-blue-200 bg-blue-50/40 rounded-md p-3 space-y-3" dir="rtl">
      <div className="text-xs font-semibold text-blue-700">🔧 יצירת הוראת עבודה לאלס</div>

      {!settings ? (
        <div className="text-xs text-stone-400">טוען נתוני חומר…</div>
      ) : !cut ? (
        <div className="text-xs text-amber-700">אין מידות תקינות בשרטוט — לא ניתן לחשב חומר.</div>
      ) : (
        <div className="bg-white rounded-md border border-stone-200 p-2 text-xs text-stone-600 space-y-1">
          <div className="flex justify-between"><span>לוחות לרכישה</span><strong className="text-stone-800">{cut.sheets} ({m2(cut.purchasedM2)})</strong></div>
          <div className="flex justify-between"><span>מ"ר נדרש</span><span>{m2(cut.neededM2)}</span></div>
          <div className="flex justify-between"><span>עודף/שאריות</span><span className="text-amber-700">{m2(cut.leftoverM2)}</span></div>
          <div className="flex justify-between border-t border-stone-100 pt-1"><span>עלות חומר (כולל מע"מ)</span><strong className="text-stone-800">{ils(cut.totalIls)}</strong></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-stone-500">סכום ההזמנה (₪)<input type="number" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} className={box + ' mt-0.5'} dir="ltr" placeholder="0" /></label>
        <label className="text-[11px] text-stone-500">עמלת Marble Art (₪)<input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className={box + ' mt-0.5'} dir="ltr" placeholder="0" /></label>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2 text-sm">
        <div className="flex justify-between text-stone-600 text-xs"><span>הזמנה</span><span>{ils(orderNum)}</span></div>
        <div className="flex justify-between text-stone-600 text-xs"><span>− חומר</span><span>{ils(materialIls)}</span></div>
        <div className="flex justify-between text-stone-600 text-xs"><span>− עמלה</span><span>{ils(commNum)}</span></div>
        <div className="flex justify-between font-semibold text-emerald-700 border-t border-emerald-200 mt-1 pt-1"><span>רווח Ales</span><span>{ils(alesProfit)}</span></div>
      </div>

      <div className="flex gap-2">
        <button onClick={create} disabled={!canCreate} className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50">{busy ? 'יוצר…' : '📄 צור הוראת עבודה'}</button>
        <button onClick={onClose} disabled={busy} className="text-sm px-4 py-1.5 bg-stone-100 text-stone-600 rounded-md hover:bg-stone-200">ביטול</button>
      </div>
    </div>
  );
}
