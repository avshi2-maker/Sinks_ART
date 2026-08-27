// src/lib/sketch/sketchRenderer.ts
// SVG technical-sketch generator — auto-scale, N-BASIN (1..10) trough builder.
// Two customer-selectable build options:
//   floorType : 'pitched' (sloped floor draining to the low point) | 'flat' (straight 90°, no slope)
//   drainMode : 'perBasin' (a drain per basin) | 'central' (one shared drain for the whole trough)
// Back-compat: legacy specs (basinCount 1 or 2, no floorType/drainMode) render exactly as before.

export type SketchShape = 'rectangle' | 'square' | 'triangle' | 'trapezoid' | 'pentagon' | 'custom';
export type SketchMount = 'wall' | 'countertop';
export type SketchDrain = 'round' | 'linear';
export type FloorType = 'pitched' | 'flat';
export type DrainMode = 'perBasin' | 'central';

export interface BasinCell {
  widthMm: number;   // inner width of this basin along the length
  pitchPct: number;  // this basin's floor slope toward its drain (ignored when floorType==='flat')
}

export interface SketchSpec {
  modelName: string;
  shape: SketchShape;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  basinDepthMm: number;
  wallThicknessMm: number;
  mount: SketchMount;
  tapHole: boolean;
  drain: SketchDrain;
  exteriorStone: string;
  interiorStone: string;
  backLengthMm?: number;
  pitchPct?: number;
  // --- Lead-CAD parity fields (all optional, fall back to legacy) ---
  wallLeftMm?: number;        // left end-wall thickness (the "20" on the left)
  wallRightMm?: number;       // right end-wall thickness (the "20" on the right)
  pitchLeftPct?: number;      // legacy: left/basin-1 pitch fallback
  pitchRightPct?: number;     // legacy: right/basin-2 pitch fallback
  drainRadiusMm?: number;     // drain radius R (e.g. 45 mm)
  stoneSiphonCover?: boolean; // matching-stone trap cover (סיפון מאבן תואמת)
  basinCount?: number;        // 1..10 — number of basins in one build
  // --- N-basin rebuild fields ---
  basins?: BasinCell[];       // per-basin split (editable). If length !== basinCount, an equal split is used.
  floorType?: FloorType;      // default 'pitched'
  drainMode?: DrainMode;      // default 'perBasin'
  dividerMm?: number;         // inter-basin rib thickness (defaults to wallThicknessMm)
  exteriorStoneUrl?: string;  // customer's own sample photo used as the exterior reference
  interiorStoneUrl?: string;  // customer's own sample photo used as the interior reference
}

