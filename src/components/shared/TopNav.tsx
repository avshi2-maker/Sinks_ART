import Link from 'next/link';
import TopNavLink from './TopNavLink';
import { fetchMonthCost } from '@/lib/shared/fetchMonthCost';
import { countNewLeads } from '@/lib/leads/leadsData';
import ExitButton from './ExitButton';

const NAV_ITEMS = [
  { href: '/dashboard',      label: 'דשבורד', icon: '🏠' },
  { href: '/sinc',           label: 'שיחות',  icon: '🎙️' },
  { href: '/intake',         label: 'מדיה',   icon: '📸' },
  { href: '/customers',      label: 'לקוחות', icon: '👥' },
  { href: '/leads',          label: 'פניות',  icon: '📥' },
  { href: '/prompt-builder', label: 'הדמיה',  icon: '🖼️' },
  { href: '/demos',          label: 'גלריה',  icon: '🎨' },
  { href: '/sketch',         label: 'שרטוט',  icon: '📐' },
  { href: '/marble',         label: 'שיש',    icon: '🪨' },
  { href: '/po',             label: 'הזמנות', icon: '📋' },
  { href: '/options',        label: 'מחירון', icon: '📖' },
  { href: '/quotes',         label: 'הצעות',  icon: '🧾' },
  { href: '/sites',          label: 'אתרים',  icon: '🏨' },
  { href: '/roi',            label: 'ROI',    icon: '📊' },
];

export default async function TopNav() {
  let cost = { totalUsd: 0, monthLabel: '' };
  try { cost = await fetchMonthCost(); } catch (e) { console.error('[TopNav] fetchMonthCost failed:', e); }
  let newLeads = 0;
  try { newLeads = await countNewLeads(); } catch (e) { console.error('[TopNav] countNewLeads failed:', e); }
  const formattedCost = '$' + cost.totalUsd.toFixed(2);
  return (
    <nav dir="rtl" className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-2">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 no-underline text-gray-900 font-medium">
            <span aria-hidden="true">💎</span>
            <span className="text-sm">Marble Art</span>
          </Link>
          <div className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <TopNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} badge={item.href === '/leads' ? newLeads : undefined} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full">
          <span className="text-xs text-indigo-700" aria-hidden="true">💰</span>
          <span className="text-xs text-indigo-700">{cost.monthLabel || 'החודש'}</span>
          <span className="text-sm font-medium text-indigo-900">{formattedCost}</span>
        </div>
        <ExitButton />
      </div>
    </nav>
  );
}