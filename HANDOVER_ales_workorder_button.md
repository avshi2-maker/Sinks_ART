# HANDOVER — Ales Work-Order button not appearing (Marble Art CRM)

## STATUS: Code is correct and compiles. Button does not render in browser. This is a DEPLOYMENT/CACHE issue, not a code issue.

---

## WHAT WE BUILT (this session, working & pushed earlier)
1. **Material calculator** (`/material-calc`) — sink dims → 8-panel deployment → sheets + leftover → Trabelsi cost. Verified vs Trabelsi line #3 (₪2,579 exact match). COMMITTED & PUSHED (commit after fe6cb40).
2. **Ales work-order VIEW** (`/po/[id]/ales`) — simplified phone/print shop sheet of a PO. COMMITTED & PUSHED.
3. **Option A pipeline** — a "📋 הוראת עבודה" button on each saved sketch card in the gallery (`/demos`) that calls `createWorkOrderFromSketch(demo.id)` → creates a PO carrying the sketch SVG+spec → routes to `/po/[id]/ales`. **THIS BUTTON IS THE PROBLEM — NOT SHOWING, AND NOT YET COMMITTED/PUSHED.**

## THE TWO FILES INVOLVED (Option A)
- `src/lib/po/createWorkOrderFromSketch.ts` — server action (NEW). CONFIRMED PRESENT on disk (base64-written this session).
- `src/components/demos/DemoCard.tsx` — the gallery card. Button added via 3 PowerShell string-replace edits (2A import, 2B handler, 2C button). ALL 3 CONFIRMED PRESENT via Select-String, and `npx tsc --noEmit` shows ZERO errors.

## VERIFICATION ALREADY DONE (all PASSED)
```
YES import (createWorkOrderFromSketch)
YES handler (makeWorkOrder)
YES button (הוראת עבודה)
YES action file (src/lib/po/createWorkOrderFromSketch.ts)
tsc --noEmit: no errors in DemoCard/createWorkOrder
```
The button JSX is at DemoCard.tsx line ~227, INSIDE the `{isSketch ? (...)}` block, right after the PDF button (line 226). Since the cards visibly show PNG + PDF buttons, the new button is in the same block and SHOULD render beside them.

## WHY IT STILL DOESN'T SHOW — LIKELY CAUSES (in priority order)
1. **Viewing the LIVE site, not localhost.** The changes were NEVER committed/pushed. `crm.marble-art.co.il` (Vercel) runs OLD code. Dev ran `npm run dev` on localhost:3000 (confirmed "Ready in 689ms", GET /demos 200). **If Avshi's browser was on crm.marble-art.co.il, the button will NEVER show there until `git push`.** THIS IS THE #1 SUSPECT.
2. **Browser cache** on localhost — needs Ctrl+Shift+R, or the browser served a cached bundle.
3. **Possible broken character** from the 2C PowerShell string-replace (Hebrew "הוראת עבודה" written via `.Replace()` — if encoding corrupted the emoji 📋 or the button attribute, React could silently skip it, though tsc passed).

## THE FIX (do these IN ORDER, stop when button appears)

### Step 1 — Verify on localhost FIRST
Open browser to EXACTLY: `http://localhost:3000/demos`
(NOT crm.marble-art.co.il). Filter to שרטוטים. Look for 📋 הוראת עבודה next to PDF on each sketch card.
- If PRESENT → skip to Step 4 (push live).
- If ABSENT → Step 2.

### Step 2 — Guaranteed-correct file replacement (bypasses any string-replace corruption)
The CORRECT full DemoCard.tsx is provided as base64 in `DemoCard_b64.txt`. Replace the file wholesale:
```powershell
cd C:\SinkS\Sinks_ART
# paste the FULL base64 string from DemoCard_b64.txt as $b64 (one line), then:
[System.IO.File]::WriteAllBytes("$PWD\src\components\demos\DemoCard.tsx", [System.Convert]::FromBase64String($b64))
Write-Host "DemoCard replaced"
```
(base64 is 17,568 chars — deliver via a downloadable .ps1 or split into chunks if paste truncates.)

### Step 3 — Clean rebuild
```powershell
# Terminal 1: stop server (Ctrl+C), then:
cd C:\SinkS\Sinks_ART
Remove-Item -Recurse -Force .next
npm run dev
```
Wait "Ready", hard-refresh localhost:3000/demos (Ctrl+Shift+R).

### Step 4 — Commit & push to live (REQUIRED — nothing is on live yet)
```powershell
cd C:\SinkS\Sinks_ART
git add src/lib/po/createWorkOrderFromSketch.ts src/components/demos/DemoCard.tsx
git commit -m "Option A: Ales work order from saved sketch (button on gallery card)"
git push
```
Wait ~2 min for Vercel, hard-refresh crm.marble-art.co.il/demos.

## FILES PROVIDED IN THIS HANDOVER
- `DemoCard_CORRECT.tsx` — the correct full component (13KB)
- `createWorkOrderFromSketch_CORRECT.ts` — the correct server action
- `DemoCard_b64.txt` — base64 of DemoCard for reliable inline write

## KEY FACTS FOR NEXT SESSION
- CRM repo: `C:\SinkS\Sinks_ART` → Vercel `sinks-art` → `crm.marble-art.co.il`
- Downloads land in CRM ROOT; move with Move-Item. THIS SESSION downloads FAILED — used base64 inline writes instead.
- Supabase `givcxgzhfoetujhrjgvc`, Cloudinary `dqdku88vv`
- Sketches saved to `demo_trials` table, kind='sketch', with sketch_svg + inputs_jsonb (spec) + customer_id + project_id.
- The Ales view (`/po/[id]/ales`) reads sketch_svg + sketch_spec from the PO. It ALREADY WORKS — just needs a PO that carries a sketch (which the button creates).

## STILL OPEN AFTER BUTTON WORKS (parked / next)
- Wire material-calc output (panels/sheets/leftover) INTO the Ales work order (currently shows sketch + generic build steps, not the specific cut list).
- IDEAS parked: material-calc option B (sketch-linked dims), metal-hanger design module, offers-tab cleanup + nav rearrange, offer-builder Phase C draft export, editable project rows.
- Google Ads auto-stops July 5.
