'use client';

// src/components/po/PoSendBar.tsx
// Send the PO to Ales — print/PDF, WhatsApp, email. Full data + grand total + size table.

import { ProductionOrder } from '@/lib/po/poData';

function grandTotal(po: ProductionOrder): number {
  return po.agreed_cost_ils + po.change_orders.reduce((s, c) => s + (c.cost_delta || 0), 0);
}

function buildSummary(po: ProductionOrder): string {
  const lines: string[] = [];
  lines.push('הזמנת ייצור ' + po.po_number);
  lines.push('תאריך: ' + new Date(po.created_at).toLocaleDateString('he-IL'));
  lines.push('');
  lines.push('לקוח (Ship To / Sold To):');
  lines.push(po.ship_to_name || '(לא הוזן)');
  if (po.ship_to_phone) lines.push('טלפון: ' + po.ship_to_phone);
  if (po.ship_to_address || po.ship_to_city) lines.push('כתובת: ' + [po.ship_to_address, po.ship_to_city].filter(Boolean).join(', '));
  lines.push('');
  lines.push('מחיר בסיס: ₪' + po.agreed_cost_ils.toLocaleString('he-IL'));
  if (po.change_orders.length > 0) {
    lines.push('');
    lines.push('שינויים:');
    po.change_orders.forEach((c) => lines.push('• ' + c.seq + ': ' + c.description + ' (' + (c.cost_delta >= 0 ? '+' : '') + '₪' + c.cost_delta.toLocaleString('he-IL') + ')'));
  }
  lines.push('');
  lines.push('סה"כ הזמנה: ₪' + grandTotal(po).toLocaleString('he-IL'));
  if (po.amendments.length > 0) {
    lines.push('');
    lines.push('תיקונים רשמיים:');
    po.amendments.forEach((a) => lines.push('• ' + a.seq + ': ' + a.description));
  }
  return lines.join('\n');
}

function sizeTable(po: ProductionOrder): string {
  const s = po.sketch_spec as Record<string, unknown> | null;
  if (!s) return '';
  const row = (label: string, val: unknown) => (val || val === 0) ? '<tr><td style="padding:3px 12px;color:#64748b">' + label + '</td><td style="padding:3px 12px;font-family:monospace">' + String(val) + '</td></tr>' : '';
  return '<table style="border-collapse:collapse;margin-top:8px;font-size:13px;border:1px solid #cbd5e1">' +
    row('אורך (מ"מ)', s.lengthMm) + row('רוחב (מ"מ)', s.widthMm) + row('גובה (מ"מ)', s.heightMm) +
    row('עומק אגן', s.basinDepthMm) + row('עובי דופן', s.wallThicknessMm) + row('שיפוע %', s.pitchPct) +
    row('שיש חוץ', s.exteriorStone) + row('שיש פנים', s.interiorStone) +
    '</table>';
}

export default function PoSendBar({ po }: { po: ProductionOrder }) {
  const summary = buildSummary(po);

  function printPO() {
    const w = window.open('', '_blank');
    if (!w) return;
    const sketch = po.sketch_svg || '';
    const body = '<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.7;margin:0">' + summary.replace(/</g, '&lt;') + '</pre>';
    const html = '<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>' + po.po_number + '</title></head><body style="margin:24px;font-family:system-ui,sans-serif">' + body + sizeTable(po) + '<div style="margin-top:16px;max-width:680px">' + sketch + '</div></body></html>';
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
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
