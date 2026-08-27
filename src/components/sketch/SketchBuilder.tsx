'use client';

// src/components/sketch/SketchBuilder.tsx
// Spec form + live technical-sketch preview + download/print. RTL Hebrew.
// N-basin rebuild: basin count 1..10, editable split, and two customer-selectable options —
//   floor: משופע / ישר 90°   ·   drainage: אגנים נפרדים / תעלה משותפת (ניקוז אחד).

import { useMemo, useState } from 'react';
import SaveSketchToGallery from '@/components/sketch/SaveSketchToGallery';
import { useRouter } from 'next/navigation';
import { createPO } from '@/lib/po/poData';
import { MarbleSwatch } from '@/lib/marble/marbleData';
import {
  renderSinkSketch, sanitizeSpec, resolveBasins, estimateCentralDrain,
  SketchSpec, SketchShape, SketchMount, SketchDrain, FloorType, DrainMode,
} from '@/lib/sketch/sketchRenderer';

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
  modelName: '', shape: 'rectangle',
  lengthMm: 0, widthMm: 0, heightMm: 0, basinDepthMm: 0, wallThicknessMm: 0,
  mount: 'wall', tapHole: false, drain: 'round', exteriorStone: '', interiorStone: '', pitchPct: 2,
  wallLeftMm: 30, wallRightMm: 30, pitchLeftPct: 2, pitchRightPct: 2, drainRadiusMm: 0,
  stoneSiphonCover: false, basinCount: 1,
  floorType: 'pitched', drainMode: 'perBasin', dividerMm: 40,
};

