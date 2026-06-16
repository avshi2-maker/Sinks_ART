'use client';

// src/components/sketch/SketchBuilder.tsx
// Spec form + live technical-sketch preview + download/print. RTL Hebrew.

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPO } from '@/lib/po/poData';
import { MarbleSwatch } from '@/lib/marble/marbleData';
import { renderSinkSketch, SketchSpec, SketchShape, SketchMount, SketchDrain } from '@/lib/sketch/sketchRenderer';

const SHAPES: { v: SketchShape; he: string }[] = [
  { v: 'rectangle', he: 'מלבן' },
  { v: 'square', he: 'ריבוע' },
  { v: 'triangle', he: 'משולש' },
  { v: 'trapezoid', he: 'טרפז' },
  { v: 'pentagon', he: 'מחומש' },
  { v: 'custom', he: 'חופשי' },
];

export interface SketchBuilderProps { initial?: Partial<SketchSpec>; swatches?: MarbleSwatch[]; }

const DEFAULTS: SketchSpec = {
  modelName: 'כיור שיש', shape: 'rectangle',
  lengthMm: 600, widthMm: 400, heightMm: 150, basinDepthMm: 120, wallThicknessMm: 20,
  mount: 'wall', tapHole: false, drain: 'round', exteriorStone: '', interiorStone: '', pitchPct: 1.5,
  wallLeftMm: 20, wallRightMm: 20, pitchLeftPct: 1.5, pitchRightPct: 1.5, drainRadiusMm: 0, stoneSiphonCover: false, basinCount: 1,
};

