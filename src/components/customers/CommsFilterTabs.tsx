'use client';

// src/components/customers/CommsFilterTabs.tsx
// Phase 19 Stage B step 3 - Filter tabs above the comms timeline.
// Uses URL search param ?type=... so refresh preserves selection.

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type CommFilterValue = 'all' | 'call' | 'photo' | 'mp4' | 'whatsapp' | 'email' | 'meeting' | 'other';

interface TabDef {
  value: CommFilterValue;
  label: string;
  icon:  string;
}

const TABS: TabDef[] = [
  { value: 'all',      label: 'הכל',       icon: '📋' },
  { value: 'call',     label: 'שיחות',     icon: '📞' },
  { value: 'photo',    label: 'תמונות',    icon: '📸' },
  { value: 'mp4',      label: 'סרטונים',   icon: '🎬' },
  { value: 'whatsapp', label: 'וואטסאפ',   icon: '💬' },
  { value: 'email',    label: 'מייל',      icon: '📧' },
  { value: 'meeting',  label: 'פגישות',    icon: '🤝' },
  { value: 'other',    label: 'אחר',       icon: '📌' },
];

interface Props {
  // Optional counts per type (rendered as small number badge next to tab)
  counts?: Partial<Record<CommFilterValue, number>>;
  totalCount: number;
}

export default function CommsFilterTabs({ counts, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = (searchParams.get('type') as CommFilterValue) || 'all';

  function selectTab(value: CommFilterValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('type');
    } else {
      params.set('type', value);
    }
    const query = params.toString();
    router.push(pathname + (query ? '?' + query : ''));
  }

  function tabCount(t: CommFilterValue): number {
    if (t === 'all') return totalCount;
    return counts?.[t] ?? 0;
  }

  return (
    <div className="flex flex-wrap gap-1 mb-4 pb-2 border-b border-stone-200">
      {TABS.map((tab) => {
        const isActive = current === tab.value;
        const count = tabCount(tab.value);
        // Hide tabs with zero count, EXCEPT "all" which always shows
        if (tab.value !== 'all' && count === 0) return null;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => selectTab(tab.value)}
            className={
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ' +
              (isActive
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200')
            }
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={
              'inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0 rounded-full text-xs ' +
              (isActive ? 'bg-blue-700 text-blue-100' : 'bg-stone-200 text-stone-600')
            }>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
