# MARBLE ART CRM — SESSION HANDOVER
_Written: 05 July 2026 EVENING (Ferrari + Trabelsi PO session) · supersedes HANDOVER_05072026.md_

## HOW WE WORK (Avshi's standing rules — respect exactly)
Avshi is NOT a coder — copy-paste + architect (application, flow, ideas). ENGLISH correspondence,
HEBREW applications. Files as DOWNLOADS + PowerShell move block. **DOWNLOADS LAND IN PROJECT ROOT
(C:\SinkS\Sinks_ART), NOT %USERPROFILE%\Downloads — check root FIRST in every move block (memory #28).**
ONE command per message. Business questions separate. Million small pieces. NOTHING deleted without
item-by-item approval. NO handovers until Avshi asks for break. Backups /_backups/. Long terminal
pastes auto-convert to empty attachments — request PLAIN TEXT chunked (-TotalCount / -Skip).

## ⚠️ SCAR-TISSUE LESSONS (full list — apply from the start)
1. "Don't see my change" → ask which URL + page first.
2. Sketch browser-only until שמור לגלריה + green ✓.
3. Downloads delivery only; git status before commit.
4. Type file lands before consumer.
5. Backups never in src/.
6. Never `npm run build` while dev server runs; stale .next after route moves → delete .next, rebuild.
7. Emoji anchors FAIL in console edits → ASCII anchors + base64 Hebrew + line-index inserts.
8. Hebrew PDFs: wkhtmltopdf dir=rtl, never cairosvg.
9. .Replace() → count anchors first, abort if ≠1.
10. DB check constraints must include app enum values from day one.
11. 'use server' files export ONLY async functions.
12. **NEW: nav prefix collisions** — `startsWith('/sketch')` also matches '/sketch-to-offer'. Use
    exact-boundary isPath (=== or startsWith(href+'/')). Bit us: תמחור והצעות tab looked dead.

## ✅ SHIPPED THIS SESSION (huge)
### FERRARI NAV (Avshi-approved structure, live)
5 groups by money flow: 1·פניות ולקוחות (pipeline/leads/sinc/intake/customers/sites) · 2·עיצוב
(sketch/demos/prompt-builder) · 3·תמחור והצעות (sketch-to-offer/material-calc/ales-settings/quotes/
arvo-offer/offers-sent) · 4·ייצור ורכש (po/trabelsi-po/suppliers) · 5·כסף ונתונים (roi/marble).
isPath exact matching. File: src/components/shared/WorkflowNav.tsx.
**9 pages RETIRED** to _backups\retired_pages_05072026\: offer-builder, price-breaks, rfq-create,
rfq/[token], options, door-catalog, addons, doors, gallery. Build verified green (after .next purge).
Mystery: /tasks still appears in build route list but no src/app/tasks folder — investigate later.

### TRABELSI PO MODULE (2nd Ziv-readiness document — COMPLETE)
/trabelsi-po in ייצור ורכש. Two tabs:
- 🛒 builder: picks sketches w/ material_calc_snapshot (both Goldman sinks have one), combined sheet
  order + nesting hint (7→6 ask Ales), editable qty/price/crate/delivery/notes, printable Hebrew PO
  (notes = prominent amber ⚠️ block — color # is THE critical spec), WhatsApp + 📋 copy-to-ARVO.
- 📋 register: trabelsi_orders table (SQL done, RLS anon), TRB-YYYY-NNNN numerator, date+time stamps,
  6 status ticks (draft/sent/approved/paused/supplied/archived), free remarks per row, 👁️ frozen text,
  📋 copy, ✏️ EDIT-IN-PLACE (same TRB updates, updated_at stamps).
Files: src/lib/purchasing/{trabelsiPoData,trabelsiOrders}.ts,
src/components/purchasing/{TrabelsiPoBuilder,TrabelsiOrdersRegister,TrabelsiPoTabs}.tsx,
src/app/trabelsi-po/page.tsx. First real order saved: TRB-2026-0001 (both sinks, 7 sheets, ₪6,895,
גוון 610977). ARVO-template paste flow verified by Avshi (ARVO-20260705-1714 screenshot).

## 💰 ZIV-READINESS: COMPLETE ✅
If Ziv sends a PO: (1) Ales work order = engine (inputs remembered per sketch) → 🔧 → 3-page doc.
(2) Trabelsi PO = /trabelsi-po → tick both sinks → TRB number → print/WhatsApp (color 610977 bold).
Deal state: 213 ₪12,800 SENT · 295 ₪20,983 ready (MARB-2026-7599) · package ₪32,433 after ₪1,350
shared-transport discount (needs Ales OK). Ziv mail draft delivered earlier today.

## 🔴 NEXT SESSION (priority order)
1. Dashboard link audit — dashboard may still link to retired routes (broken links possible).
2. /tasks route mystery.
3. ROI פעילות panel cleanup (customers 25 / leads 16 — archive pattern, item-by-item approval).
4. Then Avshi picks from IDEAS_PARKING (likely #14 sketch→Nano Banana or #15 Instagram revival).

## BUSINESS FOLLOW-UPS (Avshi, not code)
A. WhatsApp Ales: ₪1,350 two-sink transport saving OK? B. Ask Ales: nest 213 into 295 leftover
(7→6 sheets)? C. Send Ziv the two-sink mail (draft ready). D. Send Trabelsi TRB-2026-0001 when ready.

## RESTART
Fresh chat: "Marble Art CRM, continuing. Read HANDOVER_05072026_EVENING.md in repo root C:\SinkS\Sinks_ART."
