'use client';

// src/components/shared/WorkflowNav.tsx
// FERRARI NAV (rebuilt 05/07/2026, Avshi-approved): 5 groups ordered by the business money flow —
// lead in -> design -> price -> produce/purchase -> money. Retired tabs live in /_backups.
// Group 4 gets the Trabelsi PO link when that module ships (no dead links).

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavTool { href: string; label: string; icon: string; }
export interface NavStage { id: string; label: string; tools: NavTool[]; }

export const STAGES: NavStage[] = [
  // 1 · LEADS & PEOPLE — daily core: who's coming in, who we work with
  { id: 'people', label: 'פניות ולקוחות', tools: [
    { href: '/pipeline', label: 'צנרת עבודות', icon: '🔧' },
    { href: '/leads', label: 'פניות', icon: '📥' },
    { href: '/sinc', label: 'שיחות', icon: '🎙️' },
    { href: '/intake', label: 'מדיה', icon: '📸' },
    { href: '/customers', label: 'לקוחות', icon: '👥' },
    { href: '/sites', label: 'אתרים', icon: '🏨' },
  ] },
  // 2 · DESIGN — the pipeline's front door
  { id: 'design', label: 'עיצוב', tools: [
    { href: '/sketch', label: 'שרטוט', icon: '📐' },
    { href: '/demos', label: 'גלריה', icon: '🎨' },
    { href: '/prompt-builder', label: 'הדמיה', icon: '🖼️' },
  ] },
  // 3 · PRICING & OFFERS — the Queen's court
  { id: 'pricing', label: 'תמחור והצעות', tools: [
    { href: '/sketch-to-offer', label: 'משרטוט להצעת מחיר', icon: '🧮' },
    { href: '/material-calc', label: 'מחשבון חומר', icon: '📐' },
    { href: '/ales-settings', label: 'הגדרות עלויות אלס', icon: '⚙️' },
    { href: '/quotes', label: 'הצעות', icon: '🧾' },
    { href: '/arvo-offer', label: 'הצעת ARVO', icon: '📄' },
    { href: '/offers-sent', label: 'הצעות שנשלחו', icon: '📌' },
  ] },
  // 4 · PRODUCTION & PURCHASING — Ales work orders + supplier POs
  { id: 'production', label: 'ייצור ורכש', tools: [
    { href: '/po', label: 'הזמנות ייצור', icon: '📋' },
    { href: '/trabelsi-po', label: 'הזמנת רכש טרבלסי', icon: '🛒' },
    { href: '/suppliers', label: 'ספקים', icon: '🏭' },
  ] },
  // 5 · MONEY & DATA
  { id: 'money', label: 'כסף ונתונים', tools: [
    { href: '/roi', label: 'ROI', icon: '📊' },
    { href: '/marble', label: 'שיש', icon: '🪨' },
  ] },
];

export default function WorkflowNav({ newLeads = 0 }: { newLeads?: number }) {
  const pathname = usePathname();
  const isPath = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const activeStage = STAGES.find((s) => s.tools.some((t) => isPath(t.href))) || null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1 items-center flex-wrap">
        <Link href="/dashboard" className={'px-3 py-1.5 rounded-md text-sm no-underline ' + (pathname.startsWith('/dashboard') ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100')}>🏠 לוח היום</Link>
        {STAGES.map((s) => {
          const isActive = activeStage?.id === s.id;
          const firstHref = s.tools[0].href;
          return (
            <Link key={s.id} href={firstHref} className={'px-3 py-1.5 rounded-md text-sm no-underline ' + (isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100')}>{s.label}</Link>
          );
        })}
      </div>
      {activeStage && (
        <div className="flex gap-1 items-center bg-gray-50 rounded-md px-2 py-1 flex-wrap">
          {activeStage.tools.map((t) => {
            const isActive = isPath(t.href);
            return (
              <Link key={t.href} href={t.href} className={'relative px-2.5 py-1 rounded text-xs no-underline ' + (isActive ? 'bg-white text-indigo-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-white')}>
                {t.icon} {t.label}
                {t.href === '/leads' && newLeads > 0 && (<span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{newLeads}</span>)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