const PAGE_W = 800;
const PAGE_H = 720;
const STROKE = '#1e293b';
const DIM = '#64748b';
const FILL_EXT = '#f1f5f9';
const FILL_INT = '#e2e8f0';
const REC_MAX_PER_DRAIN = 3000; // mm — rule of thumb: single Ø waste, intensive use

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const clampN = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Resolve the buildable basin split for a spec (uses spec.basins when it matches basinCount,
// otherwise an equal division after reserving the end walls + dividers).
export interface ResolvedBasin { widthMm: number; pitchPct: number; centerMm: number; x1mm: number; x2mm: number; }

export function resolveBasins(spec: SketchSpec): ResolvedBasin[] {
  const n = clampN(Math.round(spec.basinCount ?? 1), 1, 10);
  const wallL = spec.wallLeftMm ?? spec.wallThicknessMm;
  const wallR = spec.wallRightMm ?? spec.wallThicknessMm;
  const divider = spec.dividerMm ?? spec.wallThicknessMm;
  const usable = Math.max(0, spec.lengthMm - wallL - wallR - (n - 1) * divider);
  const defPitch = spec.pitchLeftPct ?? spec.pitchPct ?? 2;
  const useProvided = Array.isArray(spec.basins) && spec.basins.length === n;
  const widths: number[] = useProvided
    ? spec.basins!.map((b) => (b.widthMm > 0 ? b.widthMm : usable / n))
    : Array.from({ length: n }, () => usable / n);
  const pitches: number[] = useProvided
    ? spec.basins!.map((b) => (b.pitchPct > 0 ? b.pitchPct : defPitch))
    : Array.from({ length: n }, () => defPitch);
  const out: ResolvedBasin[] = [];
  let cursor = wallL;
  for (let i = 0; i < n; i++) {
    const w = widths[i];
    out.push({ widthMm: w, pitchPct: pitches[i], centerMm: cursor + w / 2, x1mm: cursor, x2mm: cursor + w });
    cursor += w + divider;
  }
  return out;
}

// One-shared-drain estimate (drainMode === 'central').
export interface OneDrainEstimate { runSideMm: number; fallMm: number; centerDepthMm: number; overLen: boolean; suggestDrains: number; }
export function estimateCentralDrain(spec: SketchSpec): OneDrainEstimate {
  const wallL = spec.wallLeftMm ?? spec.wallThicknessMm;
  const wallR = spec.wallRightMm ?? spec.wallThicknessMm;
  const runSideMm = Math.max(0, (spec.lengthMm - wallL - wallR) / 2);
  const slope = spec.floorType === 'flat' ? 0 : (spec.pitchLeftPct ?? spec.pitchPct ?? 2);
  const fallMm = Math.round(runSideMm * slope / 100);
  return {
    runSideMm: Math.round(runSideMm),
    fallMm,
    centerDepthMm: spec.basinDepthMm + fallMm,
    overLen: spec.lengthMm > REC_MAX_PER_DRAIN,
    suggestDrains: Math.max(1, Math.ceil(spec.lengthMm / REC_MAX_PER_DRAIN)),
  };
}

// --- Sanity-check "engineer": auto-correct a spec so it always yields a buildable sink,
// even from non-expert input. Returns the fixed spec + Hebrew notes of what changed / what to know.
export interface SanitizeResult { spec: SketchSpec; notes: string[]; }

export function sanitizeSpec(input: SketchSpec): SanitizeResult {
  const notes: string[] = [];
  const s: SketchSpec = { ...input };
  const clamp = clampN;

  // 1) base dimensions must be positive + within sane physical limits (mm)
  if (!(s.lengthMm > 0)) { s.lengthMm = 600; notes.push('אורך לא תקין — הוגדר 600 מ"מ'); }
  if (!(s.widthMm > 0)) { s.widthMm = 450; notes.push('רוחב לא תקין — הוגדר 450 מ"מ'); }
  if (!(s.heightMm > 0)) { s.heightMm = 250; notes.push('גובה לא תקין — הוגדר 250 מ"מ'); }
  const L0 = s.lengthMm, W0 = s.widthMm, H0 = s.heightMm;
  s.lengthMm = clamp(s.lengthMm, 200, 6000);
  s.widthMm = clamp(s.widthMm, 150, 1200);
  s.heightMm = clamp(s.heightMm, 80, 600);
  if (s.lengthMm !== L0) notes.push('אורך תוקן לטווח תקין (200–6000 מ"מ)');
  if (s.widthMm !== W0) notes.push('רוחב תוקן לטווח תקין (150–1200 מ"מ)');
  if (s.heightMm !== H0) notes.push('גובה תוקן לטווח תקין (80–600 מ"מ)');

  // 2) CORNER TRIANGLE rule
  if (s.shape === 'triangle') {
    if (Math.abs(s.lengthMm - s.widthMm) > 1) {
      const side = Math.max(s.lengthMm, s.widthMm);
      s.lengthMm = side; s.widthMm = side;
      notes.push('משולש פינתי: שני הצדדים הושוו ל-' + side + ' מ"מ ליצירת זווית 90° תקנית');
    }
    if (s.mount !== 'wall') { s.mount = 'wall'; notes.push('כיור פינתי תוקן ל"תלוי קיר"'); }
    if (s.drain !== 'round') { s.drain = 'round'; notes.push('ניקוז פינתי תוקן לעגול'); }
  }

  // 3) basin depth cannot exceed the body height (leave >=20mm floor)
  if (!(s.basinDepthMm > 0)) { s.basinDepthMm = Math.round(s.heightMm * 0.8); }
  if (s.basinDepthMm > s.heightMm - 20) {
    s.basinDepthMm = Math.max(20, s.heightMm - 20);
    notes.push('עומק האגן תוקן כך שיישאר עובי תחתית מינימלי');
  }

  // 4) wall thickness sane (>=8mm, <= quarter of width)
  if (!(s.wallThicknessMm > 0)) s.wallThicknessMm = 30;
  const maxWall = Math.floor(s.widthMm / 4);
  if (s.wallThicknessMm < 8) { s.wallThicknessMm = 8; notes.push('עובי דופן תוקן למינימום 8 מ"מ'); }
  if (s.wallThicknessMm > maxWall) { s.wallThicknessMm = maxWall; notes.push('עובי דופן תוקן כך שלא יחרוג מרוחב הכיור'); }

  // 5) N-basin normalisation
  const nRaw = Math.round(s.basinCount ?? 1);
  const n = clamp(nRaw, 1, 10);
  if (n !== nRaw) notes.push('מספר אגנים תוקן לטווח 1–10');
  s.basinCount = n;
  if (!s.floorType) s.floorType = 'pitched';
  if (!s.drainMode) s.drainMode = 'perBasin';

  // 6) pitch band 1%–5% (only meaningful for a pitched floor)
  const fixPitch = (p: number | undefined, label: string): number | undefined => {
    if (p === undefined) return p;
    const c = clamp(p, 1, 5);
    if (c !== p) notes.push(label + ' תוקן לטווח שיפוע תקני (1%–5%)');
    return c;
  };
  if (s.floorType === 'pitched') {
    s.pitchPct = fixPitch(s.pitchPct, 'שיפוע');
    s.pitchLeftPct = fixPitch(s.pitchLeftPct, 'שיפוע');
    s.pitchRightPct = fixPitch(s.pitchRightPct, 'שיפוע');
    if (Array.isArray(s.basins)) {
      s.basins = s.basins.map((b, i) => {
        const c = clamp(b.pitchPct, 1, 5);
        if (c !== b.pitchPct) notes.push('שיפוע אגן ' + (i + 1) + ' תוקן לטווח 1%–5%');
        return { widthMm: Math.max(1, b.widthMm), pitchPct: c };
      });
    }
  }

  // 7) triangle is single-basin only
  if (s.shape === 'triangle' && n > 1) {
    s.basinCount = 1;
    notes.push('משולש פינתי תומך באגן יחיד — תוקן לאגן אחד');
  }

  // 8) informational engineering notes (the amber box)
  const cnt = s.basinCount ?? 1;
  const wallL = s.wallLeftMm ?? s.wallThicknessMm;
  const wallR = s.wallRightMm ?? s.wallThicknessMm;
  const divider = s.dividerMm ?? s.wallThicknessMm;
  const perBasin = Math.round(Math.max(0, s.lengthMm - wallL - wallR - (cnt - 1) * divider) / cnt);
  if (cnt > 1) notes.push(cnt + ' אגנים על אורך ' + s.lengthMm + ' מ"מ → כ-' + perBasin + ' מ"מ לאגן (אחרי ניכוי דפנות קצה ' + wallL + '+' + wallR + ' ומחיצות ' + (cnt - 1) + '×' + divider + ').');
  if (s.floorType === 'flat') {
    notes.push('תחתית ישרה 90° · ללא שיפוע — לפי בחירת הלקוח. דפנות פנים אנכיות.');
    notes.push('⚠️ תחתית שטוחה אינה מתנקזת בכוח הכובד — יש לוודא מיקום ניקוז נכון / שיפולת קלה סביב הפתח.');
  }
  if (s.drainMode === 'central') {
    const e = estimateCentralDrain(s);
    notes.push('מבנה: תעלה משותפת · ניקוז מרכזי אחד. ריצת שיפוע לכל צד ≈ ' + e.runSideMm + ' מ"מ.');
    if (s.floorType !== 'flat') notes.push('ירידה מהקצה למרכז ≈ ' + e.fallMm + ' מ"מ · עומק במרכז ≈ ' + e.centerDepthMm + ' מ"מ.');
    if (e.overLen) notes.push('⚠️ אורך ' + s.lengthMm + ' מ"מ ארוך לניקוז יחיד (כלל אצבע ~' + REC_MAX_PER_DRAIN + ' מ"מ) — מומלץ ' + e.suggestDrains + ' נקזים או «אגנים נפרדים».');
    else notes.push('אורך ' + s.lengthMm + ' מ"מ בתחום הסביר לניקוז יחיד (~עד ' + REC_MAX_PER_DRAIN + ' מ"מ).');
  } else if (cnt > 1) {
    notes.push('מבנה: אגנים נפרדים · ' + cnt + ' ניקוזים (ניקוז ממורכז לכל אגן).');
  }
  if (s.lengthMm > 4000) notes.push('אורך חורג מ-4000 מ"מ — ייתכן פיצול לשני חלקי שיש (תפר מוסתר) בייצור.');

  return { spec: s, notes };
}

function topPolygon(spec: SketchSpec): { x: number; y: number }[] {
  const L = spec.lengthMm, W = spec.widthMm;
  const back = spec.backLengthMm ?? L;
  switch (spec.shape) {
    case 'triangle':
      return [{ x: 0, y: 0 }, { x: L, y: 0 }, { x: 0, y: W }];
    case 'trapezoid':
      return [{ x: (L - back) / 2, y: 0 }, { x: (L + back) / 2, y: 0 }, { x: L, y: W }, { x: 0, y: W }];
    case 'pentagon':
      return [{ x: L * 0.5, y: 0 }, { x: L, y: W * 0.38 }, { x: L * 0.82, y: W }, { x: L * 0.18, y: W }, { x: 0, y: W * 0.38 }];
    default:
      return [{ x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: W }, { x: 0, y: W }];
  }
}

function dimLineH(x1: number, x2: number, y: number, label: string): string {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${DIM}" stroke-width="1"/><line x1="${x1}" y1="${y - 4}" x2="${x1}" y2="${y + 4}" stroke="${DIM}" stroke-width="1"/><line x1="${x2}" y1="${y - 4}" x2="${x2}" y2="${y + 4}" stroke="${DIM}" stroke-width="1"/><text x="${(x1 + x2) / 2}" y="${y + 14}" text-anchor="middle" font-size="12" fill="${DIM}" font-family="monospace">${esc(label)}</text>`;
}
function dimLineV(y1: number, y2: number, x: number, label: string): string {
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${DIM}" stroke-width="1"/><line x1="${x - 4}" y1="${y1}" x2="${x + 4}" y2="${y1}" stroke="${DIM}" stroke-width="1"/><line x1="${x - 4}" y1="${y2}" x2="${x + 4}" y2="${y2}" stroke="${DIM}" stroke-width="1"/><text x="${x}" y="${(y1 + y2) / 2}" text-anchor="middle" font-size="12" fill="${DIM}" font-family="monospace" transform="rotate(-90 ${x} ${(y1 + y2) / 2})">${esc(label)}</text>`;
}

export function renderSinkSketch(rawSpec: SketchSpec): string {
  const spec = sanitizeSpec(rawSpec).spec;
  if (!(spec.lengthMm > 0) || !(spec.widthMm > 0) || !(spec.heightMm > 0)) {
    return `<svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" style="direction:ltr"><rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="white"/><text x="${PAGE_W / 2}" y="${PAGE_H / 2 - 10}" text-anchor="middle" font-size="20" font-weight="600" fill="${DIM}">הזן מידות להצגת השרטוט</text><text x="${PAGE_W / 2}" y="${PAGE_H / 2 + 18}" text-anchor="middle" font-size="13" fill="${DIM}">אורך · רוחב · גובה (מ"מ)</text></svg>`;
  }
  const wallL = spec.wallLeftMm ?? spec.wallThicknessMm;
  const wallR = spec.wallRightMm ?? spec.wallThicknessMm;
  const drainR = spec.drainRadiusMm ?? 0;
  const flat = spec.floorType === 'flat';
  const central = spec.drainMode === 'central';
  const basins = resolveBasins(spec);
  const n = basins.length;

  // ---------- TOP VIEW ----------
  const topBoxX = 90, topBoxY = 90, topBoxW = 620, topBoxH = 150;
  const scaleTop = Math.min(topBoxW / spec.lengthMm, topBoxH / spec.widthMm);
  const poly = topPolygon(spec);
  const Lpx = spec.lengthMm * scaleTop;
  const Wpx = spec.widthMm * scaleTop;
  const ox = topBoxX, oy = topBoxY;
  const pts = poly.map((p) => `${ox + p.x * scaleTop},${oy + p.y * scaleTop}`).join(' ');
  const wt = spec.wallThicknessMm * scaleTop;
  const innerTop = oy + wt;
  const innerBot = oy + Wpx - wt;
  const drainCy = oy + Wpx / 2;
  const drainEl = (cx: number, big = false) => spec.drain === 'linear'
    ? `<rect x="${cx - 22}" y="${drainCy - 3}" width="44" height="6" rx="2" fill="none" stroke="${STROKE}" stroke-width="1.2"/>`
    : `<circle cx="${cx}" cy="${drainCy}" r="${big ? 8 : 6}" fill="none" stroke="${STROKE}" stroke-width="1.2"/>`;

  const mmx = (mm: number) => ox + mm * scaleTop;
  let topBasins = '';
  basins.forEach((b) => {
    topBasins += `<rect x="${mmx(b.x1mm)}" y="${innerTop}" width="${(b.x2mm - b.x1mm) * scaleTop}" height="${innerBot - innerTop}" fill="${FILL_INT}" stroke="${STROKE}" stroke-width="1" stroke-dasharray="4 2"/>`;
  });
  let topDrains = '';
  if (central) {
    topDrains = drainEl(mmx(spec.lengthMm / 2), true);
  } else {
    basins.forEach((b) => { topDrains += drainEl(mmx(b.centerMm)); });
  }
  const firstDrainCx = central ? mmx(spec.lengthMm / 2) : mmx(basins[0].centerMm);
  const drainRLabel = drainR > 0
    ? `<line x1="${firstDrainCx + 6}" y1="${drainCy - 6}" x2="${firstDrainCx + 26}" y2="${drainCy - 22}" stroke="${DIM}" stroke-width="1"/><text x="${firstDrainCx + 28}" y="${drainCy - 22}" font-size="11" fill="${DIM}" font-family="monospace">R${drainR}</text>`
    : '';
  const tapSvg = spec.tapHole
    ? `<circle cx="${ox + Lpx / 2}" cy="${oy + 10}" r="4" fill="none" stroke="${STROKE}" stroke-width="1.2"/><text x="${ox + Lpx / 2 + 10}" y="${oy + 13}" font-size="10" fill="${DIM}" font-family="monospace">חור ברז</text>`
    : '';

  // ---------- SECTION VIEW ----------
  const secBoxX = 90, secBoxY = 330, secBoxW = 620, secBoxH = 150;
  const scaleSec = Math.min(secBoxW / spec.lengthMm, secBoxH / spec.heightMm);
  const sx = secBoxX, sy = secBoxY;
  const secW = spec.lengthMm * scaleSec;
  const secH = spec.heightMm * scaleSec;
  const floorThk = spec.wallThicknessMm * scaleSec;
  const basinTop = sy + (spec.heightMm - spec.basinDepthMm) * scaleSec;
  const floorEdgeY = sy + secH - floorThk;
  const smx = (mm: number) => sx + mm * scaleSec;
  const outerBox = `<path d="M ${sx} ${sy} L ${sx + secW} ${sy} L ${sx + secW} ${sy + secH} L ${sx} ${sy + secH} Z" fill="${FILL_EXT}" stroke="${STROKE}" stroke-width="1.5"/>`;

  // one trough profile (flat rectangle, or V sloping to a low point at lowMm)
  const trough = (x1mm: number, x2mm: number, lowMm: number, pitch: number): { path: string; lowY: number; lowX: number } => {
    const xL = smx(x1mm), xR = smx(x2mm), lowX = smx(lowMm);
    if (flat || !(pitch > 0)) {
      return { path: `M ${xL} ${basinTop} L ${xR} ${basinTop} L ${xR} ${floorEdgeY} L ${xL} ${floorEdgeY} Z`, lowY: floorEdgeY, lowX };
    }
    const runL = Math.abs(lowMm - x1mm), runR = Math.abs(x2mm - lowMm);
    const dropL = Math.max(runL * (pitch / 100) * scaleSec, 12);
    const dropR = Math.max(runR * (pitch / 100) * scaleSec, 12);
    const lowY = floorEdgeY + Math.max(dropL, dropR);
    const leftY = lowY - dropL, rightY = lowY - dropR;
    return { path: `M ${xL} ${basinTop} L ${xR} ${basinTop} L ${xR} ${rightY} L ${lowX} ${lowY} L ${xL} ${leftY} Z`, lowY, lowX };
  };

  let section = outerBox;
  let drainSecSvg = '';
  let pitchLabel = '';
  let sectionDims = '';
  const dimBreakY = sy + secH + 40;

  if (central) {
    // one shared trough across the whole inner span, single drain at the geometric center
    const spanL = wallL, spanR = spec.lengthMm - wallR, mid = spec.lengthMm / 2;
    const pitch = flat ? 0 : (basins[0]?.pitchPct ?? 0);
    const t = trough(spanL, spanR, mid, pitch);
    section += t.path;
    // decorative divider ribs (do not separate the water)
    for (let i = 0; i < n - 1; i++) {
      const dvMm = basins[i].x2mm + (spec.dividerMm ?? spec.wallThicknessMm) / 2;
      section += `<line x1="${smx(dvMm)}" y1="${basinTop}" x2="${smx(dvMm)}" y2="${basinTop + (floorEdgeY - basinTop) * 0.35}" stroke="${STROKE}" stroke-width="1" stroke-dasharray="3 2"/>`;
    }
    drainSecSvg = `<circle cx="${t.lowX}" cy="${t.lowY - 3}" r="4" fill="none" stroke="${STROKE}" stroke-width="1.2"/>`;
    pitchLabel = flat
      ? `<text x="${t.lowX}" y="${basinTop - 6}" text-anchor="middle" font-size="10" fill="${DIM}" font-family="monospace" font-style="italic">ישר 90°</text>`
      : `<text x="${t.lowX}" y="${basinTop - 6}" text-anchor="middle" font-size="10" fill="${DIM}" font-family="monospace" font-style="italic">${basins[0]?.pitchPct ?? 0}% → מרכז</text>`;
    sectionDims = dimLineH(sx, smx(wallL), dimBreakY, wallL + '') +
      dimLineH(smx(wallL), smx(spec.lengthMm - wallR), dimBreakY, Math.round(spec.lengthMm - wallL - wallR) + '') +
      dimLineH(smx(spec.lengthMm - wallR), sx + secW, dimBreakY, wallR + '');
  } else {
    // a separate trough per basin, each draining to its own center
    const divider = spec.dividerMm ?? spec.wallThicknessMm;
    basins.forEach((b) => {
      const t = trough(b.x1mm, b.x2mm, b.centerMm, b.pitchPct);
      section += t.path;
      drainSecSvg += `<circle cx="${t.lowX}" cy="${t.lowY - 3}" r="3.5" fill="none" stroke="${STROKE}" stroke-width="1"/>`;
      const tag = flat ? '90°' : (b.pitchPct > 0 ? b.pitchPct + '%' : '');
      if (tag) pitchLabel += `<text x="${t.lowX}" y="${basinTop - 6}" text-anchor="middle" font-size="10" fill="${DIM}" font-family="monospace" font-style="italic">${tag}</text>`;
    });
    // solid divider ribs between basins
    for (let i = 0; i < n - 1; i++) {
      const rL = smx(basins[i].x2mm), rW = divider * scaleSec;
      section += `<rect x="${rL}" y="${basinTop}" width="${rW}" height="${floorEdgeY - basinTop}" fill="${FILL_INT}" stroke="${STROKE}" stroke-width="1"/>`;
    }
    // dimension line: wallL | basin1 | ... | wallR  (compact — show end walls + first basin width)
    sectionDims = dimLineH(sx, smx(wallL), dimBreakY, wallL + '') +
      dimLineH(smx(basins[0].x1mm), smx(basins[0].x2mm), dimBreakY, Math.round(basins[0].widthMm) + (n > 1 ? ' ×' + n : '')) +
      dimLineH(smx(spec.lengthMm - wallR), sx + secW, dimBreakY, wallR + '');
  }

  const mountLabel = spec.mount === 'wall' ? 'תלוי קיר (ללא משטח)' : 'מונח על משטח';
  const wallHatch = spec.mount === 'wall'
    ? `<line x1="${sx - 12}" y1="${sy - 4}" x2="${sx - 12}" y2="${sy + secH + 4}" stroke="${STROKE}" stroke-width="2"/>` + Array.from({ length: 8 }).map((_, i) => `<line x1="${sx - 12}" y1="${sy - 4 + i * ((secH + 8) / 7)}" x2="${sx - 22}" y2="${sy - 4 + i * ((secH + 8) / 7) + 8}" stroke="${STROKE}" stroke-width="1"/>`).join('')
    : `<line x1="${sx - 4}" y1="${sy + secH}" x2="${sx + secW + 4}" y2="${sy + secH}" stroke="${STROKE}" stroke-width="2"/>`;

  // ---------- FOOTER: technical data panel ----------
  const pitchSet = Array.from(new Set(basins.map((b) => b.pitchPct)));
  const pitchTxtF = flat ? 'ישר 90° (ללא שיפוע)'
    : (pitchSet.length === 1 ? pitchSet[0] + '%' : Math.min(...pitchSet) + '%–' + Math.max(...pitchSet) + '%');
  const drainTxtF = central
    ? '1 · מרכזי' + (spec.drain === 'linear' ? ' · תעלה' : ' · עגול') + (drainR > 0 ? ' R' + drainR : '')
    : n + ' · ' + (spec.drain === 'linear' ? 'תעלה' : 'עגול') + (drainR > 0 ? ' R' + drainR : '');
  const buildTxt = (central ? 'תעלה משותפת' : 'אגנים נפרדים') + ' · ' + n + ' אגנים · ' + (flat ? 'תחתית ישרה 90°' : 'תחתית משופעת');
  const fy = PAGE_H - 172;
  const techRow = (col: number, i: number, label: string, val: string): string =>
    `<text x="${col}" y="${fy + 50 + i * 21}" text-anchor="end" font-size="13" fill="${STROKE}"><tspan fill="${DIM}">${esc(label)}: </tspan>${esc(val)}</text>`;
  const colR = 700, colL = 388;
  const techPanel =
    `<rect x="80" y="${fy}" width="640" height="156" rx="6" fill="#fcfcfb" stroke="${STROKE}" stroke-width="1"/>` +
    `<path d="M 86 ${fy} L 714 ${fy} A 6 6 0 0 1 720 ${fy + 6} L 720 ${fy + 28} L 80 ${fy + 28} L 80 ${fy + 6} A 6 6 0 0 1 86 ${fy} Z" fill="#161616"/>` +
    `<text x="700" y="${fy + 19}" text-anchor="end" font-size="13" font-weight="700" fill="#e6c870">נתונים טכניים · TECHNICAL DATA</text>` +
    techRow(colR, 0, 'אורך כולל', spec.lengthMm + ' מ"מ') +
    techRow(colR, 1, 'רוחב', spec.widthMm + ' מ"מ') +
    techRow(colR, 2, 'גובה', spec.heightMm + ' מ"מ') +
    techRow(colR, 3, 'עומק אגן', spec.basinDepthMm + ' מ"מ') +
    techRow(colR, 4, 'דפנות קצה', wallL + ' / ' + wallR + ' מ"מ') +
    techRow(colL, 0, 'מבנה', buildTxt) +
    techRow(colL, 1, 'שיפוע', pitchTxtF) +
    techRow(colL, 2, 'ניקוז', drainTxtF) +
    techRow(colL, 3, 'התקנה', spec.mount === 'wall' ? 'תלוי קיר' : 'על משטח') +
    techRow(colL, 4, 'סיפון', spec.stoneSiphonCover ? 'מאבן תואמת' : 'סטנדרטי') +
    `<rect x="92" y="${fy + 134}" width="13" height="13" fill="${FILL_EXT}" stroke="${STROKE}"/><text x="110" y="${fy + 145}" font-size="12" fill="${STROKE}">שיש חוץ: ${esc(spec.exteriorStone || '—')}${spec.exteriorStoneUrl ? ' (דגימת לקוח)' : ''}</text>` +
    `<rect x="300" y="${fy + 134}" width="13" height="13" fill="${FILL_INT}" stroke="${STROKE}"/><text x="318" y="${fy + 145}" font-size="12" fill="${STROKE}">שיש פנים (אגן): ${esc(spec.interiorStone || '—')}${spec.interiorStoneUrl ? ' (דגימת לקוח)' : ''}</text>`;

  const subtitle = 'שרטוט ייצור · מידות במ"מ · ' + n + ' אגנים · ' + (central ? 'ניקוז מרכזי' : 'ניקוז לכל אגן') + (flat ? ' · ישר 90°' : '');
  return `<svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" style="direction:ltr"><rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="white"/><text x="${PAGE_W / 2}" y="34" text-anchor="middle" font-size="18" font-weight="600" fill="${STROKE}">${esc(spec.modelName || 'כיור שיש')}</text><text x="${PAGE_W / 2}" y="54" text-anchor="middle" font-size="12" fill="${DIM}">${esc(subtitle)}</text><text x="${topBoxX}" y="${topBoxY - 12}" font-size="13" font-weight="600" fill="${STROKE}">מבט על (TOP)</text><polygon points="${pts}" fill="${FILL_EXT}" stroke="${STROKE}" stroke-width="1.5"/>${topBasins}${topDrains}${drainRLabel}${tapSvg}${dimLineH(ox, ox + Lpx, oy + Wpx + 24, spec.lengthMm + '')}${dimLineV(oy, oy + Wpx, ox - 22, spec.widthMm + '')}<text x="${secBoxX}" y="${secBoxY - 12}" font-size="13" font-weight="600" fill="${STROKE}">חתך צד (SECTION)</text>${section}${drainSecSvg}${pitchLabel}${wallHatch}${dimLineV(sy, sy + secH, sx + secW + 24, spec.heightMm + '')}${sectionDims}<text x="${sx + secW / 2}" y="${sy + secH + 18}" text-anchor="middle" font-size="11" fill="${DIM}">${esc(mountLabel)}</text>${techPanel}</svg>`;
}
