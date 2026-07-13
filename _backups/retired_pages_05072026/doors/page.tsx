// src/app/doors/page.tsx
// Phase 37 Step 3 — public flush-to-zero door configurator page (/doors).

import { fetchActiveDoorStones } from '@/lib/doors/doorCatalogData';
import DoorConfigurator from '@/components/doors/DoorConfigurator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DoorsPage() {
  const stones = await fetchActiveDoorStones();
  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      <DoorConfigurator stones={stones} />
    </div>
  );
}
