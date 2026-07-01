// src/app/material-calc/page.tsx
// Standalone material calculator — sink dimensions to Trabelsi porcelain cost.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { fetchMaterialSettings } from '@/lib/offers/materialSettings';
import MaterialCalculator from '@/components/offers/MaterialCalculator';

export default async function MaterialCalcPage() {
  const settings = await fetchMaterialSettings();
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-stone-200">
        <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">📐</div>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">מחשבון חומר — פורצלן</h1>
          <p className="text-xs text-stone-500">פריסת הכיור ללוחות שטוחים → מ"ר → לוחות → עלות טרבלסי. העתק לבונה ההצעה.</p>
        </div>
      </div>
      <MaterialCalculator settings={settings} />
    </div>
  );
}
