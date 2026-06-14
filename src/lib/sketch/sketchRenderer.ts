// src/lib/sketch/sketchRenderer.ts
// SVG technical-sketch generator — auto-scale to fit any sink + dual pitch (slope) in section.

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
  pitchLeftPct?: number;      // slope of the left half toward the drain
  pitchRightPct?: number;     // slope of the right half toward the drain
  drainRadiusMm?: number;     // drain radius R (e.g. 45 mm)
  stoneSiphonCover?: boolean; // matching-stone trap cover (סיפון מאבן תואמת)
}

const PAGE_W = 800;
const PAGE_H = 640;
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
  // resolve per-side values with legacy fallback
  const wallL = spec.wallLeftMm ?? spec.wallThicknessMm;
  const wallR = spec.wallRightMm ?? spec.wallThicknessMm;
  const pitchLeft = spec.pitchLeftPct ?? spec.pitchPct ?? 0;
  const pitchRight = spec.pitchRightPct ?? spec.pitchPct ?? 0;
  const drainR = spec.drainRadiusMm ?? 0;

  // ---------- TOP VIEW ----------
  const topBoxX = 90, topBoxY = 90, topBoxW = 620, topBoxH = 150;
  const scaleTop = Math.min(topBoxW / spec.lengthMm, topBoxH / spec.widthMm);
  const poly = topPolygon(spec);
  const Lpx = spec.lengthMm * scaleTop;
  const Wpx = spec.widthMm * scaleTop;
  const ox = topBoxX, oy = topBoxY;
  const pts = poly.map((p) => `${ox + p.x * scaleTop},${oy + p.y * scaleTop}`).join(' ');
  const wt = spec.wallThicknessMm * scaleTop;
  const innerPts = poly.map((p) => {
    const cx2 = spec.lengthMm / 2, cy2 = spec.widthMm / 2;
    const dx = p.x < cx2 ? wt : -wt;
    const dy = p.y < cy2 ? wt : -wt;
    return `${ox + p.x * scaleTop + dx},${oy + p.y * scaleTop + dy}`;
  }).join(' ');
  const drainCx = ox + Lpx / 2, drainCy = oy + Wpx / 2;
  const drainSvg = spec.drain === 'linear'
    ? `<rect x="${drainCx - 30}" y="${drainCy - 3}" width="60" height="6" rx="2" fill="none" stroke="${STROKE}" stroke-width="1.2"/>`
    : `<circle cx="${drainCx}" cy="${drainCy}" r="6" fill="none" stroke="${STROKE}" stroke-width="1.2"/>`;
  const drainRLabel = drainR > 0
    ? `<line x1="${drainCx + 6}" y1="${drainCy - 6}" x2="${drainCx + 26}" y2="${drainCy - 22}" stroke="${DIM}" stroke-width="1"/><text x="${drainCx + 28}" y="${drainCy - 22}" font-size="11" fill="${DIM}" font-family="monospace">R${drainR}</text>`
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
  const swtL = wallL * scaleSec;
  const swtR = wallR * scaleSec;
  const basinTop = sy + (spec.heightMm - spec.basinDepthMm) * scaleSec;
  const floorEdgeY = sy + secH - floorThk;
  const trueDropL = (spec.lengthMm / 2) * (pitchLeft / 100) * scaleSec;
  const trueDropR = (spec.lengthMm / 2) * (pitchRight / 100) * scaleSec;
  const dropPxL = pitchLeft > 0 ? Math.max(trueDropL, 14) : 0;
  const dropPxR = pitchRight > 0 ? Math.max(trueDropR, 14) : 0;
  const centerY = floorEdgeY + Math.max(dropPxL, dropPxR);
  const leftEdgeY = centerY - dropPxL;
  const rightEdgeY = centerY - dropPxR;
  const cx = sx + secW / 2;
  const section = `<path d="M ${sx} ${sy} L ${sx + secW} ${sy} L ${sx + secW} ${sy + secH} L ${sx} ${sy + secH} Z" fill="${FILL_EXT}" stroke="${STROKE}" stroke-width="1.5"/><path d="M ${sx + swtL} ${basinTop} L ${sx + secW - swtR} ${basinTop} L ${sx + secW - swtR} ${rightEdgeY} L ${cx} ${centerY} L ${sx + swtL} ${leftEdgeY} Z" fill="white" stroke="${STROKE}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const drainSecSvg = `<circle cx="${cx}" cy="${centerY - 3}" r="3.5" fill="none" stroke="${STROKE}" stroke-width="1"/>`;
  const pitchLabel =
    (pitchLeft > 0 ? `<text x="${sx + secW * 0.26}" y="${leftEdgeY - 6}" font-size="10" fill="${DIM}" font-family="monospace" font-style="italic">שיפוע ${pitchLeft}%</text>` : '') +
    (pitchRight > 0 ? `<text x="${sx + secW * 0.64}" y="${rightEdgeY - 6}" font-size="10" fill="${DIM}" font-family="monospace" font-style="italic">${pitchRight}%</text>` : '');
  const mountLabel = spec.mount === 'wall' ? 'תלוי קיר (ללא משטח)' : 'מונח על משטח';
  const wallHatch = spec.mount === 'wall'
    ? `<line x1="${sx - 12}" y1="${sy - 4}" x2="${sx - 12}" y2="${sy + secH + 4}" stroke="${STROKE}" stroke-width="2"/>` + Array.from({ length: 8 }).map((_, i) => `<line x1="${sx - 12}" y1="${sy - 4 + i * ((secH + 8) / 7)}" x2="${sx - 22}" y2="${sy - 4 + i * ((secH + 8) / 7) + 8}" stroke="${STROKE}" stroke-width="1"/>`).join('')
    : `<line x1="${sx - 4}" y1="${sy + secH}" x2="${sx + secW + 4}" y2="${sy + secH}" stroke="${STROKE}" stroke-width="2"/>`;

  // section dimension chain: left wall / inner / right wall (overall length is on the TOP view)
  const innerLen = Math.max(0, spec.lengthMm - wallL - wallR);
  const dimBreakY = sy + secH + 40;
  const sectionDims =
    dimLineH(sx, sx + swtL, dimBreakY, wallL + '') +
    dimLineH(sx + swtL, sx + secW - swtR, dimBreakY, innerLen + '') +
    dimLineH(sx + secW - swtR, sx + secW, dimBreakY, wallR + '');

  // ---------- FOOTER ----------
  const pitchSummary = (pitchLeft > 0 || pitchRight > 0)
    ? ' · שיפוע: ' + (pitchLeft === pitchRight ? pitchLeft + '%' : pitchLeft + '%/' + pitchRight + '%')
    : '';
  const drainRSummary = drainR > 0 ? ' R' + drainR : '';
  const siphonLine = `<text x="90" y="${PAGE_H - 32}" font-size="12" fill="${STROKE}">סיפון: ${spec.stoneSiphonCover ? 'מאבן תואמת' : 'סטנדרטי'}</text>`;

  return `<svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif"><rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="white"/><text x="${PAGE_W / 2}" y="34" text-anchor="middle" font-size="18" font-weight="600" fill="${STROKE}">${esc(spec.modelName || 'כיור שיש')}</text><text x="${PAGE_W / 2}" y="54" text-anchor="middle" font-size="12" fill="${DIM}">שרטוט ייצור · מידות במ"מ</text><text x="${topBoxX}" y="${topBoxY - 12}" font-size="13" font-weight="600" fill="${STROKE}">מבט על (TOP)</text><polygon points="${pts}" fill="${FILL_EXT}" stroke="${STROKE}" stroke-width="1.5"/><polygon points="${innerPts}" fill="${FILL_INT}" stroke="${STROKE}" stroke-width="1" stroke-dasharray="4 2"/>${drainSvg}${drainRLabel}${tapSvg}${dimLineH(ox, ox + Lpx, oy + Wpx + 24, spec.lengthMm + '')}${dimLineV(oy, oy + Wpx, ox - 22, spec.widthMm + '')}<text x="${secBoxX}" y="${secBoxY - 12}" font-size="13" font-weight="600" fill="${STROKE}">חתך צד (SECTION)</text>${section}${drainSecSvg}${pitchLabel}${wallHatch}${dimLineV(sy, sy + secH, sx + secW + 24, spec.heightMm + '')}${sectionDims}<text x="${sx + secW / 2}" y="${sy + secH + 18}" text-anchor="middle" font-size="11" fill="${DIM}">${esc(mountLabel)}</text><text x="90" y="${PAGE_H - 90}" font-size="13" font-weight="600" fill="${STROKE}">חומרים ואפשרויות</text><rect x="90" y="${PAGE_H - 80}" width="16" height="16" fill="${FILL_EXT}" stroke="${STROKE}"/><text x="114" y="${PAGE_H - 68}" font-size="12" fill="${STROKE}">חוץ: ${esc(spec.exteriorStone || '—')}</text><rect x="90" y="${PAGE_H - 56}" width="16" height="16" fill="${FILL_INT}" stroke="${STROKE}"/><text x="114" y="${PAGE_H - 44}" font-size="12" fill="${STROKE}">פנים (אגן): ${esc(spec.interiorStone || '—')}</text>${siphonLine}<text x="90" y="${PAGE_H - 8}" font-size="12" fill="${STROKE}">ניקוז: ${spec.drain === 'linear' ? 'תעלה' : 'עגול'}${drainRSummary} · ברז: ${spec.tapHole ? 'כן' : 'לא'} · התקנה: ${spec.mount === 'wall' ? 'קיר' : 'משטח'} · עומק אגן: ${spec.basinDepthMm} מ"מ${pitchSummary}</text></svg>`;
}
