# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.

---

## 2026-06-02 — Infra Session — Supabase cost cleanup (GadiW + Beni archived) + TCM → SRC rebuild decision

### Goals
- Stop paying ~$10/mo Micro compute on idle Supabase projects without losing them
- Pull a COMPLETE offline backup (DB + storage) of each to PC + Google Drive before parking
- Decide TCM's future

### Done — billing diagnosis
- Pro org "Avshi Sapir -Projects 2025-2026" projected ~$55/mo = $25 Pro + ~$10/mo Micro compute x 4 active projects - $10 Pro compute credit.
- Billing is PER-ORG, not per-project. Sinks_Art must stay Pro (live + uses image transformations). Each extra ACTIVE project ~= $10/mo.

### Done — GadiW archived (pslwvkymccbngtyvgagj)
- Transferred to free "Avshi Sapir" org (Settings>General>Transfer, <500MB), then Paused. Off the bill.
- Backup to PC + Drive: bucket `gadi-documents` + `gadiw_database_02062026.sql` (237 KB).
- Resumable from dashboard until 31 Aug 2026.

### Done — Beni/work-journal archived (vmcipofovheztbjmhwsl)
- Same transfer -> pause. Off the bill. Resumable until 31 Aug 2026.
- Backup to PC + Drive: buckets signatures (17), purchase-orders, photos (19), app-assets (+ inbox 15, annexes 20, drawings, pdfs); `videos` empty/skipped. `beni_database_02062026.sql` (17.3 MB).

### Decisions
- **TCM (tcm-assistant, iqfglrwjemogoycbzltt) NOT paused** — it is a real startup. Stays active (~$10/mo accepted). Migrating from the ~10k-line single-file HTML to a proper Next.js `src` build, slowly across several sessions. Target: Google Play app + monthly subscription tier + maintenance fee.
- Net monthly saving so far ~$20 (GadiW + Beni parked). Pro org now runs Sinks_Art + tcm-assistant active.
- 90-day rule: paused free projects are resumable for 90 days, then not restorable from dashboard but data still downloadable. Offline backups = the real long-term insurance. Calendar note: **31 Aug 2026** = 1-click-restore deadline for GadiW + Beni.

### Supabase archive procedure (proven — see SKILL.md Rule #28 for full steps)
- Transfer to free org -> back up BEFORE pausing (storage via `ss:///` three-slash cp; DB via PostgreSQL 17 `pg_dump` over the **Direct** connection, NOT the pooler) -> copy to Drive -> pause.
- Biggest time-sink: the SHARED pooler caches the old DB password for minutes after a reset (~5 failed retries). Fix = use the Direct connection `db.REF.supabase.co` which bypasses the pooler.

### Next session
- Begin the TCM Next.js `src` rebuild — slow, plan-first. First step: stand up the new repo skeleton + a TCM SKILL.md/STATUS.md, and inventory the two existing subsystems so nothing is lost.

---
## 2026-06-01 — Session 34 (Sun–Mon) — Prompt Builder + Vercel deploy + auth + subdomain + Google Ads fix + Instagram launch + Add-ons feature

### Goals
- Build the back-office AI הדמיה Prompt Builder; deploy the Sinks_ART CRM to Vercel
- Make the builder read real architect sketches (fix the triangle-vs-rectangle problem)
- Get the CRM live, protected, and on a branded subdomain
- Diagnose why the Google Ads campaign produced 0 WhatsApp leads
- Launch an Instagram business account for the sinks brand
- Add a "change orders / add-ons" feature to the public marketing site

### Done — CRM Prompt Builder (Sinks_ART)
- 9/10 handover files built + validated (esbuild), delivered via PowerShell `WriteAllText` batches:
  - `lib/promptTemplates.ts` (pure prompt fns), `lib/promptBuilderActions.ts` (`'use server'`, saves to `media_analyses.ai_full_report.prompts` + `prompt_history`, service-role key)
  - `components/prompt-builder/`: GeometryFields, MediaInputPanel, PromptOutputCard, PromptBuilderShell
  - routes `/prompt-builder` + `/customers/[id]/prompt-builder` INSIDE the `(internal)` route group; TopNav 5th tab `הדמיה`
  - File 10 (customer-page launcher button) NOT built — route works by URL; deferred.
- **Sketch-first analysis** wired: reuses `/api/analyze-photo` (Claude vision). Standalone uploads sketch to Cloudinary first (route needs HTTPS URL, ~$0.02, real cost in ApiCostMeter); per-customer reuses existing /intake analysis free. Flow = analyze → user reviews/corrects → generate.
- **Shapes + mount + pitch + drain** added (fixed the triangle-vs-sketch problem at the root): Rectangle/Square shapes; Countertop vs Wall-mounted mount; DRAIN round / rectangular stainless linear; PITCH middle / back / side — baked into Nano Banana + Kling prompts. `mapAnalyzedShape()` maps Hebrew shape → enum.
- **Pipeline validated end-to-end:** sketch → Nano Banana still (excellent rectangular Calacatta countertop w/ linear drain, sloped floor, invisible seams, wall tap, no porcelain) → Kling image-to-video 8s orbit + push-IN reveals pitch/drain/seams.

### Done — Deploy + redirect + auth + subdomain (Sinks_ART)
- Deployed `Sinks_ART` as Vercel project `sinks-art`, all 10 env vars via Import .env. Live `sinks-art.vercel.app`. All pages verified (prompt-builder, dashboard, sinc, intake 6 customers, customers).
- **Root redirect:** `src/app/page.tsx` → `redirect('/dashboard')` (dropped old April landing).
- **Password gate** (Vercel built-in Password Protection is Pro-only/$150mo, rejected): free middleware gate — `src/middleware.ts` (site-wide cookie gate, fails CLOSED, public paths /login + /api/login), `src/app/api/login/route.ts` (validates CRM_PASSWORD, httpOnly crm_auth cookie), `src/app/login/page.tsx` (Hebrew login, reads `from` via window.location not useSearchParams). `CRM_PASSWORD` env added local + Vercel. Verified in incognito. (Next 16 "middleware→proxy" deprecation = cosmetic, ignored.)
- **Subdomain `crm.marble-art.co.il`** attached: Vercel Add Existing → Production; cPanel/LiveDNS CNAME `crm` → `51e7e2e5f0d2f1b0.vercel-dns-017.com`. Valid + SSL. Main site (A 76.76.21.21) untouched; only added the crm CNAME.

### Done — Google Ads diagnosis + fix (account 859-073-3472)
- **Root cause: NOT tracking — keywords.** ~30 of ~40 keywords "Not eligible · Low search volume" (phrases too long/specific for Israeli volume). Only ~6 eligible. Campaign only ~5 days old, 12 clicks total, B-Luxury 7 impressions. WhatsApp button itself works (tested on phone, opens chat to 050-5231042). "Tracking: No options set" — Google can't see WhatsApp clicks as conversions.
- **Fixes applied:** bid strategy → **Maximize clicks** (₪4 max CPC cap) — was stuck on a Smart strategy "learning" with zero conversion data. Added 3 short high-volume keywords (`כיור אמבטיה`, `כיור תלוי`, `כיור שיש` etc. from own Search Terms + competitor research: כיור מובנה, כיור שוקת, שיש פורצלן, גרניט פורצלן). Paused the "Low search volume" dead keywords. Added Sitelinks + Callouts assets (ad strength was "poor").
- Decision: ₪25/day = test budget. Wait 3–5 days, then read Search Terms + add negatives. Skip Google Search Partners + auto-recommendations that push spend.
- FUTURE: WhatsApp conversion tracking (ties to CRM lead pipeline) so Google can optimize toward real leads.

### Done — Instagram business account
- **@marble_art_sinks** created as separate-but-multi-login account (email-only, phone skipped to avoid duplicate-account flag; mobile is primary on flooring account). LOGIN GOTCHA: email resolves to flooring account → log in by **username** `marble_art_sinks`, not email. Switched to Professional/Business. Name `Marble Art | כיורי שיש אמנותיים`, Hebrew bio, link marble-art.co.il.
- Posted 7-item launch grid (real grey sink photo, Calacatta הדמיה [AI-labeled], close-up video, sketch-to-sink animation [AI-labeled], real Ales grey sink, full stone bathroom by Ales, dark architectural sink by Ales) + 3 AI concept teasers queued.
- HONESTY RULE: real Ales builds posted truthfully; AI renders ALWAYS labeled `🔹 הדמיה ממוחשבת (AI)` + framed as teaser ("send sketch → we create הדמיה → Ales builds it"). Critical for architect credibility.
- POSTING SCHEDULE: 3/week Sun·Tue·Thu ~20:00 Israel time, ~2 real : 1 AI. Content engine = photograph every Ales sink + every prompt-builder render. Tool: Meta Business Suite to batch-schedule. First Reel got a like — focus on Reels next (movement in first second).
- PAID PROMOTION = NOT YET (per-post Boost, not "whole site"); wait for ~15–20 posts + Google Ads data, then one small ~₪20–30 boost to designers/architects.

