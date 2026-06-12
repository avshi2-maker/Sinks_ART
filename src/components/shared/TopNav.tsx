import Link from 'next/link';
import WorkflowNav from './WorkflowNav';
import { fetchMonthCost } from '@/lib/shared/fetchMonthCost';
import { countNewLeads } from '@/lib/leads/leadsData';
import ExitButton from './ExitButton';

export default async function TopNav() {
  let cost = { totalUsd: 0, monthLabel: '' };
  try { cost = await fetchMonthCost(); } catch (e) { console.error('[TopNav] fetchMonthCost failed:', e); }
  let newLeads = 0;
  try { newLeads = await countNewLeads(); } catch (e) { console.error('[TopNav] countNewLeads failed:', e); }
  const formattedCost = '$' + cost.totalUsd.toFixed(2);
  return (
    <nav dir="rtl" className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-2">
      <div className="max-w-6xl mx-auto flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 no-underline text-gray-900 font-medium pt-1">
            <span aria-hidden="true">💎</span>
            <span className="text-sm whitespace-nowrap">Marble Art</span>
          </Link>
          <WorkflowNav newLeads={newLeads} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full">
            <span className="text-xs text-indigo-700" aria-hidden="true">💰</span>
            <span className="text-xs text-indigo-700">{cost.monthLabel || 'החודש'}</span>
            <span className="text-sm font-medium text-indigo-900">{formattedCost}</span>
          </div>
          <ExitButton />
        </div>
      </div>
    </nav>
  );
}
