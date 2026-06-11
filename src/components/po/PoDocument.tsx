'use client';

// src/components/po/PoDocument.tsx
// The official production-order document. Stage 2a: shell + cost + issue.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductionOrder, issuePO, updatePOCost, updatePOShipTo } from '@/lib/po/poData';

function fmtDate(iso: string | null) { return iso ? new Date(iso).toLocaleDateString('he-IL') : '—'; }

export default function PoDocument({ po }: { po: ProductionOrder }) {
  const router = useRouter();
  const issued = po.status === 'issued';
  const [cost, setCost] = useState(po.agreed_cost_ils || 0);
  const [ship, setShip] = useState({ name: po.ship_to_name || '', phone: po.ship_to_phone || '', address: po.ship_to_address || '', city: po.ship_to_city || '' });
  async function saveShip() { setBusy(true); await updatePOShipTo(po.id, { ship_to_name: ship.name, ship_to_phone: ship.phone, ship_to_address: ship.address, ship_to_city: ship.city }); setBusy(false); router.refresh(); }
  const [busy, setBusy] = useState(false);

  async function saveCost() {
    setBusy(true);
    await updatePOCost(po.id, cost);
    setBusy(false);
    router.refresh();
  }

  async function issue() {
    if (!window.confirm('להנפיק את ההזמנה? לאחר ההנפקה המסמך ננעל כרשומה רשמית.')) return;
    setBusy(true);
    const res = await issuePO(po.id);
    setBusy(false);
    if (!res.ok) { window.alert('הנפקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/po')} className="text-sm text-blue-600 hover:underline">← כל ההזמנות</button>
        <span className={issued ? 'text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full' : 'text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full'}>
          {issued ? 'הונפק · ' + fmtDate(po.issued_at) : 'טיוטה'}
        </span>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex items-start justify-between border-b-2 border-stone-300 pb-3 mb-4">
          <div>
            <div className="text-lg font-semibold text-stone-900">הזמנת ייצור · Marble Art</div>
            <div className="text-sm text-stone-500">ספק: אלס · יצרן שיש</div>
          </div>
          <div className="text-left">
            <div className="text-xs text-stone-500">מס׳ הזמנה</div>
            <div className="text-xl font-bold text-blue-700">{po.po_number}</div>
            <div className="text-xs text-stone-400">{fmtDate(po.created_at)}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-semibold text-stone-700 mb-2">Ship To / Sold To — הלקוח (אלס מספק ומחייב ישירות)</div>
          {issued ? (
            <div className="text-sm text-stone-700 leading-relaxed bg-stone-50 rounded-md p-3">
              <div className="font-medium">{po.ship_to_name || '—'}</div>
              <div className="text-stone-500">{[po.ship_to_phone, po.ship_to_address, po.ship_to_city].filter(Boolean).join(' · ')}</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} placeholder="שם הלקוח" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
                <input value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} placeholder="טלפון" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
                <input value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} placeholder="כתובת" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
                <input value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} placeholder="עיר" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
              </div>
              <button onClick={saveShip} disabled={busy} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">שמור פרטי לקוח</button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-md px-4 py-3">
          <span className="text-sm text-blue-700">עלות מוסכמת (מחיר אלס)</span>
          {issued ? (
            <span className="text-lg font-semibold text-blue-700">₪{po.agreed_cost_ils.toLocaleString('he-IL')}</span>
          ) : (
            <span className="flex items-center gap-2">
              <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} className="w-28 px-2 py-1 text-sm border border-stone-300 rounded-md" dir="ltr" />
              <button onClick={saveCost} disabled={busy} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">שמור</button>
            </span>
          )}
        </div>
      </div>

      {!issued && (
        <div className="flex justify-end">
          <button onClick={issue} disabled={busy} className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">🔒 הנפק הזמנה (נעילה)</button>
        </div>
      )}
    </div>
  );
}
