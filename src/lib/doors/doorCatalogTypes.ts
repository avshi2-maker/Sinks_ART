// src/lib/doors/doorCatalogTypes.ts
// Pure types + constants + pricing for the flush-to-zero door module (NO 'use server').

export interface DoorStone {
  id: string;
  stone_id: string;
  name_he: string;
  swatch_hex: string;
  render_url: string | null;
  base_price_ils: number;
  price_per_sqm_ils: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface HandleOption {
  id: string;
  name_he: string;
  adder_ils: number; // CRM offer cost; public site treats handle as "preferred" only (no price shown)
}

export const HANDLE_OPTIONS: HandleOption[] = [
  { id: 'recessed', name_he: 'ידית שקועה', adder_ils: 0 },
  { id: 'blade', name_he: 'ידית להב', adder_ils: 1200 },
  { id: 'push_led', name_he: 'פתיחה בלחיצה + LED', adder_ils: 3500 },
  { id: 'biometric', name_he: 'קורא ביומטרי + קול', adder_ils: 6800 },
];

// Reference door size used by the catalog base price: 2000 x 1500 mm = 3.0 m².
export const DOOR_REF_WIDTH_MM = 1500;
export const DOOR_REF_HEIGHT_MM = 2000;
export const DOOR_REF_AREA_SQM = (DOOR_REF_WIDTH_MM / 1000) * (DOOR_REF_HEIGHT_MM / 1000);

export interface DoorPriceInput {
  basePriceIls: number;
  pricePerSqmIls: number;
  widthMm: number;
  heightMm: number;
  handleAdderIls?: number;
  qty?: number;
}

// Size-aware: base covers the reference area; area above it is charged per m².
export function computeDoorPrice(i: DoorPriceInput): number {
  const w = Math.max(0, i.widthMm) / 1000;
  const h = Math.max(0, i.heightMm) / 1000;
  const area = w * h;
  const extra = Math.max(0, area - DOOR_REF_AREA_SQM);
  const unit = i.basePriceIls + extra * i.pricePerSqmIls + (i.handleAdderIls || 0);
  const qty = Math.max(1, i.qty || 1);
  return Math.round(unit * qty);
}
