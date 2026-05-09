/**
 * src/components/shared/TopNav.tsx
 *
 * Top navigation bar — consistent across /dashboard, /sinc, /intake,
 * /customers/[id]. NOT shown on the public marketing landing at /.
 *
 * Server component: fetches this month's API cost server-side and renders.
 * Active-link highlighting is handled by TopNavLink (client component).
 *
 * Phase 18 — Top navigation bar (Session 21, 09/05/2026)
 */

import Link from 'next/link';
import TopNavLink from './TopNavLink';
import { fetchMonthCost } from '@/lib/shared/fetchMonthCost';

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'דשבורד', icon: '🏠' },
  { href: '/sinc',       label: 'שיחות',  icon: '🎙️' },
  { href: '/intake',     label: 'מדיה',   icon: '📸' },
  { href: '/customers',  label: 'לקוחות', icon: '👥' },
];

export default async function TopNav() {
  // Fetch cost server-side; fall back to zero if Supabase is briefly unreachable
  let cost = { totalUsd: 0, monthLabel: '' };
  try {
    cost = await fetchMonthCost();
  } catch (e) {
    // Don't break the nav if cost fetch fails — render with placeholder
    console.error('[TopNav] fetchMonthCost failed:', e);
  }

  const formattedCost = '$' + cost.totalUsd.toFixed(2);

  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-2"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Right side: logo + nav links */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 no-underline text-gray-900 font-medium">
            <span aria-hidden="true">💎</span>
            <span className="text-sm">Marble Art</span>
          </Link>
          <div className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <TopNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </div>
        </div>

        {/* Left side: monthly cost chip */}
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full">
          <span className="text-xs text-indigo-700" aria-hidden="true">💰</span>
          <span className="text-xs text-indigo-700">{cost.monthLabel || 'החודש'}</span>
          <span className="text-sm font-medium text-indigo-900">{formattedCost}</span>
        </div>
      </div>
    </nav>
  );
}
