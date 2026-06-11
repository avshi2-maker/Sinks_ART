// src/lib/sketch/sketchRenderer.ts
// Pure SVG technical-sketch generator for marble sink shop drawings.

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
}

const PAGE_W = 800;
const PAGE_H = 620;
const PX_PER_MM = 0.42;
const STROKE = '#1e293b';
const DIM = '#64748b';
const FILL_EXT = '#f1f5f9';
const FILL_INT = '#e2e8f0';
const INT_LINE = '#94a3b8';

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
    case 'square':
    case 'rectangle':
    case 'custom':
    default:
      return [{ x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: W }, { x: 0, y: W }];
  }
}

function dimLine(x1: number, y1: number, x2: number, y2: number, label: string, above: boolean): string {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const off = above ? -8 : 14;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${DIM}" stroke-width="1"/><line x1="${x1}" y1="${y1 - 4}" x2="${x1}" y2="${y1 + 4}" stroke="${DIM}" stroke-width="1"/><line x1="${x2}" y1="${y2 - 4}" x2="${x2}" y2="${y2 + 4}" stroke="${DIM}" stroke-width="1"/><text x="${mx}" y="${my + off}" text-anchor="middle" font-size="12" fill="${DIM}" font-family="monospace">${esc(label)}</text>`;
}

export function renderSinkSketch(spec: SketchSpec): string {
  const poly = topPolygon(spec);
  const ox = 70, oy = 90;
  const pts = poly.map((p) => `${ox + p.x * PX_PER_MM},${oy + p.y * PX_PER_MM}`).join(' ');
  const Lpx = spec.lengthMm * PX_PER_MM;
  const Wpx = spec.widthMm * PX_PER_MM;
  const wt = spec.wallThicknessMm * PX_PER_MM;
  const innerPts = poly.map((p) => {
    const cx = spec.lengthMm / 2, cy = spec.widthMm / 2;
    const dx = p.x < cx ? wt : -wt;
    const dy = p.y < cy ? wt : -wt;
    return `${ox + p.x * PX_PER_MM + dx},${oy + p.y * PX_PER_MM + dy}`;
  }).join(' ');
  const drainCx = ox + Lpx / 2, drainCy = oy + Wpx / 2;
  const drainSvg = spec.drain === 'linear'
    ? `<rect x="${drainCx - 18}" y="${drainCy - 3}" width="36" height="6" rx="2" fill="none" stroke="${STROKE}" stroke-width="1.2"/>`
    : `<circle cx="${drainCx}" cy="${drainCy}" r="5" fill="none" stroke="${STROKE}" stroke-width="1.2"/>`;
  const tapSvg = spec.tapHole
    ? `<circle cx="${ox + Lpx / 2}" cy="${oy + 12}" r="4" fill="none" stroke="${STROKE}" stroke-width="1.2"/><text x="${ox + Lpx / 2 + 10}" y="${oy + 15}" font-size="10" fill="${DIM}" font-family="monospace">חור ברז</text>`
    : '';
  const sx = 470, sy = 110;
  const secW = Math.min(spec.lengthMm * PX_PER_MM, 260);
  const secH = spec.heightMm * PX_PER_MM * 1.6;
  const basinH = spec.basinDepthMm * PX_PER_MM * 1.6;
  const swt = spec.wallThicknessMm * PX_PER_MM;
  const section = `<path d="M ${sx} ${sy} L ${sx + secW} ${sy} L ${sx + secW} ${sy + secH} L ${sx + secW - swt} ${sy + secH} L ${sx + secW - swt} ${sy + basinH} L ${sx + swt} ${sy + basinH + 6} L ${sx + swt} ${sy + secH} L ${sx} ${sy + secH} Z" fill="${FILL_EXT}" stroke="${STROKE}" stroke-width="1.5" stroke-linejoin="round"/><line x1="${sx + swt}" y1="${sy + basinH}" x2="${sx + secW - swt}" y2="${sy + basinH}" stroke="${INT_LINE}" stroke-width="1" stroke-dasharray="3 2"/>`;
  const mountLabel = spec.mount === 'wall' ? 'תלוי קיר (ללא משטח)' : 'מונח על משטח';
  const wallHatch = spec.mount === 'wall'
    ? `<line x1="${sx - 14}" y1="${sy - 6}" x2="${sx - 14}" y2="${sy + secH + 6}" stroke="${STROKE}" stroke-width="2"/>${Array.from({ length: 7 }).map((_, i) => `<line x1="${sx - 14}" y1="${sy - 6 + i * ((secH + 12) / 6)}" x2="${sx - 24}" y2="${sy - 6 + i * ((secH + 12) / 6) + 8}" stroke="${STROKE}" stroke-width="1"/>`).join('')}`
    : `<line x1="${sx - 6}" y1="${sy + secH}" x2="${sx + secW + 6}" y2="${sy + secH}" stroke="${STROKE}" stroke-width="2"/>`;
  return `<svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif"><rect x="0" y="0" width="${PAGE_W}" height="${PAGE_H}" fill="white"/><text x="${PAGE_W / 2}" y="34" text-anchor="middle" font-size="18" font-weight="600" fill="${STROKE}">${esc(spec.modelName || 'כיור שיש')}</text><text x="${PAGE_W / 2}" y="54" text-anchor="middle" font-size="12" fill="${DIM}">שרטוט ייצור · מידות במ"מ</text><text x="${ox}" y="${oy - 16}" font-size="13" font-weight="600" fill="${STROKE}">מבט על (TOP)</text><polygon points="${pts}" fill="${FILL_EXT}" stroke="${STROKE}" stroke-width="1.5"/><polygon points="${innerPts}" fill="${FILL_INT}" stroke="${STROKE}" stroke-width="1" stroke-dasharray="4 2"/>${drainSvg}${tapSvg}${dimLine(ox, oy + Wpx + 26, ox + Lpx, oy + Wpx + 26, spec.lengthMm + '', false)}${dimLine(ox - 26, oy, ox - 26, oy + Wpx, spec.widthMm + '', false)}<text x="${sx}" y="${sy - 16}" font-size="13" font-weight="600" fill="${STROKE}">חתך צד (SECTION)</text>${section}${wallHatch}${dimLine(sx + secW + 22, sy, sx + secW + 22, sy + secH, spec.heightMm + '', false)}<text x="${sx + secW / 2}" y="${sy + secH + 28}" text-anchor="middle" font-size="11" fill="${DIM}">${esc(mountLabel)}</text><text x="70" y="${PAGE_H - 110}" font-size="13" font-weight="600" fill="${STROKE}">חומרים ואפשרויות</text><rect x="70" y="${PAGE_H - 100}" width="16" height="16" fill="${FILL_EXT}" stroke="${STROKE}"/><text x="94" y="${PAGE_H - 88}" font-size="12" fill="${STROKE}">חוץ: ${esc(spec.exteriorStone || '—')}</text><rect x="70" y="${PAGE_H - 76}" width="16" height="16" fill="${FILL_INT}" stroke="${STROKE}"/><text x="94" y="${PAGE_H - 64}" font-size="12" fill="${STROKE}">פנים (אגן): ${esc(spec.interiorStone || '—')}</text><text x="70" y="${PAGE_H - 40}" font-size="12" fill="${STROKE}">ניקוז: ${spec.drain === 'linear' ? 'תעלה' : 'עגול'} · ברז: ${spec.tapHole ? 'כן' : 'לא'} · התקנה: ${spec.mount === 'wall' ? 'קיר' : 'משטח'} · עומק אגן: ${spec.basinDepthMm} מ"מ</text></svg>`;
}