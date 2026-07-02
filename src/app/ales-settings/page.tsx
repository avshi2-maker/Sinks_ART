// src/app/ales-settings/page.tsx
// Ales cost settings — the master editable record behind the pricing engine.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { fetchAlesCostSettings } from '@/lib/pricing/alesCostData';
import AlesCostSettingsForm from '@/components/pricing/AlesCostSettingsForm';

export default async function AlesSettingsPage() {
  const settings = await fetchAlesCostSettings();
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-stone-200">
        <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">⚙️</div>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">הגדרות עלויות אלס</h1>
          <p className="text-xs text-stone-500">בסיס התמחור · שקוף לאלס · כל שינוי מתעדכן בכל הצעת מחיר חדשה</p>
        </div>
      </div>
      <AlesCostSettingsForm initial={settings} />
    </div>
  );
}
