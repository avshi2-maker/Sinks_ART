'use client';

// src/components/po/PoSendBar.tsx
// Stage 2f: send the PO to Ales — print/PDF, WhatsApp, email (evidence trail).

import { ProductionOrder } from '@/lib/po/poData';

function buildSummary(po: ProductionOrder): string {
  const lines: string[] = [];
  lines.push('הזמנת ייצור ' + po.po_number);
  lines.push('תאריך: ' + new Date(po.created_at).toLocaleDateString('he-IL'));
  lines.push('');
  lines.push('לקוח (Ship To / Sold To):');
  lines.push(po.ship_to_name || '—');
  if (po.ship_to_phone) lines.push('טלפון: ' + po.ship_to_phone);
  if (po.ship_to_address || po.ship_to_city) lines.push('כתובת: ' + [po.ship_to_address, po.ship_to_city].filter(Boolean).join(', '));
  lines.push('');
  lines.push('עלות מוסכמת: ₪' + po.agreed_cost_ils.toLocaleString('he-IL'));
  if (po.change_orders.length > 0) {
    lines.push('');
    lines.push('שינויים:');
    po.change_orders.forEach((c) => lines.push('• ' + c.seq + ': ' + c.description + ' (' + (c.cost_delta >= 0 ? '+' : '') + '₪' + c.cost_delta.toLocaleString('he-IL') + ')'));
    const total = po.agreed_cost_ils + po.change_orders.reduce((s, c) => s + (c.cost_delta || 0), 0);
    lines.push('סה"כ כולל שינויים: ₪' + total.toLocaleString('he-IL'));
  }
  if (po.amendments.length > 0) {
    lines.push('');
    lines.push('תיקונים רשמיים:');
    po.amendments.forEach((a) => lines.push('• ' + a.seq + ': ' + a.description));
  }
  return lines.join('\n');
}

export default function PoSendBar({ po }: { po: ProductionOrder }) {
  const summary = buildSummary(po);

  function printPO() {
    const w = window.open('', '_blank');
    if (!w) return;
    const sketch = po.sketch_svg || '';
    const body = '<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.6">' + summary.replace(/</g, '&lt;') + '</pre>';
    w.document.write('<html dir="rtl"><head><title>' + po.po_number + '</title></head><body style="margin:24px">' + body + '<div style="margin-top:16px">' + sketch + '</div></body></html>');
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  function whatsapp() {
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(summary), '_blank');
  }

  function email() {
    const subject = encodeURIComponent('הזמנת ייצור ' + po.po_number);
    window.open('mailto:?subject=' + subject + '&body=' + encodeURIComponent(summary), '_blank');
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 flex flex-wrap gap-2" dir="rtl">
      <span className="text-sm font-semibold text-stone-700 w-full mb-1">שליחה לאלס</span>
      <button onClick={printPO} className="text-sm px-4 py-1.5 bg-stone-700 text-white rounded-md hover:bg-stone-800">🖨️ הדפס / PDF</button>
      <button onClick={whatsapp} className="text-sm px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700">💬 WhatsApp</button>
      <button onClick={email} className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">📧 אימייל (תיעוד)</button>
    </div>
  );
}
