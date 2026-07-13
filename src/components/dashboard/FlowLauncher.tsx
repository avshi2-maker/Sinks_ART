'use client';

// src/components/dashboard/FlowLauncher.tsx
// "מה עכשיו?" — a pinned, guided launcher at the top of the dashboard. Pick a
// flow, follow numbered steps; each step links straight to the right CRM page.
// Turns the multi-tab maze into one guided path.
// 13/07/2026 — fix: "py-1.5text-xs" was a fused class (Tailwind dropped both).

import { useState } from 'react';
import Link from 'next/link';

type Action = { label: string; href: string };
type Step = { t: string; h: string; actions?: Action[] };
type Flow = { id: string; label: string; icon: string; steps: Step[] };

const FLOWS: Flow[] = [
  { id: 'marble2ziv', label: 'כיור: שרטוט ← אלס ← טרבלסי', icon: '🪨', steps: [
    { t: 'שרטטו את הכיור', h: 'צרו שרטוט חדש עם המידות. חובה "שמור לגלריה" ולראות ✓ ירוק — לפני זה השרטוט קיים רק בדפדפן.', actions: [{ label: 'שרטוט', href: '/sketch' }, { label: 'שרטוט ← הצעה', href: '/sketch-to-offer' }] },
    { t: 'חשבו חומר', h: 'מחשבון החומר — כמה לוחות 12 מ״מ (למינציה כפולה) צריך, לפי מודל 8 הפאנלים.', actions: [{ label: 'מחשבון חומר', href: '/material-calc' }] },
    { t: 'הזמנת עבודה לאלס', h: 'פתחו הזמנת עבודה חדשה (PO) עם השרטוט והמחיר. בדקו שמופיעות רק הזמנות פעילות.', actions: [{ label: 'הזמנות עבודה', href: '/po' }] },
    { t: 'הזמנת חומר מטרבלסי', h: 'הזמנת לוחות (TRB) — מספר לוחות, גוון, רמזי קינון. שלחו בוואטסאפ וסמנו סטטוס.', actions: [{ label: 'הזמנת טרבלסי', href: '/trabelsi-po' }] },
    { t: 'הצעת מחיר ללקוח', h: 'הרכיבו הצעת ARVO (MARB) על בסיס ההזמנות — החומר והעבודה של אלס נשארים חסויים.', actions: [{ label: 'הצעת ARVO', href: '/arvo-offer' }, { label: 'הצעות', href: '/quotes' }] },
    { t: 'שלחו ועקבו', h: 'שמרו כ-PDF, שלחו ללקוח, וההצעה עוברת למעקב הצעות שנשלחו.', actions: [{ label: 'הצעות שנשלחו', href: '/offers-sent' }] },
  ] },
  { id: 'lead2offer', label: 'פנייה ← הצעה', icon: '📥', steps: [
    { t: 'בחרו פנייה', h: 'בבלוק "פניות חדשות" למטה — לחצו על הליד.', actions: [{ label: 'פתח פניות', href: '/leads' }] },
    { t: 'המירו ללקוח', h: 'בכרטיס הפנייה לחצו "המר ללקוח חדש" — נוצרים לקוח ופרויקט.' },
    { t: 'בנו שורת הצעה', h: 'דלת — בקטלוג דלתות. שיש/ספק — בהצעות ספק. העתיקו את השורה.', actions: [{ label: 'דלתות', href: '/door-catalog' }, { label: 'ספקים', href: '/suppliers' }] },
    { t: 'הרכיבו הצעת ARVO', h: 'הדביקו את השורה והוסיפו טקסט פתיחה.', actions: [{ label: 'הצעת ARVO', href: '/arvo-offer' }] },
    { t: 'שמרו ושלחו', h: 'שמרו כ-PDF ושלחו ללקוח. סיימתם.' },
  ] },
  { id: 'wa2offer', label: 'וואטסאפ ← הצעה', icon: '💬', steps: [
    { t: 'צרו פנייה מההודעה', h: 'בפניות — הדביקו את הודעת הוואטסאפ ליצירת ליד.', actions: [{ label: 'פתח פניות', href: '/leads' }] },
    { t: 'המירו ללקוח', h: 'לחצו "המר ללקוח חדש".' },
    { t: 'בנו שורת הצעה', h: 'דלת — בקטלוג דלתות. שיש/ספק — בהצעות ספק. העתיקו.', actions: [{ label: 'דלתות', href: '/door-catalog' }, { label: 'ספקים', href: '/suppliers' }] },
    { t: 'הרכיבו הצעת ARVO', h: 'הדביקו והוסיפו טקסט.', actions: [{ label: 'הצעת ARVO', href: '/arvo-offer' }] },
    { t: 'שמרו ושלחו', h: 'שמרו כ-PDF ושלחו.' },
  ] },
  { id: 'followup', label: 'מעקב הצעות', icon: '📋', steps: [
    { t: 'פתחו הצעות שנשלחו', h: 'רשימת כל ההצעות עם סטטוס וימי המתנה.', actions: [{ label: 'הצעות שנשלחו', href: '/offers-sent' }] },
    { t: 'אתרו ממתינות', h: 'מי לא ענה הכי הרבה זמן — טפלו בהם קודם.' },
    { t: 'שלחו תזכורת', h: 'כפתור הוואטסאפ בכרטיס ההצעה שולח תזכורת מנומסת.' },
    { t: 'עדכנו סטטוס', h: 'סמנו "נענה" / "נסגר" — ההצעה יורדת מהרשימה.' },
  ] },
];