### Done — Add-ons / Change Orders feature (sinks-bathroom-design, public site)
- New **AddOns.tsx** section ("לא רק כיור — חלל שלם באבן"): 12 change-order items in 5 groups (אבזור / ברזים / תאורה / הרחבות אבן / גימור). Price on request (no prices).
- **Pickable cards wired into the EXISTING SelectionContext cart** (section "תוספות"), so add-ons flow into the LeadForm + single WhatsApp message exactly like gallery picks — solves the "two separate WhatsApp" problem (unified: intake + add-ons in ONE submission/message). Add-ons carry a generated data-URI ◆ thumbnail so cart/form `<img>` render without image assets — **no other file touched** by AddOns itself.
- `page.tsx`: `<AddOns />` placed between ForDesigners and the lead form.
- **SelectionCart.tsx** edited: IntersectionObserver hides the floating cart bar when `#lead-form` is on screen (reappears on scroll up). Also fixed two squished class-name typos (`gap-2overflow`, `items-centerjustify`).
- Tested locally end-to-end (pick → cart → form "הבחירות שלכם" → submit → one WhatsApp). Deployed to marble-art.co.il.

### Open / blockers
- **CRM proper auth** — current gate is a shared password; upgrade to Supabase Auth with real accounts.
- **File 10** — customer-page Prompt Builder launcher button.
- Google Ads: no WhatsApp conversion tracking yet (Google is blind to leads).
- Hero image `quality="90"` Next 16 warning (cosmetic; if build ever errors add `images:{qualities:[75,90]}` to next.config).
- Carried: designer-page prose (Ales OK pending); ARVO icon not set as Business logo.

### Next session (Session 35)
1. **/intake Part 2** — extract pitch + drain FROM the sketch (vision prompt + intake review fields).
2. **RFQ form → CRM lead pipeline** — public form/Instagram DMs land in Supabase but don't flow into CRM as workable leads. First step: read-only SELECT on the form table (Avshi runs, Claude writes), then form row → customers + projects + customer_communications. Touches BOTH repos (shared Supabase).
3. **CRM add-ons tracking (Piece 2)** — let Avshi/Ales attach selected add-ons to a customer's quote in the CRM (public showcase Piece 1 shipped this session). Folds into the price-offer engine + lead pipeline.
4. **File 10** — customer-page launcher button.
5. **Finished-still LIBRARY** for Kling start-frames (Cloudinary bank + picker).
6. **Ales build-footage shot-list (Hebrew)** — real fabrication clips = strongest free marketing + best Reels.
7. **CRM proper auth** (Supabase Auth upgrade).

---

## 2026-05-30 — Session 33 (Saturday) — Site copy micro-fixes + CTS-T35 corner sink design + gallery limits raised

### Goals
- Polish 6 site copy items requested by Avshi (materials + thicknesses, depersonalize craftsman names, intake form tweaks)
- Design a proper technical sketch + AI prompts for the compact corner-toilet sink Ales has been talking about
- Investigate Cloudinary per-section image limits before hitting them

### Done

**6 site copy micro-fixes — commit `7eae41c..0b4f4a2`** ("Site copy: materials + thicknesses on Hero, WhyUs 01 broadened, depersonalize names...")
- `Hero.tsx` body line: → "גרניט פורצלן, שיש ומדוקקים בעובי 8-12-18 מ״מ"
- `WhyUs.tsx` fact 01 title broadened: "שיש איטלקי, גרניט פורצלן ואריחים מדוקקים" (thickness dropped from text — moved to Hero)
- `WhyUs.tsx` fact 02 depersonalized: "אומני העיצוב, החיתוך והבנייה שלנו חותכים, מלטשים ומרכיבים..." (אלס ורוסלן removed)
- `HowItWorks.tsx` (homepage תהליך): "אלס בונה" → "האומנים בונים"
- `ForDesigners.tsx` (homepage promo pillar 02): "ואלס בונה" → "האומנים בונים"
- `marble-sinks-for-designers/page.tsx` pillar 02 + step 4: "ואלס בונה" / "אלס חותך..." → "האומנים בונים"
- `LeadForm.tsx`: width "wide" `~100-140` → `120-240` ס״מ; "לא בטוח/ה" desc `אמדוד יחד עם אלס` → `אמדוד עם נציג שלכם`; footer `אלס יחזור` → `נציג יחזור`
- **Deliberately NOT changed:** the designer-page **prose paragraph** still names "אלס ורוסלן, אומני החיתוך והבנייה שלנו..." Ales is worried customers will challenge his sink-specific experience (3 years sinks vs 15-20 years stonework on luxury renovations). **Recommended Option A: strengthen credentials with "מעל 20 שנות ניסיון בעבודות אבן ושיש בבתים פרטיים ובוילות יוקרה" rather than remove names.** Avshi agrees, waiting for Ales conversation.

**Technical lesson — the "wrong file" trap (caused real friction this morning)**
- Two near-identical files exist with overlapping content: `ForDesigners.tsx` (homepage promo) and `marble-sinks-for-designers/page.tsx` (standalone designer page). I initially edited the standalone page when the user was viewing the homepage section. Dev server showed "no change" because Next.js only recompiles files imported by the rendered route.
- **New Rule #25:** Before ANY text-replace edit, run `Select-String -Path ".\src\**\*.tsx" -Pattern "EXACT_HEBREW_PHRASE" -List` to confirm which file actually renders the visible text on the screen being tested. Saves multiple iterations.

**Robust file-edit pattern locked in for the session**
- PowerShell `[System.IO.File]::WriteAllText($path, $new, [System.Text.UTF8Encoding]::new($false))` is the reliable path for JSX/Hebrew edits. UTF-8 without BOM, no Turbopack JSX issues, no browser-download/Move-Item failures.
- Surgical edit flow: `ReadAllText` → `-replace "old","new"` → `WriteAllText`. Doesn't touch any other content. Verified with `Select-String` showing match for new + zero matches for old.

**CTS-T35 Right-Triangle Corner Sink — full design package (delivered)**
Three iterations needed to land on the right product:
1. **CTS-950 (abandoned)** — first attempt: 65×65 cm trapezoid corner sink (vanity-style). Wrong: too large, 5-sided trapezoid, not the toilet-room sink Avshi needed.
2. **CTS-400 (abandoned)** — second attempt: 40×40 cm trapezoid, wall-mounted. Still wrong: trapezoid (5 sides), not a true triangle.
3. **CTS-T35 (final)** — **35×35 cm RIGHT TRIANGLE**, wall-mounted, with wall-tap. THREE sides only: two 35 cm wall legs flush against the corner walls (hidden), one ~49.5 cm hypotenuse front face (the ONLY visible exterior slab). Smaller triangle basin inset (~26×26 legs), Ø32 mm drain at center, V-channel slope ~5% (~5 mm drop), shallow ~11 cm basin. Slab thickness 1.5 cm. Mounts ~85–90 cm above floor. No vanity, no support. Wall-mounted tap projects from back wall above basin.

**Delivered files (Sinks_ART repo):**
- `ctsT35_sketch.svg` — editable source (3-view: Plan / Section A–A / Isometric).
- `ctsT35-sketch-sheet.png` — rendered 1600px PNG, intended for Cloudinary `marble-art/sketches/` upload.
- `ai_prompts_corner_sink.md` — comprehensive reference doc: construction-rule TEMPLATES (placeholders for any future custom-shape sink) + CTS-T35 worked example with ready-to-paste Nano Banana + Veo prompts.

