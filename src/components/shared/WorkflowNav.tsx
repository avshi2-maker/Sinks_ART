'use client';
// src/components/shared/WorkflowNav.tsx
// Two-level nav: top bar = workflow areas, second row = tools in the active area.
// Reorganized into 6 logical areas (workflow-ordered, daily-core first).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export interface NavTool { href: string; label: string; icon: string; }
export interface NavStage { id: string; label: string; tools: NavTool[]; }
export const STAGES: NavStage[] = [
  // DAILY CORE — where Avshi lives day-to-day
  { id: 'jobs', label: 'עבודות', tools: [
    { href: '/pipeline', label: 'צנרת עבודות', icon: '🔧' },
    { href: '/sinc', label: 'שיחות', icon: '🎙️' },
    { href: '/intake', label: 'מדיה', icon: '📸' },
    { href: '/leads', label: 'פניות', icon: '📥' },
  ] },
  // RELATIONSHIPS
  { id: 'people', label: 'לקוחות', tools: [
    { href: '/customers', label: 'לקוחות', icon: '👥' },
    { href: '/suppliers', label: 'ספקים', icon: '🏭' },
    { href: '/sites', label: 'אתרים', icon: '🏨' },
  ] },
  // DESIGN / VISUALIZE
  { id: 'design', label: 'עיצוב והדמיה', tools: [
    { href: '/sketch', label: 'שרטוט', icon: '📐' },
    { href: '/prompt-builder', label: 'הדמיה', icon: '🖼️' },
    { href: '/demos', label: 'גלריה', icon: '🎨' },
  ] },
  // OFFERS & PRODUCTION — all offer tools together, in flow order
  { id: 'offers', label: 'הצעות וייצור', tools: [
    { href: '/rfq-create', label: 'RFQ לאלס', icon: '🏭' },
    { href: '/arvo-offer', label: 'הצעת ARVO', icon: '📄' },
    { href: '/offers-sent', label: 'הצעות שנשלחו', icon: '📌' },
    { href: '/quotes', label: 'הצעות', icon: '🧾' },
    { href: '/po', label: 'הזמנות ייצור', icon: '📋' },
  ] },
  // REFERENCE DATA
  { id: 'catalogs', label: 'קטלוגים ונתונים', tools: [
    { href: '/marble', label: 'שיש', icon: '🪨' },
    { href: '/options', label: 'מחירון ותוספות', icon: '📖' },
    { href: '/roi', label: 'ROI', icon: '📊' },
  ] },
];
export default function WorkflowNav({ newLeads = 0 }: { newLeads?: number }) {
  const pathname = usePathname();
  const activeStage = STAGES.find((s) => s.tools.some((t) => pathname.startsWith(t.href))) || null;
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
            const isActive = pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={'relative px-2.5 py-1 rounded text-xs no-underline ' + (isActive ? 'bg-white text-indigo-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-white')}>
                <span aria-hidden="true">{t.icon}</span> {t.label}
                {t.href === '/leads' && newLeads > 0 && (<span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{newLeads}</span>)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