export default function SketchBuilder({ initial, swatches = [] }: SketchBuilderProps) {
  const router = useRouter();
  const [poBusy, setPoBusy] = useState(false);
  const [cmIn, setCmIn] = useState(0);
  const [spec, setSpec] = useState<SketchSpec>({ ...DEFAULTS, ...initial });
  const svg = useMemo(() => renderSinkSketch(spec), [spec]);
  const fixNotes = useMemo(() => sanitizeSpec(spec).notes, [spec]);
  const resolved = useMemo(() => resolveBasins(spec), [spec]);
  const est = useMemo(() => estimateCentralDrain(spec), [spec]);

  const flat = spec.floorType === 'flat';
  const central = spec.drainMode === 'central';

  function set<K extends keyof SketchSpec>(key: K, val: SketchSpec[K]) {
    setSpec((p) => ({ ...p, [key]: val }));
  }

  // (re)build the equal split for the current geometry, dropping manual edits
  function regenSplit(next: SketchSpec): SketchSpec {
    const r = resolveBasins({ ...next, basins: undefined });
    return { ...next, basins: r.map((b) => ({ widthMm: Math.round(b.widthMm), pitchPct: b.pitchPct })) };
  }
  // set a structural field (length / end walls / divider) and re-split
  function setStruct<K extends keyof SketchSpec>(key: K, val: SketchSpec[K]) {
    setSpec((p) => regenSplit({ ...p, [key]: val }));
  }
  function setCount(n: number) {
    const c = Math.max(1, Math.min(10, Math.round(n) || 1));
    setSpec((p) => regenSplit({ ...p, basinCount: c }));
  }
  // edit one basin row (width or pitch); materialise the array from the current split first
  function setBasin(i: number, key: 'widthMm' | 'pitchPct', val: number) {
    setSpec((p) => {
      const arr = resolveBasins(p).map((b) => ({ widthMm: Math.round(b.widthMm), pitchPct: b.pitchPct }));
      if (arr[i]) arr[i] = { ...arr[i], [key]: val };
      return { ...p, basins: arr };
    });
  }
  function setDefaultPitch(v: number) {
    setSpec((p) => {
      const arr = resolveBasins(p).map((b) => ({ widthMm: Math.round(b.widthMm), pitchPct: v }));
      return { ...p, pitchPct: v, pitchLeftPct: v, pitchRightPct: v, basins: arr };
    });
  }
  function setFloor(ft: FloorType) {
    setSpec((p) => {
      if (ft === 'pitched') {
        const v = p.pitchPct ?? 2;
        const arr = resolveBasins(p).map((b) => ({ widthMm: Math.round(b.widthMm), pitchPct: b.pitchPct > 0 ? b.pitchPct : v }));
        return { ...p, floorType: 'pitched', basins: arr };
      }
      return { ...p, floorType: 'flat' };
    });
  }

  function downloadPng() {
    const d = new Date();
    const stamp = String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + d.getFullYear();
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600; canvas.height = 1440;
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
    const css = '@page { size: ' + pageSize + '; margin: 0; } * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; } html, body { margin: 0; padding: 0; background: #fff; } .sheet { box-sizing: border-box; padding: 10mm; width: 100%; min-height: 100vh; display: flex; align-items: center; justify-content: center; } .sheet svg { width: 100%; height: auto; max-width: 100%; }';
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
    const buildTxt = (central ? 'תעלה משותפת · ניקוז אחד' : 'אגנים נפרדים · ניקוז לכל אגן');
    const floorTxt = flat ? 'תחתית ישרה 90° (ללא שיפוע)' : 'תחתית משופעת';
    const splitTxt = resolved.map((b, i) => (i + 1) + ':' + Math.round(b.widthMm) + (flat ? '' : '@' + b.pitchPct + '%')).join('  ');
    const drainTxt = (spec.drain === 'linear' ? 'תעלה' : 'עגול') + (spec.drainRadiusMm ? ' R' + spec.drainRadiusMm : '');
    const siphonTxt = spec.stoneSiphonCover ? 'מאבן תואמת' : 'סטנדרטי';
    const lines = [
      'שרטוט ייצור: ' + spec.modelName,
      'צורה: ' + (SHAPES.find((s) => s.v === spec.shape)?.he || ''),
      'מידות: ' + spec.lengthMm + '×' + spec.widthMm + '×' + spec.heightMm + ' מ"מ · עומק אגן ' + spec.basinDepthMm,
      'מבנה: ' + buildTxt + ' · ' + (spec.basinCount ?? 1) + ' אגנים · ' + floorTxt,
      'חלוקה (אגן:רוחב' + (flat ? '' : '@שיפוע') + '): ' + splitTxt,
      'דפנות קצה (שמ/ימ): ' + wallTxt + ' מ"מ · מחיצה ' + (spec.dividerMm ?? spec.wallThicknessMm) + ' מ"מ',
      central ? ('ניקוז: 1 מרכזי · ' + drainTxt + (est.overLen ? ' ⚠️ מומלץ ' + est.suggestDrains + ' נקזים' : '')) : ('ניקוז: ' + (spec.basinCount ?? 1) + ' × ' + drainTxt),
      'חוץ: ' + spec.exteriorStone + ' · פנים: ' + spec.interiorStone + ' · סיפון: ' + siphonTxt,
      'התקנה: ' + (spec.mount === 'wall' ? 'קיר' : 'משטח') + ' · ברז: ' + (spec.tapHole ? 'כן' : 'לא'),
    ];
    const txt = encodeURIComponent(lines.join('\n'));
    window.open('https://api.whatsapp.com/send?text=' + txt, '_blank');
  }

  const numField = (label: string, key: keyof SketchSpec, onCh?: (v: number) => void) => (
    <label className="block">
      <span className="block text-xs font-medium text-stone-600 mb-1">{label}</span>
      <input type="number" value={spec[key] as number} onChange={(e) => (onCh ? onCh(Number(e.target.value) || 0) : set(key, (Number(e.target.value) || 0) as never))} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
    </label>
  );

  const sumW = resolved.reduce((a, b) => a + b.widthMm, 0)
    + (spec.wallLeftMm ?? spec.wallThicknessMm) + (spec.wallRightMm ?? spec.wallThicknessMm)
    + ((spec.basinCount ?? 1) - 1) * (spec.dividerMm ?? spec.wallThicknessMm);
  const sumOk = Math.abs(sumW - spec.lengthMm) <= 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" dir="rtl">
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <div className="text-xs font-semibold text-amber-800 mb-1">ממיר ס&quot;מ ← מ&quot;מ (מהתמונה בוואטסאפ)</div>
          <div className="flex items-center gap-2">
            <input type="number" value={cmIn} onChange={(e) => setCmIn(Number(e.target.value) || 0)} placeholder='ס"מ' className="w-24 px-2 py-1 text-sm border border-amber-300 rounded-md" dir="ltr" />
            <span className="text-amber-700 text-sm">ס&quot;מ =</span>
            <span className="font-mono font-semibold text-amber-900">{(cmIn * 10).toLocaleString()} מ&quot;מ</span>
          </div>
          <div className="text-[11px] text-amber-600 mt-1">לדוגמה: 470 ס&quot;מ = 4700 מ&quot;מ · 45 ס&quot;מ = 450 מ&quot;מ</div>
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
          {numField('אורך (מ"מ)', 'lengthMm', (v) => setStruct('lengthMm', v))}
          {numField('רוחב (מ"מ)', 'widthMm')}
          {numField('גובה (מ"מ)', 'heightMm')}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {numField('עומק אגן', 'basinDepthMm')}
          {numField('עובי תחתית', 'wallThicknessMm')}
          {numField('רדיוס ניקוז R', 'drainRadiusMm')}
        </div>

        {/* basin count 1..10 */}
        <div className="bg-stone-100 border border-stone-200 rounded-md p-2.5">
          <div className="text-xs font-semibold text-stone-700 mb-1.5">מספר כיורים/אגנים במבנה אחד (1–10)</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCount((spec.basinCount ?? 1) - 1)} className="w-8 h-8 rounded-md border border-stone-300 bg-white text-lg font-bold text-stone-600">−</button>
            <input type="number" min={1} max={10} value={spec.basinCount ?? 1} onChange={(e) => setCount(Number(e.target.value))} className="w-16 px-2 py-1.5 text-center text-base font-bold border border-stone-300 rounded-md" dir="ltr" />
            <button type="button" onClick={() => setCount((spec.basinCount ?? 1) + 1)} className="w-8 h-8 rounded-md border border-stone-300 bg-white text-lg font-bold text-stone-600">+</button>
            <span className="text-[11px] text-stone-500">
              ≈ {Math.round(Math.max(0, spec.lengthMm - (spec.wallLeftMm ?? spec.wallThicknessMm) - (spec.wallRightMm ?? spec.wallThicknessMm) - ((spec.basinCount ?? 1) - 1) * (spec.dividerMm ?? spec.wallThicknessMm)) / (spec.basinCount ?? 1))} מ&quot;מ לאגן
            </span>
          </div>
        </div>

        {/* the 2 customer options */}
        <div className="bg-stone-100 border border-stone-200 rounded-md p-2.5 space-y-2">
          <div className="text-xs font-semibold text-stone-700">מבנה הכיור — בחירת הלקוח</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => set('drainMode', 'perBasin' as DrainMode)} className={'px-2 py-2 rounded-md text-xs font-semibold border ' + (!central ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300')}>אגנים נפרדים · ניקוז לכל אגן</button>
            <button type="button" onClick={() => set('drainMode', 'central' as DrainMode)} className={'px-2 py-2 rounded-md text-xs font-semibold border ' + (central ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300')}>תעלה משותפת · ניקוז אחד</button>
          </div>
          <div className="text-xs font-semibold text-stone-700 pt-1">תחתית האגן</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => setFloor('pitched')} className={'px-2 py-2 rounded-md text-xs font-semibold border ' + (!flat ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300')}>משופע · ניקוז בשיפוע</button>
            <button type="button" onClick={() => setFloor('flat')} className={'px-2 py-2 rounded-md text-xs font-semibold border ' + (flat ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300')}>ישר 90° · ללא שיפוע</button>
          </div>
          {central && (
            <div className={'text-[11px] rounded-md px-2 py-1.5 ' + (est.overLen ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}>
              ניקוז מרכזי אחד · ריצה לכל צד ≈ {est.runSideMm} מ&quot;מ{flat ? '' : ' · ירידה למרכז ≈ ' + est.fallMm + ' מ"מ'}.
              {est.overLen ? ' ⚠️ ' + spec.lengthMm + ' מ"מ ארוך לניקוז יחיד — מומלץ ' + est.suggestDrains + ' נקזים.' : ' באורך תקין לניקוז יחיד.'}
            </div>
          )}
        </div>

        {/* editable split */}
        <div className="bg-stone-50 border border-stone-200 rounded-md p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">חלוקת אגנים — ניתנת לעריכה</span>
            <button type="button" onClick={() => setSpec((p) => regenSplit(p))} className="text-[11px] px-2.5 py-1 rounded border border-stone-300 bg-white text-stone-600">↻ חלוקה שווה</button>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-stone-500">
                <th className="py-1 font-semibold">#</th>
                <th className="py-1 font-semibold">רוחב אגן (מ&quot;מ)</th>
                <th className="py-1 font-semibold">מרכז (מ&quot;מ)</th>
                <th className="py-1 font-semibold">שיפוע %</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map((b, i) => (
                <tr key={i} className="text-center">
                  <td className="py-0.5">{i + 1}</td>
                  <td className="py-0.5"><input type="number" value={Math.round(b.widthMm)} onChange={(e) => setBasin(i, 'widthMm', Number(e.target.value) || 0)} className="w-16 px-1 py-1 text-center border border-stone-300 rounded" dir="ltr" /></td>
                  <td className="py-0.5 text-stone-500">{Math.round(b.centerMm)}</td>
                  <td className="py-0.5">
                    {flat
                      ? <span className="text-stone-400 italic">ישר 90°</span>
                      : <input type="number" step="0.1" value={b.pitchPct} onChange={(e) => setBasin(i, 'pitchPct', Number(e.target.value) || 0)} className="w-14 px-1 py-1 text-center border border-stone-300 rounded" dir="ltr" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={'text-[11px] ' + (sumOk ? 'text-stone-500' : 'text-red-600')}>
            סכום: {Math.round(sumW)} מ&quot;מ {sumOk ? '✓ תואם לאורך' : '✗ הפרש ' + Math.round(sumW - spec.lengthMm) + ' מ"מ (לחץ «חלוקה שווה»)'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {numField('דופן קצה שמאל (מ"מ)', 'wallLeftMm', (v) => setStruct('wallLeftMm', v))}
          {numField('דופן קצה ימין (מ"מ)', 'wallRightMm', (v) => setStruct('wallRightMm', v))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {numField('עובי מחיצה בין אגנים (מ"מ)', 'dividerMm', (v) => setStruct('dividerMm', v))}
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">שיפוע ברירת-מחדל %</span>
            <input type="number" step="0.1" value={spec.pitchPct ?? 2} disabled={flat} onChange={(e) => setDefaultPitch(Number(e.target.value) || 0)} className={'w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md ' + (flat ? 'bg-stone-100 text-stone-400' : '')} dir="ltr" />
          </label>
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
          <SaveSketchToGallery svg={svg} spec={spec as unknown as Record<string, unknown>} defaultTitle={spec.modelName} />
        </div>
      </div>

      {fixNotes.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 mb-2" dir="rtl">
          <div className="text-xs font-semibold text-amber-800 mb-1">🔧 התאמות ונתונים הנדסיים</div>
          <ul className="text-xs text-amber-700 space-y-0.5 list-disc pr-4">
            {fixNotes.map((n, i) => (<li key={i}>{n}</li>))}
          </ul>
        </div>
      )}
      <div className="border border-stone-200 rounded-lg p-2 bg-white" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