**Key construction rules baked into every prompt** (override AI's bowl-bias):
- FLAT polished stone slabs only — no curves, no carved bowls, no rounded edges
- Joined at clean straight seams with hidden adhesive
- THREE sides only (TRUE right triangle, not pentagon/trapezoid)
- Two wall legs hidden against walls; ONE visible hypotenuse face
- Wall-mounted (NO vanity, NO support beneath, NO faucet hole on sink)
- Wall-mounted tap on the BACK WALL projecting horizontally over basin

**Veo prompt anti-hallucination fix (lesson from failed test)**
- Avshi tested v1 Veo prompt — it produced a sequence STARTING WITH a "white porcelain round small cheap sink" appearing first, then building marble pieces *around and above* it. AI hallucinated a placeholder starter object before the actual assembly.
- **v2 prompt adds:**
  - `OPENING FRAME — CRITICAL: the shot begins on an EMPTY toilet-room corner. NO existing sink, NO placeholder sink, NO porcelain sink, NO temporary fixture, NO basin, NO bowl of any kind in the opening frame.`
  - `The very first objects to appear must be FLAT POLISHED STONE SLAB PANELS — never a pre-formed sink shape, never a round bowl, never anything ceramic or porcelain.`
  - Consolidated `ABSOLUTE FORBIDS` block at the end naming the specific failure (porcelain, ceramic, bowl-shaped, round, oval, placeholder, starter, base, temporary sink).
- **Also provided a safer FALLBACK prompt:** slow "reveal" instead of build sequence — camera pushes in on empty corner, finished sink fades in already-complete, then orbits. Less ambitious, much more reliable. Use after 2–3 failed build-sequence attempts.
- v2 prompt + fallback saved in `ai_prompts_corner_sink.md`. **PENDING re-test by Avshi.**

**Cloudinary per-section image limits — audited and raised**
- Audit found per-section `maxItems` in `Gallery.tsx` + `VideoGallery.tsx`:

| Section | File | Old limit | Cloudinary today | Headroom before fix |
|---|---|---|---|---|
| כיורים שבנינו | Gallery.tsx:12 | 12 | 11 | 🟡 1 |
| אבני שיש לבחירה | Gallery.tsx:13 | 16 | 12 | 🟢 4 |
| תצוגות מקדימות מותאמות אישית | Gallery.tsx:14 | 12 | 11 | 🟡 1 |
| כל כיור מתחיל בסקיצה | Gallery.tsx:15 | 8 | 5 | 🟢 3 |
| הכיורים שלנו בוידאו | VideoGallery.tsx:9 | 12 | 3 | 🟢 9 |

- **Two sections (sinks, concepts) were ONE upload away from being capped.**
- Decision: raise ALL FIVE to **50** for consistency + multi-year headroom. 50 well within Cloudinary Admin API's max of 500; payload stays small for fast page loads.
- Surgical edits to two files via WriteAllText pattern. Verified all 5 calls show `, 50)`.
- **NOT YET COMMITTED.** Verified on dev server; awaiting visual confirmation on localhost:3000 before separate commit (logically distinct from the corner-sink doc work).

### Decisions
- **Designer-page prose preferred fix = Option A** (strengthen credentials, keep names) — not Option B (remove names). Designers/architects pay for named, accountable craft; "our craftsmen" weakens the brand. Pending Ales OK.
- **Naming convention:** "CTS-T##" prefix for triangle sinks (CTS-T35 today; CTS-T30 / CTS-T40 if other sizes get designed later). Distinguishes from the 5-sided trapezoid concepts that didn't pan out.
- **Construction-rule block** in prompts: capitalized, repeated multiple times, plus a consolidated "ABSOLUTE FORBIDS" block at the end. Anti-hallucination guards are CRITICAL after the porcelain-placeholder failure.
- **Gallery limits to 50, not unlimited:** Cloudinary supports 500 max per call, but 50 keeps payload small + is plenty for years of growth.
- **One commit per logical change** — gallery-limits commit will be separate from corner-sink doc commit, matching Avshi's standing rule.

### Open / blockers
- **Designer-page prose** — Ales conversation pending. Apply Option A text if approved.
- **Veo v2 prompt (anti-porcelain)** — pending re-test by Avshi. Fall back to "reveal" variant if it still fails after 2–3 tries.
- **Gallery limits change** — pending commit + push (5 numbers verified, awaiting localhost visual check).
- **Cleanup of abandoned CTS-950 / CTS-400 files** in Sinks_ART repo — commands provided, not yet run by Avshi.
- **Sinks_ART repo missing `references/` folder** — convention from skill says `references/ai_image_pipeline.md` and `references/schema.sql` should exist; neither does. Will be needed before Session 34's prompt-builder build.
- Carried from prior sessions: ARVO icon still not ASSIGNED as Business logo in Google Ads (sitting in Asset Library); `lead_form_click` still not GA4 key event; bidding switch from Maximize clicks → Maximize conversions pending ~15–30 `whatsapp_click` conversions.

### Next session (Session 34) — AI הדמיה prompt-builder (back office)
- Per Session 30/31/32 plan: build Phase 1 — back-office screen that takes intake data (sketch + marble sample + dimensions + notes) and outputs ready-to-paste prompts.
- NOW updated scope: output BOTH a static (Nano Banana) prompt AND a video (Veo) prompt from same fields. For custom-shape sinks, prompt should pull the construction-rule block from `ai_prompts_corner_sink.md`.
- **BRING TO SESSION:** Sinks_ART Supabase schema (`references/schema.sql` — note: doesn't yet exist, either create or paste from Supabase dashboard); one example intake/customer record; the `references/` folder structure decision.
- Also during session: confirm Veo v2 result on retest; apply Option A prose update once Ales OKs.


### Addendum (Saturday late afternoon, ~+6h) — Kling test results + image-to-video pivot + next-session tool plan 🏊

**Decision made:** Avshi subscribed to **Kling Standard tier (~₪20/month, ~$5)** — unlocks materially more daily generations vs Gemini Pro's 2-3/day cap. Locked in as the production video tool. Veo demoted to "if free credits available."

**Today's Kling test — text-to-video FAILED**
- Spent 40 credits on a Kling Video 3.0 text-to-video generation of CTS-T35.
- Result: weird abstract polished-stone shape floating in empty space. NO triangle geometry, NO corner walls, NO basin, NO tap, NO slabs visible. Kling missed the brief almost entirely.
- I initially misread the screenshot ("amazing!") and confused the still-image renders from Kling's image-gen tab (which DID look good) with the failed video. Caught on Avshi's second send. **My miss — should have looked closer before celebrating.**

**Root cause analysis**
- **Prompt was too long for Kling** (~150 words). Kling weights words evenly and gets diluted by long prompts. Veo handles 200+ words; Kling sweet spot is ~50-80 words.
- **Negative content was buried at the end of the main prompt** ("AVOID:...") instead of in Kling's dedicated Negative Prompt field. Kling doesn't weight in-main-prompt negatives properly.
- **Text-to-video has no shape anchor** — without a reference image, Kling has to invent the geometry from words, and "right triangle corner sink with hypotenuse front face" is unusual enough that it defaults to abstract sculpture.

**Conclusion: image-to-video is mandatory for slab-built custom shapes.** Cannot skip the Nano Banana still step. The "chain still→video" rule we wrote into `ai_prompts_corner_sink.md` is non-negotiable for custom geometry — Kling and Veo BOTH fail text-to-video for this category.

**Next session (Session 34) — REVISED PLAN: build the "Prompt Builder" tool**
- Avshi proposed building a small standalone web utility:
  - **Input:** drag-drop marble sample A image + marble sample B image + sketch image; a few text fields (sink model, shape notes, target setting)
  - **Output:** copy-paste-ready Nano Banana prompt + copy-paste-ready Kling prompt, with the construction-rule block already injected; (stretch) download zip with renamed images + `prompts.txt`
- **Architecture decision:** single-file `prompt-builder.html` (single-file HTML rule applies — it's a tool/prototype). Pure client-side, no server, drag-drop images stay local. Hostable at `marble-art.co.il/tools/prompt-builder.html` later if useful, or kept local.
- **Strategic value:**
  - Scales infinitely — every customer, every shape, every color pair
  - Removes "did I phrase it right" risk per generation
  - Builds asset library (images + prompts saved per customer ID — future integration)
  - **Stepping stone to the Session 31-planned CRM prompt-builder** — same logic, simpler scope, no Supabase yet
  - Feeds the planned Instagram pipeline (tons of clips for the ARVO Instagram account)

**Workflow once the tool exists:**
1. Open `prompt-builder.html` in browser
2. Drop in sketch + sample A + sample B
3. Fill model/shape/setting fields
4. Click "Generate Prompts" → copy Nano Banana prompt
5. Paste into Gemini → get the still
6. Save still locally
7. Copy Kling prompt from the tool
8. In Kling: drop still into "Add start and end frames", paste Kling prompt → generate
9. Download video, upload to Cloudinary `marble-art/videos` → auto-appears on site gallery

**Session 34 task list (in order):**
1. Build `prompt-builder.html` with drag-drop image inputs + form fields + dual-prompt output
2. Test on CTS-T35 (sketch + 2 marble samples)
3. Run through Nano Banana → still
4. Feed still into Kling image-to-video → finished video
5. Compare to today's failed text-to-video — validates the chain
6. Iterate on prompt language (especially the seam/joint problem — see below)

**Joint/seam render problem (caught from Kling stills)**
- Kling renders slab joints as visible WHITE caulk/grout lines — looks like cheap tile grout, breaks the premium-artisan story.
- Ales's real joints: marble-color-matched epoxy/stone adhesive, sub-millimeter wide, essentially invisible.
- Fix language for prompts (add to construction rules):
  - "joined at INVISIBLE seams using color-matched stone adhesive"
  - "seams between slabs are hairline-thin (sub-millimeter), tinted to match surrounding veining — virtually invisible"
  - "NO white grout, NO white sealant, NO white caulk between slabs"
- AVOID list additions: `white grout, white sealant, white caulk, visible joints, tile grout, contrasting seams, gap lines, bright joint lines`
- Fallback if still showing white seams: ask for "continuous-vein marble, slabs cut from the same block so veining flows uncut across seams" — describes the desired result instead of the construction process.
- These language refinements to be baked into the prompt-builder tool's output.

**Strategic context — Instagram pipeline**
- Avshi planning to build ARVO's Instagram account (separate from his existing flooring-business Instagram).
- Goal: lots of short marble-sink videos as content fuel.
- Today's lessons (Kling > Veo, image-to-video required, prompt-builder tool needed) all feed this pipeline. Build is correctly scoped now.
---

## 2026-05-29 — Session 32 (Friday, morning) — Campaign Day-1 review + budget bump + B-Luxury keyword expansion + campaign negatives

### Goals
- Review live-campaign Day-1 performance
- Raise daily budget now that the campaign is active
- Expand B-Luxury keywords (luxury angle + granite porcelain + 2m / seamless)
- Add proper negative-keyword coverage

### Done
**CORRECTION to Session 31:** **B-Luxury ad group DOES exist** and is active with 6 keywords already in it (`[כיור אמבטיה יוקרתי]`, `"כיור שיש יוקרתי"`, `"כיור שיש מעוצב"`, `"כיור אמבטיה אומנותי"`, `"כיור שיש לאמבטיה יוקרתית"`, `[כיור שיש מעוצב]`). Yesterday's note ("never created / skip B-Luxury") came from a filtered Ad-groups view and was wrong. BOTH ad groups (Artisan + Luxury) are now active.

**Day-1 performance (May 28):** 1 impression, 0 clicks, ₪0.00 cost. Normal for launch day — ads in review part of day + niche Hebrew terms.

**Budget:** raised **₪10/day → ₪25/day** (via Campaigns → Settings → Budget → Save).

**New keywords added to B - Luxury** (luxury / villa / granite porcelain luxury / 2m / seamless angles):
```
"כיור אמבטיה מעוצב"
"כיור שיש לבית פרטי"
"כיור אמבטיה לוילה"
[כיור שיש לוילה]
"עיצוב חדר רחצה יוקרתי"
"כיור אמבטיה בוטיק"
"כיור שיש בעבודת יד יוקרתי"
[כיור אמבטיה יוקרתי בעבודת יד]
"כיור Calacatta"
"כיור Statuario"
"כיור גרניט פורצלן יוקרתי"
"כיור גרניט פורצלן לוילה"
"גרניט פורצלן יוקרתי לאמבטיה"
[גרניט פורצלן איטלקי]
[גרניט פורצלן ספרדי]
"כיור שיש 2 מטר"
"כיור אמבטיה ארוך 2 מטר"
"כיור גדול לוילה"
"כיור שיש ארוך לוילה"
"משטח שיש ארוך"
"כיור שיש ללא חיבורים"
"כיור ללא חיבורים"
"משטח שיש ללא חיבורים"
[כיור שיש ללא חיבורים]
```

**Negative keywords added — campaign level** (broad match, blocks both ad groups):
```
ריצוף, ריצופים, חיפוי, אריחי רצפה, אריחי קיר, מרצפות   (granite porcelain = mostly flooring; biggest waste-spend risk)
קוורץ, חרסינה, קיסר, קוריאן                              (wrong materials / Caesarstone / Corian / ceramic)
שיפוץ, שיפוצים, קבלן, ליטוש, שחזור, אטימה                (services, not product buyers)
DIY, יוטיוב, ויקיפדיה, איך, הדרכה, קורס, סרטון            (research / tutorial / educational)
דרושים, משרה, משרות                                       (jobs)
חינם, בחינם                                              (freebie hunters)
```

Saved direct to campaign (NOT to a shared list — single campaign, no benefit yet).

**Confirmed Auto-apply settings = OFF.** Both "Maintain your ads" (0/7) and "Grow your business" (0/14). Stay zero forever.

### Decisions
- **Two ad groups stay** — different buyer intent → message-match → better CTR / Quality Score / lower CPC. (Yesterday's "skip B-Luxury" decision retracted.)
- **New luxury keywords go to B-Luxury only** — no cross-ad-group duplicates, avoids internal Quality Score competition. Granite-porcelain plain term already in Ad group 1; only granite-porcelain + luxury modifiers go to B-Luxury.
- **Negatives = broad match (default).** Did NOT negate: `מחיר`, `מעצב`, `אדריכל` (those are buyers/target audience), or any core terms (`כיור / שיש / גרניט / פורצלן`).
- **Recommendations tab = Google's sales channel, not a friend.** NEVER click "Apply all" or "Auto-apply." Reject: broad-match switch, Search Partners / Display Expansion, "raise budget", switch to Max conversions while we have no data, auto-add keywords. Glance occasionally; treat as opinions, not instructions.

### Open / blockers
- **B-Luxury may not have its own ad** (needs check — Campaigns → B-Luxury → Ads). If empty or generic, all those luxury keywords have nothing to serve → need a luxury-themed RSA (different headlines emphasizing יוקרה / וילה / בוטיק, not the artisan / designer angle from Ad group 1).
- **Watch Day 2–4 impressions.** Should grow to low tens/day. If still 0–1 after 4 days, keywords are too niche → broaden.
- ARVO icon still in Asset Library — NOT yet ASSIGNED as Business logo (Admin → Business information). (Carry from Session 31.)
- Footer push not confirmed in-session (Footer.tsx + arvo-logo-gold.svg). (Carry from Session 31.)
- `lead_form_click` still not a GA4 key event. (Carry.)
- After ~2 weeks / ~15–30 `whatsapp_click` conversions → switch bidding back to Maximize conversions on Contacts. (Carry.)

### Monitoring routine (locked in)
- **Daily, 30 sec:** Campaigns view, date = Last 7 days → glance Impr / Clicks / Cost.
- **Every 2–3 days, 5 min:** Keywords → Search Terms tab → add junk as negatives, add good surprises as keywords.
- **WhatsApp app on phone:** real lead channel for the WhatsApp button (Supabase only catches lead-form submissions).
- **Don't tinker daily.** Don't change bids/budget mid-week. Let it gather data.

### Next session (Session 33) — MAIN BUILD: AI הדמיה prompt-builder
- Per Session 30/31 plan, NOW updated to output BOTH a static (Nano Banana) prompt AND a video (Veo) prompt — see `IDEAS_PARKING_hadmaya_video_28052026.md`.
- BRING: Sinks_ART Supabase schema (`references/schema.sql` — note: this file doesn't yet exist in the repo; either create/locate it before Session 33, or paste schema directly from Supabase dashboard).
- BRING: one example intake/customer record.
- BRING: `references/ai_image_pipeline.md` if it exists (also not yet in the repo per today's check).
- Also during the session: write the B-Luxury luxury RSA (if not done sooner) and check Search Terms report.


### Addendum (same morning, ~+1h) — B-Luxury ad CREATED 🎯

**Resolved open item from earlier in session:** confirmed B-Luxury had NO ad (keywords sitting idle, nothing to serve). Created the missing luxury-themed Responsive Search Ad.

**Done:**
- B-Luxury RSA created with **luxury-flavored copy** (different from Ad group 1's artisan/designer angle): emphasizes יוקרה, וילה פרטית, בוטיק, Calacatta + Statuario by name, גרניט פורצלן ליוקרה, ייצור פרטי, דיסקרטיות.
- Final URL: `https://www.marble-art.co.il/`
- Display path: `כיורי-יוקרה / שיש-איטלקי` (luxury-flavored, not the default `כיורי-שיש / בעבודת-יד`)
- Business name: `ARVO` (verified advertiser name = אבשלום ספיר — use that as fallback if ARVO gets rejected on review)
- 15 headlines + 4 descriptions, all unpinned for max flexibility
- Long headline: `כיורי שיש יוקרתיים בעבודת יד — Calacatta, Statuario וגרניט פורצלן מובחר. ייצור פרטי.`

**Procedural gotcha (worth remembering for next ad):**
- Google **prefilled the form** with 10 AI-suggested generic headlines (`פריט אמנות לחדר הרחצה`, `כיור אמבטיה מעוצב`, etc.) drawn from URL + previous high-performing ads.
- These persisted as a SEPARATE saved ad (not overwritten) — so B-Luxury briefly had TWO ads: the old prefilled generic + the new ARVO luxury.
- **Next time: click "Clear prefills"** (blue link inside the prefill info box) BEFORE pasting custom copy.

**Final state — B-Luxury → Ads:**
- Old prefilled generic ad → **Paused** (kept not deleted; reversible if the luxury ad ever gets disapproved).
- New ARVO luxury ad → **Eligible** ✓
- (Brief misstep: paused the wrong row first; reversed within a minute. Lesson: always read the headline text on the row before pausing, never trust row position alone.)

### Updated Open Items (resolutions from this addendum)
- ~~B-Luxury may not have its own ad~~ → **RESOLVED.** Luxury RSA live; old generic prefilled ad paused.
- B-Luxury luxury ad showing **Ad strength: Pending** — Google still calculating; refresh in ~10 min to settle on a real rating. Re-check on Day 2 monitoring.

### Campaign — fully built (final state, Friday morning)
- **Campaign:** Eligible · ₪25/day · Maximize clicks (₪4 max CPC) · Campaign-specific goal: Contacts only
- **Ad group 1 (Artisan):** Eligible · 1 RSA (ARVO artisan/designer copy from Session 31) · materials + designer + handcraft + 2m keywords
- **B-Luxury:** Eligible · 1 RSA active (ARVO luxury copy) + 1 paused (prefilled generic, reversible fallback) · luxury + Calacatta/Statuario + granite-porcelain luxury + 2m + seamless keywords
- **Negatives:** 28 campaign-level (today) + the launch set (זול, יד שנייה, מטבח, איקאה, ניקוי, תיקון, נירוסטה...)
- **Conversion tracking:** `whatsapp_click` → Contact → Primary (GA4 538530214) · `Outbound clicks` removed
- **Auto-apply:** 0/7 and 0/14 (stays zero forever)
- **Billing:** Mastercard ••7884 (exp 04/29) · Primary · confirmed active
---

## 2026-05-28 — Session 31 (Thursday) — ARVO logo rollout + copy revisions + Google Ads GO-LIVE + conversion tracking

### Goals
- Replace the weak ARVO logo across the site with a strong, crisp version
- Finish the parked copy-revision batch (#2–#5)
- Update the Google Ads campaign to the new brand + broader keywords
- Launch the campaign (go-live) + set up conversion tracking so spend is measurable

### Done — all live / saved
**Branding — ARVO logo overhaul**
- NEW `public/arvo-logo.svg` — bold gold "A" + ARVO wordmark + tagline on a dark charcoal plate (for LIGHT backgrounds). SVG (not PNG) → crisp at any size.
- NEW `public/arvo-logo-gold.svg` — transparent, plate-free gold version for DARK backgrounds.
- `Header.tsx` — old M-box/"Marble Art" replaced with clickable ARVO logo (→ home on every page). Switched from `next/image` to a plain `<img>` so the SVG renders WITHOUT enabling `dangerouslyAllowSVG`. Sized `h-16 md:h-20`. (Live + confirmed.)
- `Footer.tsx` — old gold "M" box + "Marble Art Sinks" replaced with the gold ARVO logo; tagline refreshed to "כיורי שיש וגרניט פורצלן בעבודת יד"; copyright now "© 2026 ARVO".
- Google Ads icon assets generated: `arvo-icon-1200.png` (1:1, ICON ONLY — no words — for Search business logo), plus `arvo-square-wordmark-1200.png` + `arvo-wide-wordmark-1200x300.png` (for future Display/PMax).

**Site copy revisions (#2–#5)** — commit `7efb051..06ca2be` ("Site revisions: granite-porcelain copy, Ales+Ruslan credit, 5 WhyUs facts")
- `Hero.tsx` — eyebrow → "כיורי גרניט פורצלן איטלקי, ספרדי יוקרתי בעבודת יד"; body line → "גרניט פורצלן בעובי 8 מ״מ".
- `WhyUs.tsx` — header → "היתרונות שמייחדים אותנו" (no number, so future add/remove needs no edit). Grown 3 → 5 facts: 01 retitled "שיש איטלקי וגרניט פורצלן"; 02 now credits "אלס ורוסלן" (verbs pluralized); NEW 03 "ללא מגבלות אורך" (1.20–2.40 מ׳ ללא חיבורים / כל גודל עם חיבורים סמויים); NEW 04 "כיור תלוי — ללא שידה"; old AI-preview fact moved to 05. Grid → `sm:grid-cols-2 lg:grid-cols-3`.
- `marble-sinks-for-designers/page.tsx` — "אלס" → "אלס ורוסלן" in all 3 spots (pillar 02, מי-אנחנו prose, step 4), verbs pluralized. Materials sentences left intact (already list both stones correctly).

**Google Ads — LAUNCHED (account 859-073-3472)**
- Campaign `LeadsSearch - WhatsApp Leads - Marble - 26052026-Search-1` — ENABLED (was paused). Status Eligible; ads in review.
- Billing confirmed active: Mastercard ••7884 (exp 04/29), Primary. Budget stays ₪10/day.
- Refreshed Responsive Search Ad (Ad group 1): 13 new Hebrew headlines + 4 descriptions (granite-porcelain, אלס ורוסלן, wall-hung, AI preview, designers). Removed old "שיש איטלקי מובחר / גימור אומנותי" lines.
- Added keywords to Ad group 1: "אריחים מדוקקים" + variants, "כיור גרניט פורצלן" (+exact), "כיור פורצלן", "כיור פורצלן בהזמנה אישית", "גרניט פורצלן לאמבטיה", "כיור תלוי", "כיור אמבטיה ללא שידה", "כיור שיש ארוך", "כיור שיש למעצבים", "כיור למעצבי פנים", "כיור שיש לאדריכלים".
- Uploaded `arvo-icon-1200.png` to Asset Library (Square 1:1, 32 KB).
- **Conversion tracking SET UP:** imported GA4 `whatsapp_click` key event as a conversion → category **Contact**, **Primary**, source GA4 538530214. Active.
- **Cleanup:** removed dead "Outbound click" conversion action (misconfigured — "Untitled tag / Manual event" never placed on site, 0 data). Campaign conversion goals switched from Account-default (Contacts + Outbound clicks) → **Campaign-specific: Contacts only**.
- **Bidding changed:** Maximize conversions → **Maximize clicks** with **max CPC ₪4** (cold start, zero conversion history).

### Decisions
- **Logo: two variants.** Dark-plate SVG on light backgrounds (header); transparent gold SVG on dark backgrounds (footer). Delivered as SVG via plain `<img>` — NOT `next/image` (avoids needing `dangerouslyAllowSVG`).
- **Materials: keep BOTH שיש + גרניט פורצלן everywhere.** Do NOT blanket-swap שיש→granite where Calacatta/Statuario/Saint Laurent appear — that would mislabel real marble. (Customers don't distinguish stone chemistry; brand keeps both.)
- **Ads bidding = Maximize clicks (₪4 cap) for now.** Switch back to Maximize conversions (on Contacts) after ~15–30 `whatsapp_click` conversions accumulate (~2 weeks). Reason: Max conversions stalls with zero history.
- **Skip "B - Luxury" ad group.** It was never actually created; at ₪10/day a single well-built ad group is enough. Revisit if budget grows.
- **Visible brand = ARVO** (header, footer, copyright). Domain + SEO name `marble-art.co.il` unaffected. WhatsApp pre-filled message left as "מרבל ארט".
- **Search business-logo asset must be ICON ONLY (no words)** — wordmark versions are for Display/PMax only.
- Declined Google "share your phone number" (sales calls; push broad-match traps). "Ad scheduling" notice is informational: ₪10/day ≈ ₪304/mo (~30.4×), up to ~2× on a single day, self-averaging.

### Open questions / blockers
- **ARVO icon is in Asset Library but NOT yet ASSIGNED as Business logo.** Assign via Admin → Business information (or campaign → Assets → Business logo) so it shows on ads. Advertiser verification is DONE → display unlocked once assigned.
- **Footer change push not confirmed in-session** — verify `Footer.tsx` + `arvo-logo-gold.svg` were committed/pushed ("Footer: replace Marble Art M-box with ARVO gold logo, refresh tagline").
- Conversion data has 12–24h delay; needs real clicks + WhatsApp taps before any show. Optional self-test: click WA on live site, check tomorrow.
- After ~2 weeks / ~15–30 conversions → switch bidding back to Maximize conversions on Contacts; consider budget ₪25–30/day once running clean.
- Expect 1–2 weeks of performance fluctuation after the bidding/goal change (Google's own warning).
- `lead_form_click` still not a GA4 key event (never fired). `whatsapp_click` is the live conversion.

### Next session (Session 32) — MAIN BUILD: AI הדמיה prompt-builder (back office)
- Unchanged from Session 30 plan: build Phase 1 of the lead → הדמיה pipeline in the back-office CRM (Sinks_ART). Customer-record screen takes intake (sketch + marble sample + dimensions + notes) → OUTPUTS a ready-to-paste Nano Banana prompt; manual download/approve/send by Avshi.
- BRING: Sinks_ART Supabase schema + one example intake/customer record + references/ai_image_pipeline.md conventions.
- Also: monitor live ads first few days — Search Terms report (add junk as negatives), watch for whatsapp_click conversions.

---

## 2026-05-27 — Session 30 (Tuesday) — Google Ads launch-ready + Designer SEO page + Video gallery

### Goals
- Research target market + build Google Ads keyword/targeting strategy
- Build (NOT launch) the Search campaign on existing account 859-073-3472, paused
- SEO audit of marble-art.co.il; act on highest-value gaps
- Build a dedicated designer/architect landing page (top SEO + ad-landing value)
- Add a video gallery (Cloudinary video, same dynamic pattern as images)
- Remove the stale Vercel duplicate competing in Google

### Done — all live / saved
- **Market + keyword strategy.** Positioned product as niche luxury/bespoke (NOT commodity vanity). Competitors (eBath, Levi Bath, Sharon Ceramic, Agan, Zedka) own broad terms; we target long-tail high-intent. Two buyer types: affluent end-renovators + interior designers/architects (highest-value, under-served channel).
- **Google Ads campaign BUILT + PAUSED** on account 859-073-3472 (₪0 spent, cannot serve):
  - Search campaign, objective Leads, goal Outbound clicks, Conversions bidding, ₪10/day
  - Israel + Hebrew; Search Partners / Display / AI Max all OFF; GA4 (538530214 / G-0VV9NZFRXP) linked
  - Ad group "Ad group 1" (Artisan): phrase+exact keywords, 10 Hebrew headlines, 4 descriptions
  - Ad group "B - Luxury": phrase+exact keywords, 10 headlines, 4 descriptions
  - 9 campaign-level negative keywords (זול, מבצע, יד שנייה, מטבח, איקאה, IKEA, ניקוי, תיקון, כיור נירוסטה)
  - LATER added trade-term keywords to Ad group 1: "אריחים מדוקקים", "כיור אריחים מדוקקים", "כיור גרניט פורצלן", "כיור פורצלן בהזמנה אישית" + exact variants. ("אריחים מדוקקים" confirmed by Avshi as the real commercial term designers/shops use.)
- **Advertiser verification: DONE** — auto-completed as "אבשלום ספיר" (IL). EU political ads answered No. VAT/invoice (business profile) deferred — ask accountant; not a blocker, nothing spends while paused.
- **NEW dedicated SEO page** `/marble-sinks-for-designers` (commit ~bdfa3a1). Own metadata targeting "כיורי שיש למעצבי פנים/לאדריכלים". Server-rendered, Hebrew RTL, hero + prose + 4 pillars + 4-step process + CTA + two "חזרה לעמוד הבית" links. Materials updated to three: שיש, גרניט פורצלן, אריחים מדוקקים.
- **SEO finishers** (commit ~b7e96db): sitemap.ts now lists both URLs; ForDesigners.tsx homepage section got a prominent brass-bordered "מעצבים ואדריכלים?" invitation box (Option A, top of section) linking to the designer page. Pillar 03 updated to "תיעוד מלא לכל חומר" (3 materials).
- **Video gallery** (commit ~43cf0be, 4 files): NEW `src/lib/cloudinaryVideo.ts` (video fetcher, mirrors image fetcher, /video/upload + so_0 poster), NEW `src/components/VideoGallery.tsx` (HTML5 players, click-to-play, dark band "הכיורים שלנו בווידאו"), wired into Gallery.tsx right after "כיורים שבנינו". First MP4 uploaded to Cloudinary `marble-art/videos`. Dynamic: add videos by uploading, no code change.
- **Vercel duplicate removed:** deleted the stale `sinks-art` project (sinks-art.vercel.app — old "two artists" version, ~2 edge requests). Code stays safe in GitHub Sinks_ART repo. Live site (sinks-bathroom-design → marble-art.co.il) untouched.

### Decisions
- **Live marketing site repo = `sinks-bathroom-design`** (serves marble-art.co.il). Sinks_ART = docs/back-office repo. (Skill Rule #16's default cd is for the CRM; marketing-site work cd's to C:\SinkS\sinks-bathroom-design.)
- **meta-keywords tag is ignored by Google** — don't chase it. Visible page copy + ad relevance + landing experience drive Quality Score.
- **Bidding = Conversions** (not Maximize Clicks) since whatsapp_click is a real tracked conversion.
- **Smart-mode escape documented:** "+ New campaign" forces the Smart wizard; escape via the ✕ top-left, "Skip" links, or "Set up an account only". Build the real campaign via left-menu Campaigns → + → New campaign → Skip business-info → real objective grid.
- **NEVER click** "Apply all / Change to broad match", "Use Display Expansion", or confirm a Google Tag overwrite (protects GA4 tag G-0VV9NZFRXP).
- **One keyword lives in one ad group** (no duplicating across groups).
- **AI הדמיה pipeline (next build) confirmed: ONE shared Supabase** for public site + back office. Manual/Avshi-reviewed flow: app builds Nano Banana prompt → Avshi pastes in Nano Banana → downloads → approves (artist-approval gate intact) → sends with price offer. Price offer engine (xls labor + marble per-m² costs) is a SEPARATE later phase.

### Open questions / blockers
- VAT/invoice: individual vs business payments profile — ask accountant. Non-blocking.
- NotebookLM has no public API; cannot programmatically bridge Claude-in-chat to a NotebookLM notebook. Reliable cross-session method stays: paste/attach STATUS.md + IDEAS_PARKING.md at session start.

### Next session (Session 31) — MAIN BUILD: AI הדמיה prompt-builder (back office)
1. Build Phase 1 of the lead → הדמיה pipeline in the back-office CRM (Sinks_ART): a customer-record screen that takes intake (sketch + marble sample + dimensions + notes) and OUTPUTS a ready-to-paste Nano Banana prompt, surfacing the sketch + sample images together. Manual download/approve/send by Avshi.
2. BRING TO SESSION: the Sinks_ART Supabase schema + one example intake/customer record (so prompt-builder maps real fields) + existing Nano Banana prompt conventions (references/ai_image_pipeline.md).
3. THEN later phases: price-offer engine (xls costs), auto-delivery options.

### Also still open (from earlier sessions, lower priority)
- Go-live: unpause Google Ads when Ales sends new pics + Google finishes indexing site. Consider ₪25–30/day once running clean.
- Instagram presence (consult done: Instagram yes / Facebook secondary mirror). Build later.
- Email forwarder MX fix (parked). lead_form_click GA4 star (when it appears). npm audit fix (NOT --force).

---

## 2026-05-22 — Session 28 cont. (Friday, post-break) — Full conversion funnel + gallery picker + intake UX

### Goals
- Star whatsapp_click as GA4 conversion (Google Ads prerequisite)
- Add file upload (images/video/PDF) to public intake form
- Add post-submit WhatsApp button (customer sends full lead in one tap)
- Build full gallery selection system (browse → pick → form → WhatsApp)
- Solve customer measurement-confusion with mount-type picker + size buckets
- Various UX polish (clock, remove buttons, messaging)
- Build (NOT launch) Google Ads campaign so it's ready to go

### Done — all live in production
- **GA4 whatsapp_click STARRED as Key Event (conversion).** Indexed overnight, one-click star. Once-per-session counting, ILS 5000 default value (set yesterday). lead_form_click NOT yet in list (nobody clicked the footer form link yet — star later).
- **File upload on intake form** (commit d2c52b1). Cloudinary unsigned preset `marble_lead_uploads` → folder `marble-art/leads`. Images/video/PDF, max 5 files, 10MB each, optional. Verified: PDF + MP4 + PNG all landed in Cloudinary.
- **Post-submit WhatsApp button** (commit e8c1138). Thank-you screen shows green WA button → opens WhatsApp pre-filled with all lead details + clickable file links → addressed to Avshi 972505231042. Verified with real WhatsApp message screenshot (name, phone, city, project, budget, notes, gallery picks by name+section, file links).
- **Full gallery selection system** (commit c48256d, 5 files):
  - NEW `src/context/SelectionContext.tsx` — React Context cart (toggle/remove/clear/isSelected/count)
  - NEW `src/components/SelectionCart.tsx` — sticky bottom bar w/ pick thumbnails + "המשך לטופס" smooth-scroll button
  - NEW `src/components/GalleryCard.tsx` — client card w/ "+" pick button
  - MODIFIED `Gallery.tsx` — uses GalleryCard, passes pickable flags
  - MODIFIED `LeadForm.tsx` — shows picks (thumbnails + names), includes in WhatsApp + Supabase notes
  - MODIFIED `page.tsx` — wrapped in SelectionProvider + SelectionCart at end
- **All 4 gallery sections pickable** (commit 04303c2) — sinks + sketches added to samples + concepts.
- **Pick button visibility fix** (commit 77a0437) — "+" was invisible on white sketch backgrounds. Now solid white bg + shadow-lg + ring-1 ring-black/10 + bold. Visible on any background.
- **Mount-type picker + size buckets + photo hint** (commit 57f9fb9) — solves customer measurement confusion:
  - 5 mount types w/ inline SVG icons: wall-hung / on-cabinet / with-side-counters / corner / "not sure-decide together"
  - 4 rough size buckets w/ relatable refs (narrow=guest toilet / standard / wide=double / not sure), NO scary exact numbers
  - Photo scale hint ("צלמו עם טלפון או כרטיס אשראי לצידו")
  - New fields folded into notes_he as structured text (NO DB migration). Included in WhatsApp message.
- **Header clock + WhatsApp button removed** (commit a5d7044) — NEW `LiveClock.tsx` (Israeli date+time, updates every second, top-center). Removed sticky header WhatsApp pill. Updated form intro heading ("מלאו פרטי בקשה") + concepts gallery subtitle.
- **Hero button removed + WhyUs #03 text** (commit df2f87c) — removed Hero CTA button ("מלאו פרטי בקשה בבקשה"). WhyUs #03 now reads "לפני שחותכים אבן יקרה, אפשרות להציג הדמייה הכוללת את הפרטים ששלחתם בטופס."

### Decisions
- **Mount "not sure" option is the most important one** — honest escape hatch for confused customers. Never force a guess.
- **Size = buckets, not numbers.** A custom marble sink should never be priced on customer self-measurement. Exact measuring happens when Ales visits. Buckets remove anxiety + still give usable ballpark.
- **Mount/size folded into notes_he** (no new DB columns) — fast, no migration, shows clearly in WhatsApp + saved notes.
- **WhatsApp auto-notify to Avshi = NOT built.** Requires paid WhatsApp Business API + Meta verification (weeks). Customer-initiated WA button achieves 90% of value free. If customers fill form but skip WA button, add free Telegram/email notify later.
- **Ad campaign POSTPONED to next weekend** — waiting on (a) Ales's new pics/data, (b) Google indexing time for the URL. Build campaign now, launch later.

### Lessons learned
- **GA4 Realtime (instant) ≠ Events list (6-24h indexing).** whatsapp_click appeared in Realtime immediately yesterday but only became starrable in Events list this morning.
- **Pick button invisibility = white-on-white.** Any overlay control needs shadow + ring to survive light AND dark backgrounds.
- **The same UI text can live in multiple components.** "תצוגה מקדימה ב-AI" was in WhyUs.tsx, not HowItWorks.tsx. Always grep for the exact string before editing — don't assume which file.
- **Header was sticky, not floating.** The "floating WhatsApp button" was the sticky-header WA pill. Sticky positioning can look like floating.
- **Turbopack JSX rule held all session** — every multi-element file shipped with single-line tags + const-extracted handlers. Zero Turbopack errors today (vs 3 yesterday). Memory rule #18 working.

### Files shipped today
- NEW: SelectionContext.tsx, SelectionCart.tsx, GalleryCard.tsx, LiveClock.tsx
- MODIFIED: Gallery.tsx, LeadForm.tsx, page.tsx, Header.tsx, Hero.tsx, WhyUs.tsx

### Open questions / blockers
- **Google Ads campaign: BUILT (paused), not launched.** Ready to enable when Ales content + Google indexing are ready (next weekend).
- **lead_form_click** still needs starring once it appears in GA4 (nobody clicked footer form link yet).
- **Email forwarder** still broken (MX + CNAME) — Session 30 priority.

### Next session (Session 30)
1. Fix email forwarder MX + CNAME
2. Star lead_form_click in GA4 once it appears
3. ENABLE the Google Ads campaign (built today, just un-pause + confirm budget)
4. Verify whatsapp_click conversions showing in GA4 Conversions column (24h after yesterday)
5. Bigger builds (parked): free AI הדמיות hookup, lead-to-quote CRM pipeline
6. FB + IG Business Pages, UTM tracker, cleanup stray Cloudinary uploads, add Trabelsi link, real logo swap


---

## 2026-05-21 — Session 28 cont. (evening) — GA4 Conversion Event tracking installed

### Goals
- Add GA4 conversion event tracking so future Google Ads campaigns can optimize toward real leads (not just clicks)
- Wire `whatsapp_click` and `lead_form_click` events into the Footer's link handlers
- Mark `whatsapp_click` as a Key Event in GA4 so it counts as a conversion

### Done
- **Footer.tsx upgraded to fire GA4 events on click.** Added `"use client"` directive (Footer is now a Client Component — required for `onClick` handlers that call browser-only `window.gtag`). Added a type-safe `trackEvent()` wrapper that no-ops gracefully if `window.gtag` is not defined (won't crash if GA4 fails to load).
- **Three click events instrumented** in the footer:
  - `whatsapp_click` with params `{ contact: "avshi", location: "footer", phone: "972505231042" }` — fires when Avshi WhatsApp button is clicked
  - `whatsapp_click` with params `{ contact: "ales", location: "footer", phone: "972504029723" }` — fires when Ales WhatsApp button is clicked
  - `lead_form_click` with params `{ location: "footer" }` — fires when "מלאו טופס" link is clicked
- **End-to-end verified in GA4 Realtime.** After deploy, clicked the Avshi WhatsApp link from the live site → GA4 Realtime "Event count by Event name" card showed `whatsapp_click = 1` within seconds. Real proof, not just installed code.
- **Vercel build error caught + fixed (again, same root cause as afternoon).** First GA4-events commit (`1377a2b`) hit the same Turbopack JSX parse error from the Footer afternoon work: line 35:8 `Unexpected token. Did you mean '{'>'}' or '&gt;'?`. Multi-line anchor tags with `>` on its own line. This is the **second time** the bug bit in one day. Fix shipped as commit `3ebde0a`: rewrote Footer with EACH anchor tag on a single line, extracted all `onClick` handlers to `const` variables ABOVE the JSX, extracted className to a `const` variable too. Single-line `<a ...>text</a>` pattern. Built clean.
- **Memory rule #18 added to skill.** "TURBOPACK JSX RULE: Next.js 16+ Turbopack rejects multi-line JSX opening tags where `>` is alone on its own line followed by text. Error: 'Unexpected token. Did you mean {'>'}?'. Bit twice in one session (commits 1612958, 1377a2b). RULE: When shipping JSX via PowerShell here-string, ALWAYS put opening tag (attributes + `>`) on ONE line. Keep `<a ...>text</a>` on one line. If attrs too long, extract handlers/classes to const vars above JSX." This permanent rule will prevent a 3rd occurrence.

### Decisions
- **Once-per-session counting, NOT once-per-event.** GA4's recommendation for the counting method is "Once per event" but that inflates conversions if the same visitor clicks WhatsApp 3 times. For lead tracking, ONE visitor = ONE lead regardless of click count. Set to "Once per session" in the Key Event config.
- **Default key event value: ILS 5000.** A marble sink customer is typically worth ₪3000-8000. ₪5000 is a conservative midpoint. This value matters because Google Ads uses it to calculate ROI-based bid optimization in future campaigns.
- **No Google Ads campaign launched today.** The conversion event is firing but GA4 hasn't indexed it into the Events list yet (6-24h delay before it appears with the star icon). Without the star, Google Ads can't optimize toward this conversion. Patience saves money — running a campaign before the conversion is marked = optimizing toward clicks, not leads, which burns budget. Wait 24h then launch.
- **Footer is now a Client Component, not a Server Component.** The `onClick` handlers require browser-only JavaScript. This is a small build behavior change with no visible downside — the rest of the page (Gallery, etc.) stays as Server Components.

### Lessons learned
- **Turbopack JSX strictness — confirmed pattern.** Single-line opening tags are mandatory when writing JSX via PowerShell here-string. Multi-line works in code editors with proper indentation, but breaks when written through PowerShell's `@'...'@` string handling. Memory rule #18 codifies this permanently.
- **Real-time GA4 verification ≠ Events list visibility.** A custom event can appear in Realtime within seconds, but won't appear in the "Recent Events" list (where you star it as Key Event) for several hours. Two different indexing pipelines on Google's backend. Don't panic when the event is "missing" — Realtime is the source of truth, not the Events list.
- **GA4 UI naming changed — "Key Events" replaced "Conversions" in 2024.** Documentation written before late 2024 calls them "Conversions". They're the same thing.
- **Google's recommended GA4 settings ≠ optimal for lead tracking.** Once-per-event counting and arbitrary $1 default value are GA4's defaults for e-commerce. For lead-based businesses, override both: once-per-session counting and a realistic customer value (₪3000-8000 for marble sinks).

### Files shipped today (evening)
- `src/components/Footer.tsx` — GA4 event tracking added, single-line JSX, Client Component

### Open questions / blockers (waiting on Google's clock)
- **`whatsapp_click` event needs 6-24h to appear in GA4's Recent Events list.** Once visible, one-click action to star it as Key Event.
- **No Google Ads campaign yet** — waiting on the star above. After the star is added, the campaign can launch with conversion-optimized bidding.

### Next session (Session 30 — full priority list)
**Priority 1 — Quick close-out tasks (15 min total):**
1. Star `whatsapp_click` in GA4 Events list (one click, takes 30 seconds)
2. Verify in GA4 Realtime that `lead_form_click` event also fires correctly (click "מלאו טופס" in footer → check GA4)

**Priority 2 — Fix the broken email forwarder (30-90 min):**
3. Find correct LiveDNS mail server hostname (from hosting welcome email or hosting account dashboard)
4. Update MX record in cPanel Zone Editor to point at that hostname
5. Fix the `mail.marble-art.co.il` CNAME loop
6. Wait for DNS propagation, re-test with `nslookup` + cPanel Track Delivery
7. Once working, can optionally create `avshi@marble-art.co.il` Google account and transfer GA4 / Search Console ownership

**Priority 3 — Google Ads campaign launch (60-90 min, AFTER priorities 1 & 2):**
8. Create Google Ads account under `avshi2@gmail.com`
9. Link Google Ads ↔ GA4 (so Ads can read our Key Events)
10. Launch first campaign with conversion-optimized bidding, geographic targeting (TBD: all Israel vs Tel Aviv+Sharon), budget (TBD: ₪150-300 over 3 days for learning phase)

**Priority 4 — Intake form file upload V2 feature (2-4 hours):**
11. Allow customers to upload reference images / videos / PDFs of the sink they want
12. Cloudinary upload widget integration
13. Supabase column for asset URLs
14. Hebrew RTL upload UX with file type/size validation

**Priority 5 — Facebook + Instagram Business Pages (30 min, no code):**
15. From Ales's existing personal Facebook → create new Marble Art Business Page (NOT a second personal account — Meta will suspend)
16. Create Instagram Business account linked to the new Page via Meta Business Suite
17. No new accounts created — just new business pages on existing personal login

**Priority 6 — UTM campaign tracker spreadsheet (30 min):**
18. Build single Google Sheet listing every campaign you've run with: date, channel, budget spent, leads generated, cost per lead
19. Reference spreadsheet pattern in UTM_TEMPLATES_21052026.md

**Priority 7 — Skill v17 update (15 min):**
20. Codify Rule #21 (Turbopack JSX strictness) into skill file properly
21. Codify Rule #22 (always pre-check MX records when domain migrates to Vercel/serverless host)

---

## 2026-05-21 — Session 28 cont. (afternoon) — Priority 1 SEO + Analytics + Footer WhatsApp

### Goals
- Submit marble-art.co.il to Google Search Console + verify ownership + submit sitemap
- Set up Google Analytics 4 (GA4) with end-to-end verification
- Prepare UTM tracking templates for future ad campaigns
- Replace broken email links in footer with WhatsApp direct buttons (for ad campaign readiness)

### Done
- **Google Search Console — VERIFIED + SITEMAP SUBMITTED.** Property added at `https://www.marble-art.co.il` using URL prefix method. Verified via HTML tag method (Next.js `metadata.verification.google` field in `layout.tsx`). Google auto-detected the verification meta tag within seconds of Vercel deploy. Sitemap `sitemap.xml` submitted successfully (status: Success). First indexing data expected within 24-48 hours.
- **GA4 — INSTALLED + LIVE DATA VERIFIED.** New property "Marble Art Sinks" created inside existing "Avshi Back Office" GA4 account (account ID `375030219`). Property configured: Israel time zone, ILS currency, three business objectives (Generate leads, Understand traffic, Engagement & retention). Web data stream created for `https://www.marble-art.co.il`. Measurement ID: `G-0VV9NZFRXP`. Enhanced measurement enabled (auto-tracks page views, scrolls, outbound clicks, etc.).
- **GA4 installed via `@next/third-parties/google` package** — official Next.js GA4 integration, cleaner than raw `<script>` tags. Added to `src/app/layout.tsx` with `<GoogleAnalytics gaId={GA_MEASUREMENT_ID} />` inside the `<html>` element.
- **GA4 end-to-end verified on production** — Realtime overview showed: 1 active user (us), location pin near Tel Aviv-Yafo / Holon (IP-based geolocation, approximate but correct region), page title "Marble Art Sinks — כיורי שיש..." captured correctly. Real data, not just installed-but-untested.
- **Footer rebuilt — two direct WhatsApp buttons, email links removed.** Replaced the previous footer's `mailto:avshi@marble-art.co.il` and `mailto:ales@marble-art.co.il` links (both routing into a broken forwarder — see "Major discovery" below) with two `https://wa.me/` links: Avshi `972505231042`, Ales `972504029723`. Each opens WhatsApp with a pre-filled Hebrew customer message (`שלום, ראיתי את האתר של מרבל ארט ומעוניין/ת בכיור שיש.`) to reduce friction and signal source. Tested end-to-end — clicking opens WhatsApp with message pre-filled correctly.
- **Vercel build error caught and fixed (first occurrence).** First Footer commit (`1612958`) failed Vercel build with Turbopack JSX parse error on line 29:8. Root cause: PowerShell here-string write produced JSX with the closing `>` of an anchor tag on its own line. Fix shipped as commit `8691d86`: rewrote Footer with each anchor tag's content on a single line. Built clean.
- **UTM tracking templates document created** — `UTM_TEMPLATES_21052026.md` saved to repo root. Three templates: Google Ads, Meta paid social, WhatsApp/direct outreach. Includes naming rules, real-world examples, and Session 29+ roadmap.
- **Strategic decision documented — Facebook/Instagram for Marble Art.** Create a new Facebook Business Page from Ales's existing personal account (NOT a second personal Facebook — Meta will suspend duplicate personal accounts on the same phone/device). Same approach for Instagram via Meta Business Suite.

### Major discovery — broken email infrastructure (parked for Session 30)

While trying to verify a Google account for `avshi@marble-art.co.il`, discovered the email forwarder is silently dropping ALL inbound mail.

- Google verification code sent to `avshi@marble-art.co.il` → never arrived at forwarder destination `avshi2@gmail.com`.
- cPanel Trace simulation showed forwarder correctly configured. Looked healthy.
- cPanel Track Delivery (actual log, not simulation) showed **0 records in last 10 days** — server never received any mail.
- `nslookup -type=MX marble-art.co.il 8.8.8.8` → `MX preference=0, mail exchanger = marble-art.co.il`. **MX record points apex domain at itself.**
- `nslookup mail.marble-art.co.il 8.8.8.8` → resolves via CNAME alias back to `marble-art.co.il` → `76.76.21.21` (Vercel's IP).

**Root cause:** apex A record points to Vercel (`76.76.21.21`) for web hosting (correct), but MX record also points to `marble-art.co.il`, so all email goes to Vercel's web servers (which silently drop it). The `mail.marble-art.co.il` CNAME is also broken (loops back to apex).

**The fix (Session 30):** Get correct LiveDNS mail server hostname. Update MX record. Fix CNAME loop. Re-test.

**Mitigation today:** removed all email links from footer, replaced with WhatsApp.

### Decisions
- **Skip email fix today.** Would take 1-2 more hours with DNS propagation wait. Email fix scheduled as Session 30.
- **GA4 ownership stays on `avshi2@gmail.com` for now.** Can transfer to `avshi@marble-art.co.il` after email forwarder fix.
- **Use `@next/third-parties/google` for GA4, not raw `<script>` tags.** Official Next.js integration.
- **WhatsApp pre-filled message is a permanent pattern.** Every WhatsApp link should use the same format.
- **Two-WhatsApp-buttons (not one).** Customers choose who to contact.

### Lessons learned
- **Turbopack JSX is stricter than old SWC.** Keep JSX anchor content on single line via PowerShell here-string.
- **DNS Trace ≠ Track Delivery in cPanel.** Trace = simulation, Track Delivery = actual log. Always check Track Delivery.
- **MX records pointing at apex domains hosted on Vercel/Netlify = silent email death.** Pre-check MX on any domain migrated to serverless.
- **GA4's "48 hours" message is misleading.** Realtime data appears within 1-5 minutes.
- **Search Console HTML tag method via Next.js `metadata.verification.google` is fastest.**

### Files shipped (afternoon)
- `src/app/layout.tsx` — Google verification meta tag + GA4 tag via `@next/third-parties/google`
- `src/components/Footer.tsx` — email links replaced with two WhatsApp buttons
- `package.json` + `package-lock.json` — added `@next/third-parties` dependency
- `STATUS.md` (Sinks_ART repo) — afternoon entry
- `UTM_TEMPLATES_21052026.md` — UTM reference document

---

## 2026-05-21 — Session 28 cont. (morning) — V8 Gallery LIVE — root cause: swapped Cloudinary credentials

### Goals
- Diagnose and fix V8 gallery empty-on-live-site blocker from Session 28
- Restore the four gallery sections (sinks → samples → concepts → sketches) on marble-art.co.il

### Done
- **V8 gallery LIVE on production** — all four sections render real images from Cloudinary as designed.
- **Root cause identified — swapped credentials, not a folder issue.** `CLOUDINARY_API_KEY` slot held a 27-character value (format of an API secret), while `CLOUDINARY_API_SECRET` held the wrong value too. Cloudinary returned silent 401 on every API call. Original code's `if (!res.ok) return []` swallowed the 401 with no visible error.
- **`src/lib/cloudinaryGallery.ts` rewritten** — switched from `/resources/by_asset_folder` to Search API (`POST /resources/search`) with expression `folder="x" OR asset_folder="x"`. Works for both folder modes. Added structured `[Gallery]` logging visible in Vercel Function Logs.
- **`.env.local` corrected** — re-pasted 15-digit API Key and 27-char API Secret from Cloudinary Console into correct slots.
- **Vercel env vars corrected** — both updated via project Settings → Environment Variables.
- **Redeploy WITHOUT build cache** executed — same Rule #20 trap as Session 18.
- **Cloudinary folder structure confirmed** — dynamic folder mode. Assets store `folder=''`, `asset_folder='marble-art/<section>'`. 64 image assets in account (35 expected + 29 strays).

### Decisions
- **Search API over by_asset_folder going forward.** Single endpoint, both folder modes, sub-folders supported.
- **Diagnostic logging stays on in production.** Cheap server-only console.info lines.
- **Credentials policy reinforced.** Verify format before saving: API Key = 15 digits, API Secret = ~27 chars.

### Lessons learned
- **Silent 401 is the worst error.** Handlers returning `[]` on non-2xx hide the most important debugging signal.
- **"It works locally" lies if local and Vercel env vars are both wrong the same way.**
- **Verify the shape of an API value before assuming it's right.** 15 digits vs 27 chars = 5-second check.

---

## 2026-05-20 — Session 28 (in progress) — Dynamic Cloudinary Gallery V8 + asset upload pipeline

### Goals
- Upload curated assets to Cloudinary organized folder structure
- Build dynamic Gallery component that reads from Cloudinary by folder
- Add Cloudinary API credentials to Vercel + .env.local
- Strategic decision on Trabelsi partnership for marble samples

### Done
- **Cloudinary folder structure created** under `marble-art/`: sinks/ (9), samples/ (11), concepts/ (11), sketches/ (4), plus reserved full-bathroom/, process/, leads/
- **35 total assets uploaded + organized** with naming convention.
- **Cloudinary API credentials added** to .env.local + Vercel.
- **V8 Gallery component shipped** — commit `3f8f03d`. 3 files. 4 themed sections, server-component, 5-min revalidate cache, AI concepts labeled "הדמיה".
- **Marble samples strategy locked in** — Trabelsi direct billing model, no Ales inventory risk.

### Decisions
- Trabelsi partnership = informal/operational only for V1.
- Pricing = direct billing (customer pays Trabelsi for stone, Ales for craft).
- No imports — Trabelsi is the supply chain.
- AI concepts MUST be labeled "הדמיה".
- Cloudinary folder structure is the gallery contract.
- API credentials server-only.

### Open questions / blockers (at end of session)
- **🚨 V8 GALLERY EMPTY ON LIVE SITE** — RESOLVED next morning. Was swapped credentials.

---

(... older session entries preserved below — see git history if file gets truncated ...)

