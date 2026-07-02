// src/app/sketch-to-offer/page.tsx
// The pricing engine tab — from a saved sketch to a full customer offer + Ales sheet.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { fetchDemos } from '@/lib/demos/demosData';
import { fetchMaterialSettings } from '@/lib/offers/materialSettings';
import { fetchAlesCostSettings } from '@/lib/pricing/alesCostData';
import PricingEngineTab, { type SketchOption } from '@/components/pricing/PricingEngineTab';

export default async function SketchToOfferPage({ searchParams }: { searchParams: Promise<{ sketch?: string }> }) {
  const { sketch } = await searchParams;
  const [demos, materialSettings, costSettings] = await Promise.all([
    fetchDemos(),
    fetchMaterialSettings(),
    fetchAlesCostSettings(),
  ]);

  const sketches: SketchOption[] = demos
    .filter((d) => d.kind === 'sketch' && !!d.sketch_svg)
    .map((d) => ({
      id: d.id,
      title: d.title_he || 'שרטוט',
      spec: d.inputs_jsonb,
    }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-stone-200">
        <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🧮</div>
        <div>
          <h1 className="text-xl font-semibold text-stone-800">משרטוט להצעת מחיר</h1>
          <p className="text-xs text-stone-500">זמן + חומר · עלות אמת → הצעת בסיס → פרמיה → הצעה סופית</p>
        </div>
      </div>
      <PricingEngineTab sketches={sketches} materialSettings={materialSettings} costSettings={costSettings} preselectId={sketch} />
    </div>
  );
}
