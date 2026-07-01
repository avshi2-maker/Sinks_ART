# MARBLE ART CRM — BOT ORIENTATION & PENDING TASKS
_Last updated: 01 July 2026 · for fast onboarding of any new session_

---

## WHO / HOW (read first)
- **Avshi Sapir**, 72, Israeli, Ironman triathlete. **Non-coder "copy-paste architect"** — plans/architects, pastes commands one at a time. Correspondence with him in **ENGLISH**; all apps/documents in **HEBREW RTL**.
- Business: **Marble Art** — artisan porcelain/marble sinks + flush marble doors. Partner **Ales** (fabricator, ARVO brand) gives turnkey labor prices; Avshi is **back-office** (adds materials, addons, install, markup=commission).
- His skill `marble-art-sinks` auto-loads with project context. Do NOT apply his other-project conventions (var-only JS, sbQ, single-file HTML) here — this project is modern TypeScript + proper folders.

## WORKING RULES (non-negotiable)
1. **One command / one PowerShell block per message.** Each block starts with `cd C:\SinkS\Sinks_ART`.
2. **File delivery:** downloads land in CRM ROOT → move with `Move-Item -LiteralPath` (use `-LiteralPath` for `[id]` bracket folders). **If downloads fail (recurring!), deliver via base64 inline write** — do NOT waste time retrying downloads.
3. **Type-check before delivering:** `npx tsc --noEmit` in the clone at `/home/claude/Sinks_ART`.
4. **SQL** always in Supabase SQL Editor, never PowerShell. Run SQL BEFORE code that queries new columns.
5. **`'use server'` files export ONLY async functions** — put types/consts in a plain module (pattern: `offerTypes.ts`). This trap bit us; respect it.
6. **Turbopack JSX:** opening tag + `>` on ONE line.
7. **New tables need anon RLS:** `alter table X enable row level security; create policy "anon all X" on X for all to anon using(true) with check(true);`
8. **Never delete without explicit approval.** Slow & bug-free > fast & risky. Plan first, then A-to-Z.
9. **Pick best+safe option for technical decisions, state rationale in 1-2 sentences.** Only ask Avshi business/UX/environment questions.

## ⚠️ #1 DEBUG LESSON (cost an hour this session)
When Avshi says "I don't see my change," the FIRST question is ALWAYS:
**(a) which URL are you viewing — `localhost:3000` or the LIVE `crm.marble-art.co.il`? and (b) is it committed AND pushed?**
The live Vercel site only updates on `git push`. `npm run dev` only changes localhost. Do NOT prescribe rebuilds/hard-refreshes before confirming URL + push state. Verify the RENDERED browser, not just "text is in the file" (Select-String) + "compiles" (tsc) — both can pass while the browser shows old code.

## PDF/HEBREW LESSON (cost this session)
**cairosvg mangles Hebrew RTL** (letters correct, word ORDER reversed). For any Hebrew PDF, build as **HTML (dir="rtl")** and render with **wkhtmltopdf** — it does bidi correctly. Always VERIFY by rasterizing the final PDF back to PNG and reading the Hebrew before delivering. Hebrew font: Noto Sans Hebrew in `~/.fonts`.

---

