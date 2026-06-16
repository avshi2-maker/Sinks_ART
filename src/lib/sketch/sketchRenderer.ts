// src/lib/sketch/sketchRenderer.ts
// SVG technical-sketch generator — auto-scale, dual pitch, and DOUBLE-BASIN (two troughs in one block).

export type SketchShape = 'rectangle' | 'square' | 'triangle' | 'trapezoid' | 'pentagon' | 'custom';
export type SketchMount = 'wall' | 'countertop';
export type SketchDrain = 'round' | 'linear';

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
  pitchLeftPct?: number;      // basin-1 pitch (left basin slope toward its drain)
  pitchRightPct?: number;     // basin-2 pitch (right basin slope toward its drain)
  drainRadiusMm?: number;     // drain radius R (e.g. 45 mm)
  stoneSiphonCover?: boolean; // matching-stone trap cover (סיפון מאבן תואמת)
  basinCount?: number;        // 1 (default) or 2 — double sink: two basins, each its own center drain
}

const PAGE_W = 800;
const PAGE_H = 720;
const STROKE = '#1e293b';
const DIM = '#64748b';
const FILL_EXT = '#f1f5f9';
const FILL_INT = '#e2e8f0';

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

export function renderSinkSketch(spec: SketchSpec): string {
  if (!(spec.lengthMm > 0) || !(spec.widthMm > 0) || !(spec.heightMm > 0)) {
    return `<svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" style="direction:ltr"><rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="white"/><text x="${PAGE_W / 2}" y="${PAGE_H / 2 - 10}" text-anchor="middle" font-size="20" font-weight="600" fill="${DIM}">הזן מידות להצגת השרטוט</text><text x="${PAGE_W / 2}" y="${PAGE_H / 2 + 18}" text-anchor="middle" font-size="13" fill="${DIM}">אורך · רוחב · גובה (מ"מ)</text></svg>`;
  }
  const wallL = spec.wallLeftMm ?? spec.wallThicknessMm;
  const wallR = spec.wallRightMm ?? spec.wallThicknessMm;
  const pitch1 = spec.pitchLeftPct ?? spec.pitchPct ?? 0;   // basin 1 (left)
  const pitch2 = spec.pitchRightPct ?? spec.pitchPct ?? 0;  // basin 2 (right)
  const drainR = spec.drainRadiusMm ?? 0;
  const isDouble = (spec.basinCount ?? 1) >= 2;
  const dividerMm = spec.wallThicknessMm; // divider rib = wall thickness (structural consistency)

  // ---------- TOP VIEW ----------
  const topBoxX = 90, topBoxY = 90, topBoxW = 620, topBoxH = 150;
  const scaleTop = Math.min(topBoxW / spec.lengthMm, topBoxH / spec.widthMm);
  const poly = topPolygon(spec);
  const Lpx = spec.lengthMm * scaleTop;
  const Wpx = spec.widthMm * scaleTop;
  const ox = topBoxX, oy = topBoxY;
  const pts = poly.map((p) => `${ox + p.x * scaleTop},${oy + p.y * scaleTop}`).join(' ');
  const wt = spec.wallThicknessMm * scaleTop;

  // basin pocket(s) in top view + drain(s)
  let topBasins = '';
  let topDrains = '';
  const innerTop = oy + wt;
  const innerBot = oy + Wpx - wt;
  const drainCy = oy + Wpx / 2;
  const drainEl = (cx: number) => spec.drain === 'linear'
    ? `<rect x="${cx - 22}" y="${drainCy - 3}" width="44" height="6" rx="2" fill="none" stroke="${STROKE}" stroke-width="1.2"/>`
    : `<circle cx="${cx}" cy="${drainCy}" r="6" fill="none" stroke="${STROKE}" stroke-width="1.2"/>`;

  if (!isDouble) {
    const ix1 = ox + wallL * scaleTop;
    const ix2 = ox + Lpx - wallR * scaleTop;
    topBasins = `<rect x="${ix1}" y="${innerTop}" width="${ix2 - ix1}" height="${innerBot - innerTop}" fill="${FILL_INT}" stroke="${STROKE}" stroke-width="1" stroke-dasharray="4 2"/>`;
    const dcx = (ix1 + ix2) / 2;
    topDrains = drainEl(dcx);
  } else {
    // two equal basins separated by a divider rib
    const usable = spec.lengthMm - wallL - wallR - dividerMm;
    const basinLenMm = usable / 2;
    const b1x1 = ox + wallL * scaleTop;
    const b1x2 = b1x1 + basinLenMm * scaleTop;
    const b2x1 = b1x2 + dividerMm * scaleTop;
    const b2x2 = b2x1 + basinLenMm * scaleTop;
    topBasins =
      `<rect x="${b1x1}" y="${innerTop}" width="${b1x2 - b1x1}" height="${innerBot - innerTop}" fill="${FILL_INT}" stroke="${STROKE}" stroke-width="1" stroke-dasharray="4 2"/>` +
      `<rect x="${b2x1}" y="${innerTop}" width="${b2x2 - b2x1}" height="${innerBot - innerTop}" fill="${FILL_INT}" stroke="${STROKE}" stroke-width="1" stroke-dasharray="4 2"/>`;
    topDrains = drainEl((b1x1 + b1x2) / 2) + drainEl((b2x1 + b2x2) / 2);
  }
  const firstDrainCx = isDouble
    ? ox + (wallL + (spec.lengthMm - wallL - wallR - dividerMm) / 4) * scaleTop
    : ox + Lpx / 2;
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

  let section = '';
  let drainSecSvg = '';
  let pitchLabel = '';
  let sectionDims = '';
  const outerBox = `<path d="M ${sx} ${sy} L ${sx + secW} ${sy} L ${sx + secW} ${sy + secH} L ${sx} ${sy + secH} Z" fill="${FILL_EXT}" stroke="${STROKE}" stroke-width="1.5"/>`;

  if (!isDouble) {
    const swtL = wallL * scaleSec;
    const swtR = wallR * scaleSec;
    const trueDropL = (spec.lengthMm / 2) * (pitch1 / 100) * scaleSec;
    const trueDropR = (spec.lengthMm / 2) * (pitch2 / 100) * scaleSec;
    const dropPxL = pitch1 > 0 ? Math.max(trueDropL, 14) : 0;
    const dropPxR = pitch2 > 0 ? Math.max(trueDropR, 14) : 0;
    const centerY = floorEdgeY + Math.max(dropPxL, dropPxR);
    const leftEdgeY = centerY - dropPxL;
    const rightEdgeY = centerY - dropPxR;
    const cx = sx + secW / 2;
    section = outerBox + `<path d="M ${sx + swtL} ${basinTop} L ${sx + secW - swtR} ${basinTop} L ${sx + secW - swtR} ${rightEdgeY} L ${cx} ${centerY} L ${sx + swtL} ${leftEdgeY} Z" fill="white" stroke="${STROKE}" stroke-width="1.2" stroke-linejoin="round"/>`;
    drainSecSvg = `<circle cx="${cx}" cy="${centerY - 3}" r="3.5" fill="none" stroke="${STROKE}" stroke-width="1"/>`;
    pitchLabel =
      (pitch1 > 0 ? `<text x="${sx + secW * 0.26}" y="${leftEdgeY - 6}" font-size="10" fill="${DIM}" font-family="monospace" font-style="italic">שיפוע ${pitch1}%</text>` : '') +
      (pitch2 > 0 ? `<text x="${sx + secW * 0.64}" y="${rightEdgeY - 6}" font-size="10" fill="${DIM}" font-family="monospace" font-style="italic">${pitch2}%</text>` : '');
    const innerLen = Math.max(0, spec.lengthMm - wallL - wallR);
    const dimBreakY = sy + secH + 40;
    sectionDims =
      dimLineH(sx, sx + swtL, dimBreakY, wallL + '') +
      dimLineH(sx + swtL, sx + secW - swtR, dimBreakY, innerLen + '') +
      dimLineH(sx + secW - swtR, sx + secW, dimBreakY, wallR + '');
  } else {
    // DOUBLE: two basins each sloping to its own center drain, divider rib between
    const usableMm = spec.lengthMm - wallL - wallR - dividerMm;
    const basinLenMm = usableMm / 2;
    const wL = wallL * scaleSec;
    const wR = wallR * scaleSec;
    const div = dividerMm * scaleSec;
    const bLen = basinLenMm * scaleSec;
    // basin 1 x-range
    const b1L = sx + wL;
    const b1R = b1L + bLen;
    const b1C = (b1L + b1R) / 2;
    // basin 2 x-range
    const b2L = b1R + div;
    const b2R = b2L + bLen;
    const b2C = (b2L + b2R) / 2;
    // drops (each basin half-length to its center)
    const drop1 = pitch1 > 0 ? Math.max((basinLenMm / 2) * (pitch1 / 100) * scaleSec, 12) : 0;
    const drop2 = pitch2 > 0 ? Math.max((basinLenMm / 2) * (pitch2 / 100) * scaleSec, 12) : 0;
    const edge1 = floorEdgeY;
    const center1 = edge1 + drop1;
    const edge2 = floorEdgeY;
    const center2 = edge2 + drop2;
    section = outerBox +
      // basin 1 trough
      `<path d="M ${b1L} ${basinTop} L ${b1R} ${basinTop} L ${b1R} ${edge1} L ${b1C} ${center1} L ${b1L} ${edge1} Z" fill="white" stroke="${STROKE}" stroke-width="1.2" stroke-linejoin="round"/>` +
      // basin 2 trough
      `<path d="M ${b2L} ${basinTop} L ${b2R} ${basinTop} L ${b2R} ${edge2} L ${b2C} ${center2} L ${b2L} ${edge2} Z" fill="white" stroke="${STROKE}" stroke-width="1.2" stroke-linejoin="round"/>` +
      // divider rib top hatch (solid stone between basins)
      `<rect x="${b1R}" y="${basinTop}" width="${div}" height="${floorEdgeY - basinTop}" fill="${FILL_INT}" stroke="${STROKE}" stroke-width="1"/>`;
    drainSecSvg =
      `<circle cx="${b1C}" cy="${center1 - 3}" r="3.5" fill="none" stroke="${STROKE}" stroke-width="1"/>` +
      `<circle cx="${b2C}" cy="${center2 - 3}" r="3.5" fill="none" stroke="${STROKE}" stroke-width="1"/>`;
    pitchLabel =
      (pitch1 > 0 ? `<text x="${b1C}" y="${edge1 - 6}" text-anchor="middle" font-size="10" fill="${DIM}" font-family="monospace" font-style="italic">${pitch1}%</text>` : '') +
      (pitch2 > 0 ? `<text x="${b2C}" y="${edge2 - 6}" text-anchor="middle" font-size="10" fill="${DIM}" font-family="monospace" font-style="italic">${pitch2}%</text>` : '');
    const dimBreakY = sy + secH + 40;
    sectionDims =
      dimLineH(sx, b1L, dimBreakY, wallL + '') +
      dimLineH(b1L, b1R, dimBreakY, Math.round(basinLenMm) + '') +
      dimLineH(b1R, b2L, dimBreakY, dividerMm + ' מחיצה') +
      dimLineH(b2L, b2R, dimBreakY, Math.round(basinLenMm) + '') +
      dimLineH(b2R, sx + secW, dimBreakY, wallR + '');
  }

  const mountLabel = spec.mount === 'wall' ? 'תלוי קיר (ללא משטח)' : 'מונח על משטח';
  const wallHatch = spec.mount === 'wall'
    ? `<line x1="${sx - 12}" y1="${sy - 4}" x2="${sx - 12}" y2="${sy + secH + 4}" stroke="${STROKE}" stroke-width="2"/>` + Array.from({ length: 8 }).map((_, i) => `<line x1="${sx - 12}" y1="${sy - 4 + i * ((secH + 8) / 7)}" x2="${sx - 22}" y2="${sy - 4 + i * ((secH + 8) / 7) + 8}" stroke="${STROKE}" stroke-width="1"/>`).join('')
    : `<line x1="${sx - 4}" y1="${sy + secH}" x2="${sx + secW + 4}" y2="${sy + secH}" stroke="${STROKE}" stroke-width="2"/>`;

  // ---------- FOOTER: technical data panel ----------
  const pitchTxtF = (pitch1 > 0 || pitch2 > 0) ? (pitch1 === pitch2 ? pitch1 + '%' : pitch1 + '% / ' + pitch2 + '%') : '—';
  const drainTxtF = (spec.drain === 'linear' ? 'תעלה' : 'עגול') + (drainR > 0 ? ' · R' + drainR : '');
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
    techRow(colL, 0, 'תצורה', isDouble ? 'כיור כפול · 2 אגנים' : 'כיור יחיד') +
    techRow(colL, 1, 'שיפוע ניקוז', pitchTxtF) +
    techRow(colL, 2, 'ניקוז', drainTxtF) +
    techRow(colL, 3, 'התקנה', spec.mount === 'wall' ? 'תלוי קיר' : 'על משטח') +
    techRow(colL, 4, 'סיפון', spec.stoneSiphonCover ? 'מאבן תואמת' : 'סטנדרטי') +
    `<rect x="92" y="${fy + 134}" width="13" height="13" fill="${FILL_EXT}" stroke="${STROKE}"/><text x="110" y="${fy + 145}" font-size="12" fill="${STROKE}">שיש חוץ: ${esc(spec.exteriorStone || '—')}</text>` +
    `<rect x="300" y="${fy + 134}" width="13" height="13" fill="${FILL_INT}" stroke="${STROKE}"/><text x="318" y="${fy + 145}" font-size="12" fill="${STROKE}">שיש פנים (אגן): ${esc(spec.interiorStone || '—')}</text>`;

  return `<svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" style="direction:ltr"><rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="white"/><text x="${PAGE_W / 2}" y="34" text-anchor="middle" font-size="18" font-weight="600" fill="${STROKE}">${esc(spec.modelName || 'כיור שיש')}</text><text x="${PAGE_W / 2}" y="54" text-anchor="middle" font-size="12" fill="${DIM}">שרטוט ייצור · מידות במ"מ${isDouble ? ' · כיור כפול' : ''}</text><text x="${topBoxX}" y="${topBoxY - 12}" font-size="13" font-weight="600" fill="${STROKE}">מבט על (TOP)</text><polygon points="${pts}" fill="${FILL_EXT}" stroke="${STROKE}" stroke-width="1.5"/>${topBasins}${topDrains}${drainRLabel}${tapSvg}${dimLineH(ox, ox + Lpx, oy + Wpx + 24, spec.lengthMm + '')}${dimLineV(oy, oy + Wpx, ox - 22, spec.widthMm + '')}<text x="${secBoxX}" y="${secBoxY - 12}" font-size="13" font-weight="600" fill="${STROKE}">חתך צד (SECTION)</text>${section}${drainSecSvg}${pitchLabel}${wallHatch}${dimLineV(sy, sy + secH, sx + secW + 24, spec.heightMm + '')}${sectionDims}<text x="${sx + secW / 2}" y="${sy + secH + 18}" text-anchor="middle" font-size="11" fill="${DIM}">${esc(mountLabel)}</text>${techPanel}</svg>`;
}


