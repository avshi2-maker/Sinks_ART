'use client';
// src/components/case/GenFields.tsx · updated 23.09.2026 10:36 (Asia/Jerusalem)
// Editable case file (everything Claude generated). Every field can be changed by hand before publishing.

import type { CaseGen, CaseFaq } from '@/lib/case/caseTypes';
import { wordCount, storyText } from '@/lib/case/gates';

const lab = 'text-[11px] font-semibold text-stone-600 flex justify-between';
const inp = 'w-full text-sm border border-stone-300 rounded-md px-2 py-1.5 bg-white';
const ta = inp + ' min-h-[110px] leading-relaxed';
const box = 'bg-white border border-stone-200 rounded-lg p-3 flex flex-col gap-2';

interface Props { gen: CaseGen; setGen: (g: CaseGen) => void; imageUrls: string[]; slugLocked: boolean }

export default function GenFields({ gen, setGen, imageUrls, slugLocked }: Props) {
  const set = (k: keyof CaseGen, v: unknown) => setGen({ ...gen, [k]: v });
  const faq = gen.faq || [];
  const alt = gen.alt || [];
  const setFaq = (i: number, k: keyof CaseFaq, v: string) => set('faq', faq.map((f, j) => (j === i ? { ...f, [k]: v } : f)));
  const setAlt = (i: number, v: string) => { const a = [...alt]; while (a.length < imageUrls.length) a.push(''); a[i] = v; set('alt', a); };
  const social = gen.social || {};

  return (
    <div className="flex flex-col gap-3">
      <div className={box}>
        <label className={lab}><span>כותרת SEO</span><span dir="ltr">{(gen.title || '').length}/60</span></label>
        <input className={inp} value={gen.title || ''} onChange={(e) => set('title', e.target.value)} />
        <label className={lab}><span>כתובת (slug){slugLocked ? ' · נעולה — העמוד כבר פורסם' : ''}</span></label>
        <input className={inp + ' font-mono'} dir="ltr" value={gen.slug || ''} disabled={slugLocked} onChange={(e) => set('slug', e.target.value.toLowerCase())} />
        <label className={lab}><span>תיאור מטא</span><span dir="ltr">{(gen.meta || '').length}/155</span></label>
        <textarea className={inp + ' min-h-[60px]'} value={gen.meta || ''} onChange={(e) => set('meta', e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <div><label className={lab}><span>חומר</span></label><input className={inp} value={gen.material || ''} onChange={(e) => set('material', e.target.value)} /></div>
          <div><label className={lab}><span>מידה</span></label><input className={inp} value={gen.size || ''} onChange={(e) => set('size', e.target.value)} /></div>
        </div>
      </div>

      <div className={box}>
        <div className="text-sm font-semibold text-stone-800">📝 הסיפור · {wordCount(storyText(gen))} מילים</div>
        <label className={lab}><span>תקציר</span></label>
        <textarea className={inp + ' min-h-[70px]'} value={gen.summary || ''} onChange={(e) => set('summary', e.target.value)} />
        <label className={lab}><span>האתגר</span></label>
        <textarea className={ta} value={gen.challenge || ''} onChange={(e) => set('challenge', e.target.value)} />
        <label className={lab}><span>התהליך</span></label>
        <textarea className={ta} value={gen.process || ''} onChange={(e) => set('process', e.target.value)} />
        <label className={lab}><span>התוצאה</span></label>
        <textarea className={ta} value={gen.result || ''} onChange={(e) => set('result', e.target.value)} />
      </div>

      <div className={box}>
        <div className="text-sm font-semibold text-stone-800">❓ שאלות נפוצות</div>
        {faq.map((f, i) => (
          <div key={i} className="flex flex-col gap-1 border-b border-stone-100 pb-2">
            <input className={inp + ' font-medium'} value={f.q} onChange={(e) => setFaq(i, 'q', e.target.value)} />
            <textarea className={inp + ' min-h-[56px]'} value={f.a} onChange={(e) => setFaq(i, 'a', e.target.value)} />
          </div>
        ))}
        <button type="button" className="text-xs self-start px-2 py-1 border border-stone-300 rounded" onClick={() => set('faq', [...faq, { q: '', a: '' }])}>＋ שאלה</button>
      </div>

      <div className={box}>
        <div className="text-sm font-semibold text-stone-800">🖼️ ALT לתמונות (לפי סדר ההופעה בעמוד)</div>
        {imageUrls.map((u, i) => (
          <div key={u + i} className="flex gap-2 items-center">
            <img src={u} alt="" className="w-12 h-12 object-cover rounded shrink-0" />
            <input className={inp} value={alt[i] || ''} onChange={(e) => setAlt(i, e.target.value)} />
          </div>
        ))}
      </div>

      <div className={box}>
        <label className={lab}><span>תגיות (מופרדות בפסיק)</span></label>
        <input className={inp} value={(gen.tags || []).join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />
        <div className="text-sm font-semibold text-stone-800 mt-1">📣 טקסטים לרשתות ({'{URL}'} יוחלף בקישור לעמוד)</div>
        <label className={lab}><span>Instagram</span></label>
        <textarea className={inp + ' min-h-[80px]'} value={social.ig || ''} onChange={(e) => set('social', { ...social, ig: e.target.value })} />
        <label className={lab}><span>Facebook</span></label>
        <textarea className={inp + ' min-h-[70px]'} value={social.fb || ''} onChange={(e) => set('social', { ...social, fb: e.target.value })} />
        <label className={lab}><span>Pinterest</span></label>
        <textarea className={inp + ' min-h-[56px]'} value={social.pin || ''} onChange={(e) => set('social', { ...social, pin: e.target.value })} />
      </div>
    </div>
  );
}
