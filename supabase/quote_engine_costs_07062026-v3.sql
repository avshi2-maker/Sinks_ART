-- quote_engine_costs_07062026-v3.sql
-- Phase 27 extension — supplier COST + MARGIN on the EXISTING quote engine
--                      + Phase 22 customer-list cleanup columns.
--
-- Adopts the existing quotes / quote_lines tables (built Session 22). Does NOT
-- recreate them, does NOT add a status constraint (status enum is English and
-- enforced in TypeScript — the Hebrew constraint was the v2 failure).
--
-- PURELY ADDITIVE: only ADD COLUMN IF NOT EXISTS. No drops, no renames, no data
-- loss. Safe to run repeatedly. Run ONCE in the Supabase SQL editor.
-- Column count after this runs:  quotes = 30,  quote_lines = 15.

-- ============================================================
-- Part A — customer-list cleanup support
-- ============================================================
alter table public.customers
  add column if not exists archived_at timestamptz,
  add column if not exists is_sample boolean not null default false;

comment on column public.customers.archived_at is
  'Soft-archive timestamp. NULL = active. Hides from lists WITHOUT deleting data.';
comment on column public.customers.is_sample is
  'TRUE = demo/test row from the build. Eligible for hard delete behind a confirm.';

-- ============================================================
-- Part B1 — supplier cost on each quote line (INTERNAL only)
-- existing `unit_cost` = price charged to the CUSTOMER (drives line_total).
-- new `supplier_cost`  = what Ales / Trabelsi charge US, per unit.
-- ============================================================
alter table public.quote_lines
  add column if not exists supplier_cost  numeric not null default 0,
  add column if not exists supplier_label text;   -- 'Ales' | 'Trabelsi' | 'אבשי' | null

comment on column public.quote_lines.supplier_cost is
  'INTERNAL cost per unit (Ales / Trabelsi). Never shown to the customer. Drives margin.';
comment on column public.quote_lines.supplier_label is
  'Who quoted the supplier_cost: Ales / Trabelsi / אבשי / null.';

-- generated internal total per line (added AFTER supplier_cost exists)
alter table public.quote_lines
  add column if not exists line_supplier_total numeric
    generated always as (quantity * supplier_cost) stored;

-- ============================================================
-- Part B2 — internal totals + internal notes on the quote
-- mirrors the existing total_subtotal / total_vat / total_grand convention.
-- ============================================================
alter table public.quotes
  add column if not exists total_cost        numeric not null default 0,  -- sum of line_supplier_total
  add column if not exists total_margin      numeric not null default 0,  -- total_subtotal - total_cost
  add column if not exists internal_notes_he text;                        -- never shown to customer

comment on column public.quotes.total_cost is
  'INTERNAL: sum of supplier line totals (what the job costs Avshi). Never shown to the customer.';
comment on column public.quotes.total_margin is
  'INTERNAL: total_subtotal (customer price, pre-VAT) minus total_cost.';
comment on column public.quotes.internal_notes_he is
  'INTERNAL notes (e.g. Ales terms, lead-time). Never shown to the customer.';