export default function SketchBuilder({ initial, swatches = [] }: SketchBuilderProps) {
  const router = useRouter();
  const [poBusy, setPoBusy] = useState(false);
  const [cmIn, setCmIn] = useState(0);
  const [spec, setSpec] = useState<SketchSpec>({ ...DEFAULTS, ...initial });
  const svg = useMemo(() => renderSinkSketch(spec), [spec]);

  function set<K extends keyof SketchSpec>(key: K, val: SketchSpec[K]) {
    setSpec((p) => ({ ...p, [key]: val }));
  }

  function downloadPng() {
    const d = new Date();
    const stamp = String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + d.getFullYear();
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600; canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sketch_' + (spec.modelName || 'sink').replace(/\s+/g, '_') + '_' + stamp + '.png';
        a.click();
      }, 'image/png');
    };
    img.src = url;
  }

  function downloadSvg() {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const stamp = String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + d.getFullYear();
    a.href = url;
    a.download = 'sketch_' + (spec.modelName || 'sink').replace(/\s+/g, '_') + '_' + stamp + '.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  function printSketch() {
    const w = window.open('', '_blank');
    if (!w) return;
    const m = svg.match(/viewBox="([\d.\s-]+)"/);
    let landscape = false;
    if (m && m[1]) {
      const pp = m[1].trim().split(/\s+/).map(Number);
      if (pp.length === 4 && pp[2] > pp[3]) landscape = true;
    }
    const pageSize = landscape ? 'A4 landscape' : 'A4 portrait';
    const sheetW = landscape ? '277mm' : '190mm';
    const sheetH = landscape ? '190mm' : '277mm';
    const css = '@page { size: ' + pageSize + '; margin: 10mm; } * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; } html, body { margin: 0; padding: 0; } .sheet { width: ' + sheetW + '; height: ' + sheetH + '; display: flex; align-items: center; justify-content: center; page-break-inside: avoid; break-inside: avoid; } .sheet svg { width: 100%; height: 100%; max-width: 100%; max-height: 100%; }';
    const title = spec.modelName || 'שרטוט';
    w.document.write('<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>' + title + '</title><style>' + css + '</style></head><body><div class="sheet">' + svg + '</div></body></html>');
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  }

  async function sendToPO() {
    setPoBusy(true);
    const res = await createPO({
      sketchSpec: spec as unknown as Record<string, unknown>,
      sketchSvg: svg,
    });
    setPoBusy(false);
    if (!res.ok || !res.id) { window.alert('יצירת הזמנה נכשלה: ' + (res.error || '')); return; }
    router.push('/po/' + res.id);
  }

  function whatsappToAles() {
    const wallTxt = (spec.wallLeftMm ?? spec.wallThicknessMm) + '/' + (spec.wallRightMm ?? spec.wallThicknessMm);
    const pitchTxt = (spec.pitchLeftPct ?? spec.pitchPct ?? 0) + '%/' + (spec.pitchRightPct ?? spec.pitchPct ?? 0) + '%';
    const drainTxt = (spec.drain === 'linear' ? 'תעלה' : 'עגול') + (spec.drainRadiusMm ? ' R' + spec.drainRadiusMm : '');
    const siphonTxt = spec.stoneSiphonCover ? 'מאבן תואמת' : 'סטנדרטי';
    const lines = [
      'שרטוט ייצור: ' + spec.modelName,
      'צורה: ' + (SHAPES.find((s) => s.v === spec.shape)?.he || ''),
      'מידות: ' + spec.lengthMm + '×' + spec.widthMm + '×' + spec.heightMm + ' מ"מ',
      'דפנות קצה (שמ/ימ): ' + wallTxt + ' מ"מ · שיפוע (שמ/ימ): ' + pitchTxt,
      'חוץ: ' + spec.exteriorStone + ' · פנים: ' + spec.interiorStone,
      'ניקוז: ' + drainTxt + ' · סיפון: ' + siphonTxt,
      'ברז: ' + (spec.tapHole ? 'כן' : 'לא') + ' · התקנה: ' + (spec.mount === 'wall' ? 'קיר' : 'משטח'),
    ];
    const txt = encodeURIComponent(lines.join('\n'));
    window.open('https://api.whatsapp.com/send?text=' + txt, '_blank');
  }

  const numField = (label: string, key: keyof SketchSpec) => (
    <label className="block">
      <span className="block text-xs font-medium text-stone-600 mb-1">{label}</span>
      <input type="number" value={spec[key] as number} onChange={(e) => set(key, (Number(e.target.value) || 0) as never)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
    </label>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" dir="rtl">
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <div className="text-xs font-semibold text-amber-800 mb-1">ממיר ס"מ ← מ"מ (מהתמונה בוואטסאפ)</div>
          <div className="flex items-center gap-2">
            <input type="number" value={cmIn} onChange={(e) => setCmIn(Number(e.target.value) || 0)} placeholder='ס"מ' className="w-24 px-2 py-1 text-sm border border-amber-300 rounded-md" dir="ltr" />
            <span className="text-amber-700 text-sm">ס"מ =</span>
            <span className="font-mono font-semibold text-amber-900">{(cmIn * 10).toLocaleString()} מ"מ</span>
          </div>
          <div className="text-[11px] text-amber-600 mt-1">לדוגמה: 213 ס"מ = 2130 מ"מ · 45 ס"מ = 450 מ"מ</div>
        </div>
        <label className="block">
          <span className="block text-xs font-medium text-stone-600 mb-1">שם הדגם</span>
          <input value={spec.modelName} onChange={(e) => set('modelName', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-stone-600 mb-1">צורה</span>
          <select value={spec.shape} onChange={(e) => set('shape', e.target.value as SketchShape)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
            {SHAPES.map((s) => (<option key={s.v} value={s.v}>{s.he}</option>))}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {numField('אורך (מ"מ)', 'lengthMm')}
          {numField('רוחב (מ"מ)', 'widthMm')}
          {numField('גובה (מ"מ)', 'heightMm')}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {numField('עומק אגן', 'basinDepthMm')}
          {numField('עובי תחתית', 'wallThicknessMm')}
          {numField('רדיוס ניקוז R', 'drainRadiusMm')}
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-md p-2 space-y-2">
          <div className="text-xs font-semibold text-stone-700">דפנות קצה ושיפועים (לפי שרטוט הלקוח)</div>
          <div className="grid grid-cols-2 gap-2">
            {numField('דופן קצה שמאל (מ"מ)', 'wallLeftMm')}
            {numField('דופן קצה ימין (מ"מ)', 'wallRightMm')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="block text-xs font-medium text-stone-600 mb-1">שיפוע שמאל %</span><input type="number" step="0.1" value={spec.pitchLeftPct ?? 0} onChange={(e) => set('pitchLeftPct', Number(e.target.value) || 0)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" /></label>
            <label className="block"><span className="block text-xs font-medium text-stone-600 mb-1">שיפוע ימין %</span><input type="number" step="0.1" value={spec.pitchRightPct ?? 0} onChange={(e) => set('pitchRightPct', Number(e.target.value) || 0)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" /></label>
          </div>
          {spec.shape === 'trapezoid' && (<div className="grid grid-cols-2 gap-2">{numField('אורך אחורי', 'backLengthMm')}<div /></div>)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">התקנה</span>
            <select value={spec.mount} onChange={(e) => set('mount', e.target.value as SketchMount)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
              <option value="wall">תלוי קיר</option>
              <option value="countertop">על משטח</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">ניקוז</span>
            <select value={spec.drain} onChange={(e) => set('drain', e.target.value as SketchDrain)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
              <option value="round">עגול</option>
              <option value="linear">תעלה</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={spec.tapHole} onChange={(e) => set('tapHole', e.target.checked)} />
          <span>חור ברז על הכיור</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={!!spec.stoneSiphonCover} onChange={(e) => set('stoneSiphonCover', e.target.checked)} />
          <span>סיפון מאבן תואמת</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={(spec.basinCount ?? 1) >= 2} onChange={(e) => set('basinCount', (e.target.checked ? 2 : 1) as never)} />
          <span>כיור כפול (2 אגנים · 2 ניקוזים)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">שיש חוץ (sample A)</span>
            <input value={spec.exteriorStone} onChange={(e) => set('exteriorStone', e.target.value)} placeholder="קרארה" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            {swatches.length > 0 && (<div className="flex gap-1 overflow-x-auto mt-1 pb-1">{swatches.map((sw) => (<button key={sw.id} type="button" title={sw.name_en} onClick={() => set('exteriorStone', sw.name_he || sw.name_en)} className={'shrink-0 w-9 h-9 rounded border-2 overflow-hidden ' + (spec.exteriorStone === (sw.name_he || sw.name_en) ? 'border-blue-500' : 'border-transparent')}><img src={sw.image_url} alt={sw.name_en} className="w-full h-full object-cover" /></button>))}</div>)}
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">שיש פנים (sample B)</span>
            <input value={spec.interiorStone} onChange={(e) => set('interiorStone', e.target.value)} placeholder="נרו מרקינה" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            {swatches.length > 0 && (<div className="flex gap-1 overflow-x-auto mt-1 pb-1">{swatches.map((sw) => (<button key={sw.id} type="button" title={sw.name_en} onClick={() => set('interiorStone', sw.name_he || sw.name_en)} className={'shrink-0 w-9 h-9 rounded border-2 overflow-hidden ' + (spec.interiorStone === (sw.name_he || sw.name_en) ? 'border-blue-500' : 'border-transparent')}><img src={sw.image_url} alt={sw.name_en} className="w-full h-full object-cover" /></button>))}</div>)}
          </label>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <button onClick={downloadPng} className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">🖼️ הורד PNG (לוואטסאפ)</button>
          <button onClick={downloadSvg} className="text-sm px-4 py-1.5 bg-stone-500 text-white rounded-md hover:bg-stone-600">⬇️ SVG</button>
          <button onClick={printSketch} className="text-sm px-4 py-1.5 bg-stone-700 text-white rounded-md hover:bg-stone-800">🖨️ הדפס / PDF</button>
          <button onClick={whatsappToAles} className="text-sm px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700">💬 שלח לאלס</button>
          <button onClick={sendToPO} disabled={poBusy} className="text-sm px-4 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50">📋 {poBusy ? 'יוצר...' : 'צור הזמנת ייצור'}</button>
        </div>
      </div>
      <div className="border border-stone-200 rounded-lg p-2 bg-white" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}


