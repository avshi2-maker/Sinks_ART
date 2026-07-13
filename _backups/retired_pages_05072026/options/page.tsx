// src/app/options/page.tsx
// Phase 28 — options catalog (price book) editor. Grouped by chapter.

import Link from 'next/link';
import { fetchOptions } from '@/lib/options/optionsCatalog';
import OptionRowEditor from '@/components/options/OptionRowEditor';
import AddOptionForm from '@/components/options/AddOptionForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHAPTER_ORDER = ['אבזור ומתקנים', 'ברזים', 'תאורה', 'הרחבות אבן', 'גימור'];

export default async function OptionsPage() {
  const rows = await fetchOptions();

  const byChapter = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byChapter.get(r.chapter) || [];
    list.push(r);
    byChapter.set(r.chapter, list);
  }
  const chapters = [
    ...CHAPTER_ORDER.filter((c) => byChapter.has(c)),
    ...[...byChapter.keys()].filter((c) => !CHAPTER_ORDER.includes(c)),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">📖</div>
          <div>
            <div className="text-base font-medium text-stone-900">מחירון תוספות <span className="text-stone-400 font-normal">({rows.length})</span></div>
            <div className="text-xs text-stone-500">עלות, מחיר ללקוח והערה לכל פריט — נשמר לשימוש חוזר בהצעות</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>

      <AddOptionForm />
      {rows.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-8 text-center text-sm text-stone-500">המחירון ריק.</div>
      ) : (
        <div className="space-y-6">
          {chapters.map((chapter) => (
            <section key={chapter}>
              <h2 className="text-sm font-semibold text-stone-700 mb-2">{chapter}</h2>
              <div className="space-y-2">
                {(byChapter.get(chapter) || []).map((row) => (
                  <OptionRowEditor key={row.id} row={row} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
