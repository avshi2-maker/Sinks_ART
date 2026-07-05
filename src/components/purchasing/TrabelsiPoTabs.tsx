'use client';

// src/components/purchasing/TrabelsiPoTabs.tsx
// Two tabs: 🛒 new order (the builder) · 📋 the orders register.
// Register's ✏️ opens the builder prefilled to correct an existing order (same TRB number).

import { useState } from 'react';
import TrabelsiPoBuilder from './TrabelsiPoBuilder';
import TrabelsiOrdersRegister from './TrabelsiOrdersRegister';
import type { PoSketchOption } from '@/lib/purchasing/trabelsiPoData';
import type { TrabelsiOrder } from '@/lib/purchasing/trabelsiOrders';

interface Props {
  sketches: PoSketchOption[];
  orders: TrabelsiOrder[];
  defaultPricePerM2: number;
  defaultVatPct: number;
}

export default function TrabelsiPoTabs({ sketches, orders, defaultPricePerM2, defaultVatPct }: Props) {
  const [tab, setTab] = useState<'new' | 'register'>('new');
  const [editOrder, setEditOrder] = useState<TrabelsiOrder | null>(null);

  function startEdit(o: TrabelsiOrder) { setEditOrder(o); setTab('new'); }
  function doneEditing() { setEditOrder(null); setTab('register'); }

  const btn = (t: 'new' | 'register', label: string) => (
    <button onClick={() => { setTab(t); if (t === 'register') setEditOrder(null); }} className={'text-sm px-4 py-2 rounded-md font-medium ' + (tab === t ? 'bg-stone-800 text-white' : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-50')}>{label}</button>
  );

  return (
    <div dir="rtl">
      <div className="flex gap-2 mb-4 no-print">
        {btn('new', editOrder ? '✏️ עריכת ' + editOrder.order_number : '🛒 הזמנה חדשה')}
        {btn('register', '📋 פנקס הזמנות (' + orders.filter((o) => o.status !== 'archived').length + ')')}
      </div>
      {tab === 'new'
        ? <TrabelsiPoBuilder key={editOrder ? editOrder.id : 'new'} sketches={sketches} defaultPricePerM2={defaultPricePerM2} defaultVatPct={defaultVatPct} editOrder={editOrder} onDoneEditing={doneEditing} />
        : <TrabelsiOrdersRegister orders={orders} onEdit={startEdit} />}
    </div>
  );
}