## STACK & COORDINATES
- **CRM repo (private):** `avshi2-maker/Sinks_ART` at `C:\SinkS\Sinks_ART` → Vercel `sinks-art` → **crm.marble-art.co.il**
- **Public site:** `avshi2-maker/sinks-bathroom-design` at `C:\SinkS\sinks-bathroom-design` → Vercel `sinks-bathroom-design` → **marble-art.co.il**
- Both: **Next.js 16 + Turbopack + TS + Tailwind**, Hebrew RTL. SHARE **Supabase `givcxgzhfoetujhrjgvc`** + **Cloudinary `dqdku88vv`**. Vercel team `avshis-projects-7969f3cd`.
- Reference clone for type-checking: `/home/claude/Sinks_ART` (may be stale — real state is on Avshi's machine).
- Two terminals: **T1** = `npm run dev` (leave running), **T2** = paste commands.

## CRM MAP — key routes/tabs
- **לוח היום** (`/dashboard`) — command-center: active projects → primary contact + correspondence status (stale >7d flagged red).
- **לקוחות** (`/customers`, `/customers/[id]`) — accounts. Each has a **contacts panel** (multi-contact: owner/supervisor/architect, one ★ primary) + projects + comms history.
- **עבודות** — work/sites.
- **הצעות וייצור** (offers group) — `price-breaks` (🏷️ מחירון אלס), `offer-builder` (🧮 בונה הצעה), `material-calc` (📐 מחשבון חומר), `rfq-create`, `arvo-offer`, `offers-sent`, `quotes`, `po` (הזמנות ייצור).
- **עיצוב והדמיה** (design group) — `sketch` (📐 שרטוט builder), `prompt-builder` (🖼️ הדמיה/Nano), `demos` (🎨 גלריה — saved sketches + AI renders).
- **קטלוגים ונתונים** — catalogs, `roi` (ROI dashboard), suppliers, doors.

## KEY DATA MODELS
- **customers** (accounts) + **customer_contacts** (multi-contact, is_primary, title check-constraint) + **projects** (status 8-value check constraint) + **customer_communications** (comm_type incl 'email'/'whatsapp').
- **quotes** (total_grand/total_cost/**total_margin**) — ROI reads total_margin as commission. Offer-builder saves here. source check-constraint includes 'offer-builder'.
- **ales_price_breaks** — Ales turnkey by config (1.0m=6000, 1.5m=7000, 2.0m=8000, >2.0m=10000, double+2000).
- **trabelsi_material_settings** — single row (sheet 270×120, 199₪/m², crate 980, delivery 350, VAT 18).
- **demo_trials** — kind='sketch' rows carry sketch_svg + inputs_jsonb(spec) + customer_id + project_id.
- **projects.status** lives in 4 places (DB constraint + PROJECT_STATUSES + ProjectStatusBadge + date triggers) — change all when adding a status. Valid: ליד · שיחת בירור · הצעת מחיר נשלחה · אושר · שולמה מקדמה · תשלום מלא · הסתיים · אבוד.

## PRICING / OFFER FLOW (Avshi's real workflow)
```
RFQ לאלס → Ales gives ONE turnkey labor # → Avshi builds customer price:
  base (Ales) + porcelain/material + addons + install + extras + MARKUP(=commission)
  → offer-builder saves to quotes (margin→ROI) → copy text → paste into ARVO template → PDF → send
  → track (offers-sent) → הזמנת ייצור only IF customer approves
```
Material cost comes from **material-calc**: sink dims → 8-panel flat deployment → ×2 laminate → +waste/miter/slope → m² needed → whole sheets → leftover → Trabelsi cost. (Verified: Goldman 2.70 = 4 sheets/12.96m², ₪2,579 material — matched Trabelsi exactly.)

---

## BUILT THIS SESSION (all pushed EXCEPT the one open bug)
- ✅ Phases 1-4 multi-contact system + dashboard command-center
- ✅ Goldman/MassadOZ live-data migration (merged דודו+Ziv → one account, Ziv ★ primary, both מפקח at מסד עוז; project "נחום גולדמן — כיור 2.70")
- ✅ Offer builder (base+components+commission → quotes → ROI, verified ₪ landed in ROI)
- ✅ Material calculator (Trabelsi-verified)
- ✅ Ales work-order VIEW (`/po/[id]/ales`) — stripped phone/print shop sheet
- ✅ Corrected sink sketch PDF + metal support engineering draft PDF for Ziv (HTML/wkhtmltopdf, Hebrew verified)

---

## PENDING TASKS (priority order)

### 🔴 OPEN BUG — finish first
**Ales work-order button on gallery sketch cards not visible.** Code is CORRECT & compiles (verified). Almost certainly: viewing LIVE site while change was never pushed, OR browser cache. FIX: (1) check `localhost:3000/demos` vs live; (2) `git add src/lib/po/createWorkOrderFromSketch.ts src/components/demos/DemoCard.tsx && git commit && git push`; (3) if still missing on localhost, replace DemoCard wholesale (base64 saved in prior handover). See `HANDOVER_ales_workorder_button.md`.

### 🟠 NEXT MODULES / FEATURES
1. **Wire material-calc output INTO the Ales work order** — currently the Ales view shows sketch + generic build steps, NOT the specific cut list (4 sheets, 8 panels, 45° seams, m² needed). Close this loop so Ales gets a real cut sheet.
2. **Metal hanger design MODULE** (turn the one-off Ziv drawing into a live CRM tool) — from sink weight (finished area × 12mm × porcelain SG ~2400 / ~15kg-m² per 6mm) + water load → design load + SF → L-bracket geometry + count/spacing + anchor spec → engineered support drawing. MUST carry "verify with licensed structural engineer against real wall" note. Pairs with material calc.
3. **Clean up הצעות וייצור tab + nav rearrange** — retire הצעת מחיר מהירה (OLD) from dashboard; move `/quotes` (old report) OUT of nav → "open offers follow-up" on dashboard; nav flow: מחירון אלס → בונה הצעה → מחשבון חומר → הצעת ARVO → הצעות שנשלחו → הזמנות ייצור.
4. **Offer builder Phase C** — plain-doc draft export for two-phase ARVO flow (builder → clean editable draft → paste into ARVO → PDF). Copy-text works as interim.
5. **Material-calc option B** — pull dims from saved sketch (no re-typing); needs sketch-builder→DB dims read.
6. **Editable project rows** — add ✏️ to rename/edit projects from UI (had to use SQL this session).
7. **Fix messy עיצוב והדמיה sketch builder** — Avshi flagged /sketch as messy; awaits his specific pain point.

### 🟢 OPTIONAL FOLLOW-UPS
- Add Ziv's email to his contact card (ziv.a@massadoz.com) via ✏️ — enables 📧 click-to-email.
- Confirm both Goldman contact titles = מפקח.

## REAL-WORLD (non-code) REMINDERS
- **Google Ads auto-stops July 5** — check Contacts count, extend if 2+ leads.
- Ziv/Goldman waiting on verified Trabelsi slab data (physical Trabelsi visit — cash & carry, no data sheets by phone).
- Metal support + sketch PDFs ready to email Ziv (trust-builder for מסד עוז).

## GOAL AVSHI SET
"By end of tomorrow — CRM clean, smart & ready." On track: hardest pieces (offer→ROI chain, contacts, material calc) done. Remaining is mostly cleanup + wiring, which goes fast.
