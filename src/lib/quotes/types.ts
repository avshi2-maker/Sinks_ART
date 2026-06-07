/**
 * src/lib/quotes/types.ts
 *
 * TypeScript types mirroring the quotes + quote_lines schema.
 * Used by data fetchers, server actions, and UI components.
 *
 * Phase 27a — Quote Engine, Stage 1 (Session 22, 10/05/2026)
 * Phase 27  — Cost/margin extension (07/06/2026): added supplier_cost,
 *             supplier_label, line_supplier_total on lines; total_cost,
 *             total_margin, internal_notes_he on quotes. Purely additive.
 */

// ── Enums ──────────────────────────────────────────────────────────────

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
export type QuoteSource = 'manual' | 'from_call' | 'from_intake' | 'imported';

/** Who quoted a line's supplier_cost (internal). */
export type QuoteSupplierLabel = 'Ales' | 'Trabelsi' | 'אבשי';

/**
 * Hebrew measurement units for quote line items.
 * Mirrors POF_UNITS from Beni's CRM, kept identical for cross-system consistency.
 *   ס"ע    — סעיף (clause/item)
 *   מ"ר    — square meter
 *   מ"ל    — linear meter
 *   יח'    — unit / each
 *   טון    — ton
 *   שעות   — hours
 *   פאושלי — flat rate
 *   קג     — kilogram
 *   מ"ק    — cubic meter
 */
export type QuoteUnit =
  | 'ס"ע'
  | 'מ"ר'
  | 'מ"ל'
  | "יח'"
  | 'טון'
  | 'שעות'
  | 'פאושלי'
  | 'קג'
  | 'מ"ק';

export const QUOTE_UNITS: readonly QuoteUnit[] = [
  'ס"ע', 'מ"ר', 'מ"ל', "יח'", 'טון', 'שעות', 'פאושלי', 'קג', 'מ"ק',
] as const;

// ── Database row shapes (one-to-one with table columns) ───────────────

export interface QuoteRow {
  id:                  string;
  quote_number:        string;
  customer_id:         string | null;
  project_id:          string | null;

  customer_name_he:    string | null;
  customer_phone:      string | null;
  customer_email:      string | null;
  customer_address:    string | null;

  project_title_he:    string | null;
  project_location_he: string | null;

  status:              QuoteStatus;

  vat_rate:            number;
  total_subtotal:      number;
  total_vat:           number;
  total_grand:         number;

  total_cost:          number;
  total_margin:        number;

  currency_code:       string | null;

  valid_until:         string | null;
  start_date:          string | null;
  end_date:            string | null;

  notes_he:            string | null;
  payment_terms_he:    string | null;
  internal_notes_he:   string | null;

  created_at:          string;
  updated_at:          string;
  sent_at:             string | null;
  approved_at:         string | null;
  rejected_at:         string | null;

  source:              QuoteSource;
}

export interface QuoteLineRow {
  id:                  string;
  quote_id:            string;
  line_number:         number;
  description_he:      string;
  unit:                QuoteUnit;
  quantity:            number;
  unit_cost:           number;
  vat_applies:         boolean;
  line_total:          number;

  supplier_cost:       number;
  supplier_label:      QuoteSupplierLabel | null;
  line_supplier_total: number;

  sink_id:             string | null;
  marble_sample_id:    string | null;
  created_at:          string;
}

// ── App-facing shapes (denormalized + UI-friendly) ────────────────────

export interface QuoteWithLines extends QuoteRow {
  lines: QuoteLineRow[];
}

export const QUOTE_STATUS_LABELS_HE: Record<QuoteStatus, string> = {
  draft:    'טיוטה',
  sent:     'נשלח',
  approved: 'אושר',
  rejected: 'נדחה',
  expired:  'פג תוקף',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft:    'bg-gray-100 text-gray-700 border-gray-200',
  sent:     'bg-blue-50 text-blue-800 border-blue-200',
  approved: 'bg-green-50 text-green-800 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  expired:  'bg-amber-50 text-amber-800 border-amber-200',
};
