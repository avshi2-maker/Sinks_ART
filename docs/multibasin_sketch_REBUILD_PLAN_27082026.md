# שרטוט ייצור — Multi-Basin Rebuild · Spec & Plan
_Living spec · created 27/08/2026 · pairs with `docs/multibasin_sketch_mockup_27082026.html`_

## Why
Current `SketchBuilder` only supports 1–2 basins (the "כיור כפול" checkbox). A live project
(public restroom: **נשים = 6 sinks**, **גברים = 4 sinks** on a ~470cm run) needs 1–10 basins in
one build, two models per project, and customer-selectable build styles. The mockup proves the
target UX end-to-end; this doc is the build spec.

## New capabilities (all demonstrated in the mockup)
1. **Basin count 1–10** stepper — replaces the 2-max checkbox.
2. **AI auto-split** — divides total length across N basins after reserving end walls + dividers,
   centers a drain per basin. Every row (basin width + slope) is **editable** (architect override),
   with a live sum-vs-length check. "חלוקה אוטומטית" / "איזון מחדש" re-balance.
3. **Floor type toggle** (per model): `pitched` (sloped 1–5% to drain) vs `flat` (straight 90°, no
   pitch — customer option). Flat locks the slope inputs and adds a drainage caveat note.
4. **Drainage layout toggle** (per model — the 2 customer options):
   - `perBasin` — separate basins, a drain each, full dividers.
   - `central` — one shared trough, single central drain, decorative (dashed) dividers, slopes
     converging to center. Shows a **one-drain length estimate**: run/side, fall to center, center
     depth, and a rule-of-thumb flag (>~3000mm ⇒ recommend 2 drains / separate basins).
5. **Multiple models per project** — a models array (נשים·6 / גברים·4 / + new). Sketch, amber
   engineering notes, and black TECHNICAL DATA footer all refresh **independently per model**.
6. **Marble sample picker** — exterior + interior swatches feed the imaging tint + footer.

## Pending decisions (do NOT hard-code until confirmed)
- **[CUSTOMER]** Option 1 (separate drained basins) vs Option 2 (shared trough, one drain).
  WhatsApp with pros/cons sent 27/08. Default recommendation: separate basins for intensive use.
- **[CUSTOMER/ARCHITECT]** Men's-room real length (mockup placeholder = 3200mm).
- **[CUSTOMER/ARCHITECT]** Round drain per basin vs one linear channel (תעלה).

## Data model (extend `SketchSpec` in `src/lib/sketch/sketchRenderer.ts`)
Add/confirm fields (keep back-compat defaults so old saved sketches still render):
```
basinCount: number            // 1..10 (was effectively 1..2)
basins?: { w:number; center:number; pitch:number; edited:boolean }[]  // the split
floorType?: 'pitched' | 'flat'      // default 'pitched'
drainMode?: 'perBasin' | 'central'  // default 'perBasin'
divider?: number                    // inter-basin wall thickness (mm)
```
`sanitizeSpec` already clamps pitch 1–5%, dims, wall≥8 — extend it to also normalise the `basins`
array to `basinCount` and to zero-out pitch when `floorType==='flat'`.

Persistence: `demo_trials` (kind='sketch') stores `inputs_jsonb` = spec + `sketch_svg`. The extended
spec is still one JSON blob, so no DB migration required for a single model. For **multiple models per
project**, either (a) save one `demo_trials` row per model (simplest, each already carries
`project_id`), or (b) add a `models` array inside one row's `inputs_jsonb`. Recommend (a) — one row
per model keeps the gallery + PO flow unchanged.

## Files to change
- `src/lib/sketch/sketchRenderer.ts` — generalise the 2-basin draw loop to N (it already loops for
  double-basin), add `drainMode` (single central drain + dashed dividers) and `floorType` (90° tag,
  no-slope), extend `sanitizeSpec`. **Pure geometry, unit-testable — do this first.**
- `src/components/sketch/SketchBuilder.tsx` — swap checkbox → count stepper; add split table
  (editable rows), floor-type + drain-mode toggles, one-drain estimate readout; models tab strip.
- `src/components/sketch/SaveSketchToGallery.tsx` — save current model; loop for "save all models".
- `src/lib/po/*` (`createWorkOrderFromSketch`) — carry basins[]/drainMode into the Ales work order
  cut list (ties into the already-queued "material-calc → Ales cut sheet" task).
- Whatsapp-to-Ales string builder — already prints walls/pitch; add per-basin split + drain mode.

## Phased delivery (canonical loop: plan → build + `npx tsc --noEmit` → deliver full files → commit per step → verify on prod)
- **Phase A — renderer core.** Extend `sketchRenderer.ts` + `sanitizeSpec` for N basins, floorType,
  drainMode. Ship with the existing builder still passing 1–2. Type-check green. Commit.
- **Phase B — builder UI.** Count stepper + editable split table + both toggles + one-drain estimate.
  Notes/footer refresh. Commit.
- **Phase C — multi-model.** Models tab strip; one `demo_trials` row per model; "save all". Commit.
- **Phase D — downstream.** Feed basins[]/drainMode into Ales work order + WhatsApp string. Commit.

Each phase is one verified, pushed commit (Rule #25). No file exceeds 1500 lines (Rule #7); if
`SketchBuilder.tsx` grows past it, split the split-table + toggles into a child component first.

## Guardrails
- Engineering notes are advisory; keep the "flat bottom / long single-drain doesn't self-drain" and
  ">4000mm may need a hidden slab seam" warnings — they protect us on delivery.
- All new UI Hebrew RTL; chat/code English (project rules).