export default function FlowLauncher() {
  const [open, setOpen] = useState(true);
  const [flowId, setFlowId] = useState('marble2ziv');
  const [idx, setIdx] = useState(0);

  const flow = FLOWS.find((f) => f.id === flowId) || FLOWS[0];
  const step = flow.steps[idx];
  const last = idx === flow.steps.length - 1;

  function pick(id: string) { setFlowId(id); setIdx(0); }

  const toggleCls = 'text-xs text-stone-400 hover:text-stone-600';
  const nextCls = 'px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md font-medium disabled:opacity-40 hover:bg-blue-700';
  const prevCls = 'px-3 py-1.5 text-xs text-stone-500 disabled:opacity-30 hover:text-stone-700';
  const linkCls = 'px-3 py-1.5 text-xs bg-white border border-blue-300 text-blue-700 rounded-md no-underline hover:bg-blue-50';

  return (
    <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧭</span>
          <span className="text-sm font-semibold text-stone-800">מה עכשיו?</span>
        </div>
        <button onClick={() => setOpen((v) => !v)} className={toggleCls}>{open ? 'הסתר ▲' : 'הצג ▼'}</button>
      </div>

      {open && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {FLOWS.map((f) => {
              const active = f.id === flowId;
              const btnCls = 'px-3 py-1.5 rounded-lg text-xs border transition-colors ' + (active ? 'border-blue-400 bg-blue-50 text-blue-800 font-semibold' : 'border-stone-200 text-stone-600 hover:border-blue-300');
              return (
                <button key={f.id} onClick={() => pick(f.id)} className={btnCls}>
                  <span className="ml-1">{f.icon}</span>{f.label}
                </button>
              );
            })}
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-blue-700">{flow.label}</span>
              <span className="text-[11px] text-stone-500">שלב {idx + 1} מתוך {flow.steps.length}</span>
            </div>
            <div className="flex gap-1 mb-3">
              {flow.steps.map((_, i) => {
                const barCls = 'h-1.5 flex-1 rounded-full ' + (i <= idx ? 'bg-blue-500' : 'bg-stone-200');
                return <span key={i} className={barCls} />;
              })}
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">{idx + 1}</div>
              <div>
                <div className="text-sm font-semibold text-stone-800">{step.t}</div>
                <div className="text-xs text-stone-500 leading-relaxed mt-0.5">{step.h}</div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className={prevCls}>→ הקודם</button>
              <div className="flex flex-wrap gap-2 justify-center">
                {(step.actions || []).map((a) => (
                  <Link key={a.href} href={a.href} className={linkCls}>{a.label} ↗</Link>
                ))}
              </div>
              <button onClick={() => setIdx((i) => Math.min(flow.steps.length - 1, i + 1))} disabled={last} className={nextCls}>{last ? 'סיום ✓' : 'הבא ←'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
