'use client';

// src/components/po/PoList.tsx
// PO list + create-new-draft button.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPO, ProductionOrder } from '@/lib/po/poData';

function fmt(iso: string) { return new Date(iso).toLocaleDateString('he-IL'); }

export default function PoList({ pos }: { pos: ProductionOrder[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function newDraft() {
    setBusy(true);
    const res = await createPO({});
    setBusy(false);
    if (!res.ok || !res.id) { window.alert('יצירה נכשלה: ' + (res.error || '')); return; }
    router.push('/po/' + res.id);
  }

  return (
    <div dir="rtl">
      <button onClick={newDraft} disabled={busy} className="mb-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
        <span>➕</span><span>{busy ? 'יוצר...' : 'הזמנת ייצור חדשה'}</span>
      </button>

      {pos.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-8 text-center text-sm text-stone-500">אין הזמנות ייצור עדיין.</div>
      ) : (
        <div className="space-y-2">
          {pos.map((po) => (
            <button key={po.id} onClick={() => router.push('/po/' + po.id)} className="w-full text-right bg-white border border-stone-200 rounded-lg p-3 hover:border-blue-300 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-900">{po.po_number}</div>
                <div className="text-xs text-stone-500">{po.ship_to_name || 'ללא לקוח'} · {fmt(po.created_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                {po.agreed_cost_ils > 0 && (<span className="text-sm text-stone-700">₪{po.agreed_cost_ils.toLocaleString('he-IL')}</span>)}
                <span className={po.status === 'issued' ? 'text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full' : 'text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full'}>{po.status === 'issued' ? 'הונפק' : 'טיוטה'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
