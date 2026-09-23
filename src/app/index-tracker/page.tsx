// src/app/index-tracker/page.tsx · updated 23.09.2026 13:07 (Asia/Jerusalem)
// Google indexing tracker — every public URL of marble-art.co.il, synced from the live sitemap.

import Link from 'next/link';
import { fetchTrackedUrls, GSC_PROPERTY, SITEMAP_URL } from '@/lib/seo/indexTracker';
import IndexTracker from '@/components/seo/IndexTracker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const how = 'text-xs text-stone-600 bg-amber-50 border border-amber-200 rounded-md p-3 leading-relaxed';

export default async function IndexTrackerPage() {
  const { rows, error } = await fetchTrackedUrls();
  const fresh = rows.filter((r) => r.status === 'new').length;
  const projects = rows.filter((r) => r.kind === 'project').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4" dir="rtl">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-stone-100 flex items-center justify-center text-xl">🔎</div>
          <div>
            <div className="text-lg font-medium text-stone-900">אינדוקס בגוגל ובבינג</div>
            <div className="text-xs text-stone-500">{rows.length} כתובות באתר · {fresh} חדשות לשליחה · {projects} עמודי פרויקט</div>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 no-underline hover:underline">← חזרה ללוח הבקרה</Link>
      </div>

      <div className={how}>
        <b>איך עובדים:</b> כל עמוד חדש באתר (כולל כל תיק פרויקט שמתפרסם) מופיע כאן אוטומטית תחת &quot;חדשים&quot;.
        לוחצים 🔍 Search Console → &quot;Request indexing&quot; בגוגל → חוזרים ולוחצים 📨 סמן נשלח.
        אחרי כמה ימים לוחצים 🌐 בדוק בגוגל, ואם העמוד מופיע — ✅ סמן מאונדקס. גוגל מגביל בערך 10 בקשות אינדוקס ביום, אז עדיף פרויקטים קודם.
        <br /><b>בינג:</b> 🅱️ שלח לבינג שולח מיד ב-IndexNow (בלי הגבלה מעשית, מגיע גם ל-ChatGPT ו-Copilot). כל פרסום תיק פרויקט נשלח לבינג אוטומטית.
      </div>

      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-md p-3">{error}</div>}

      <IndexTracker rows={rows} gscProperty={GSC_PROPERTY} sitemapUrl={SITEMAP_URL} />
    </div>
  );
}
