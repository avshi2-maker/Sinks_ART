// src/app/sketch/page.tsx
// Sketch builder — technical shop drawing generator for Ales.
// Supports ?load=<sketchId> to re-open a saved sketch's sizes for editing (saves as a NEW sketch).
import Link from 'next/link';
import SketchBuilder from '@/components/sketch/SketchBuilder';
import { fetchSwatches } from '@/lib/marble/marbleData';
import { fetchSketchSpec } from '@/lib/demos/demosData';
import { fetchCustomersList } from '@/lib/customers/fetchCustomersList';
import type { SketchSpec } from '@/lib/sketch/sketchRenderer';
import type { PickerItem } from '@/components/shared/EntityPicker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SketchPage({ searchParams }: { searchParams: Promise<{ load?: string; customer?: string }> }) {
  const sp = await searchParams;
  const loadId = sp?.load || '';
  const [swatches, customers] = await Promise.all([fetchSwatches(), fetchCustomersList()]);
  const customerItems: PickerItem[] = customers.map((c) => ({
    id: c.id,
    label: c.name_he || c.name_en || '(ללא שם)',
    sublabel: c.phone,
  }));
  const initialCustomerId = sp?.customer || '';
  const initialCustomerLabel = customerItems.find((c) => c.id === initialCustomerId)?.label || '';

  let initial: Partial<SketchSpec> | undefined = undefined;
  let editingTitle = '';
  if (loadId) {
    const loaded = await fetchSketchSpec(loadId);
    if (loaded) {
      initial = loaded.spec as Partial<SketchSpec>;
      editingTitle = loaded.title_he || '';
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">📐</div>
          <div>
            <div className="text-lg font-medium text-stone-900">שרטוט ייצור</div>
            <div className="text-xs text-stone-500">מבט על + חתך צד · להעברה לאלס</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>
      {initial && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-800">
          ✏️ עריכת שרטוט שמור{editingTitle ? ': ' + editingTitle : ''} — שינוי המידות יישמר כשרטוט <span className="font-semibold">חדש</span>. השרטוט המקורי נשמר.
        </div>
      )}
      <SketchBuilder
        initial={initial}
        swatches={swatches}
        customers={customerItems}
        initialCustomerId={initialCustomerId}
        initialCustomerLabel={initialCustomerLabel}
      />
    </div>
  );
}
