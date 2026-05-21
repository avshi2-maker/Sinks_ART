# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.

---

## 2026-05-20 — Session 28 (in progress) — Dynamic Cloudinary Gallery V8 + asset upload pipeline

### Goals
- Upload curated assets (sinks, samples, concepts, sketches) to Cloudinary organized folder structure
- Build dynamic Gallery component that reads from Cloudinary by folder (no manual URL hardcoding)
- Add Cloudinary API credentials to Vercel + .env.local for server-side resource listing
- Strategic decision on Trabelsi partnership for marble samples sourcing

### Done
- **Cloudinary folder structure created** under `marble-art/`:
  - `sinks/` (9 real photos of finished sinks by Ales)
  - `samples/` (11 Trabelsi marble swatches)
  - `concepts/` (11 AI-generated sink renders)
  - `sketches/` (4 hand drawings by Ales)
  - `full-bathroom/`, `process/`, `leads/` (empty, reserved)
- **Cleaned up 4 stray empty sub-folders** (Sink-on-cabinet, Combined-colors, Video-sink, Double-sinks) — left over from earlier confusion.
- **35 total assets uploaded + organized** in correct folders. Naming convention applied:
  - Real: `sink_[stone]_[number].jpg`
  - Concepts: `concept_[stone]_[number].jpg`
  - Sketches: `sketch_[shape]_[number].jpg`
  - Samples: Trabelsi-supplied names preserved (`atlantis_sand.jpg`, `ghost_grey.jpg`, etc.)
- **Decided to skip per-image tagging** — folder structure provides enough granularity for V1 gallery. Tagging deferred until library exceeds 30+ images per folder OR filter chips become needed.
- **Cloudinary API credentials retrieved + added** to both `.env.local` AND Vercel env vars:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dqdku88vv` (was previously EMPTY — fixed today)
  - `CLOUDINARY_API_KEY` (Root key from Cloudinary console)
  - `CLOUDINARY_API_SECRET` (Root secret)
- **V8 Gallery component shipped** — commit `3f8f03d` on campaign repo. 3 files (`src/components/Gallery.tsx`, `src/lib/cloudinaryGallery.ts`, `src/app/page.tsx`).
  - Renders 4 themed sections in order: sinks → samples → concepts → sketches
  - Uses Cloudinary Admin API `/resources/by_asset_folder` (server-side fetch with Basic auth)
  - Server Component (async), 5-min revalidate cache
  - Auto-hides empty sections to avoid "coming soon" placeholders
  - AI concepts display with "הדמיה" badge for legal honesty
  - Samples display with hover-reveal Hebrew stone names
  - Real sinks display as primary 3-column hero grid
- **Marble samples strategy locked in:**
  - Customer flow: marble-art.co.il → customer visits Trabelsi showroom → picks real stone → Trabelsi bills for stone, Ales bills for craft (two separate receipts)
  - No inventory risk for Ales, no import logistics
  - Site shows samples + simple text-only link to trc.co.il (no deep integration, no Trabelsi branding/co-marketing on site yet — to be discussed when partnership formalizes)

### Decisions
- **Trabelsi partnership = informal/operational only for V1.** Ales has the relationship. They know Ales uses their stone. No formal written deal yet. Site shows samples without naming Trabelsi.
- **Pricing flow = direct billing.** Customer pays Trabelsi for stone, Ales for craft. Clean separation. Will revisit "all-in" pricing once trial campaign validates volume.
- **No imports from Italy/China.** Trabelsi inventory is the supply chain. Israeli-only stone sourcing.
- **AI concepts MUST be labeled.** Honest framing via "הדמיה" badge prevents trust breaks at delivery time.
- **Cloudinary folder structure is the gallery contract.** Gallery code reads from specific folder paths. Adding new images to those folders auto-updates the site within 5 min (no code redeploy needed).
- **API credentials are server-only.** `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` have NO `NEXT_PUBLIC_` prefix — they stay server-side.
- **FTP architecture for lead uploads** deferred to Session 28+. Will hold large/raw assets Ales generates; Cloudinary holds only curated published content.

### Open questions / blockers
- **🚨 V8 GALLERY EMPTY ON LIVE SITE** — committed and deployed, but `כיורים שבנינו` (first section) shows empty. Likely diagnosis:
  - Cloudinary `/resources/by_asset_folder` endpoint may need different param name (`asset_folder` vs `folder` vs `prefix`)
  - OR folder metadata stored as `folder` field (not `asset_folder`) when uploaded via web UI
  - Need to check Vercel Function Logs for `[Gallery]` warnings
  - Likely fix: switch endpoint to `/resources?type=upload&prefix=marble-art/sinks/` instead
- **No Vercel logs reviewed yet** — user was unable to share screenshots when blocker discovered.
- **Trabelsi conversation not yet had** — Ales to handle.
- **Logo "M" still placeholder** — Ales sending real logo soon.

### Next session (continuation)
- **PRIORITY 1: Fix V8 gallery empty issue.** Diagnose Cloudinary API response format, ship corrected `cloudinaryGallery.ts`.
- **PRIORITY 2: Google Search Console submission** + verify domain + submit sitemap.
- **PRIORITY 3: Google Analytics 4 setup** with UTM tracking before any ad campaign.
- **Re-add inspiration file upload** (V2 feature deferred earlier, customer reference image uploads).
- **FTP architecture discussion** — folder convention, who has credentials, auto-tagger from FTP, review UI, Cloudinary upload step.
- **Quiz/wizard intake flow (Phase 24)** — 8-step conversion engine (4-6 hours, Session 29+).

---

## 2026-05-19 — Session 27 cont. — V5/V6/V7 SEO polish + email forwarders + DNS wire-up

### Goals
- Wire up `marble-art.co.il` domain (just approved by ISOC-IL) to Vercel
- Configure email forwarders for `avshi@` and `ales@` addresses
- Verify Open Graph previews work correctly for WhatsApp/Facebook sharing
- Ship full SEO metadata (28 keywords, JSON-LD structured data, sitemap, robots)

### Done
- **Domain `marble-art.co.il` LIVE with auto-SSL** on Vercel. Both apex + www work, 307 redirect from apex → www.
- **DNS records updated in LiveDNS cPanel Zone Editor** (only 2 changes, all other records preserved for email/cPanel infrastructure):
  - Apex A record: `185.60.168.165` → `76.76.21.21` (Vercel)
  - www CNAME: `marble-art.co.il` → `cname.vercel-dns.com`
- **DNS propagation completed in <30 min** (faster than typical `.co.il` timeline)
- **SSL certificate auto-issued by Vercel** within 5 min of DNS resolution
- **Email forwarders configured in LiveDNS cPanel:**
  - `avshi@marble-art.co.il` → `avshi2@gmail.com` ✅ tested working
  - `ales@marble-art.co.il` → `ak.avodot.gmr@gmail.com` ✅ live
- **V5 SEO shipped** (commit on campaign repo): full metadata in `layout.tsx`, JSON-LD LocalBusiness structured data, sitemap.ts, robots.ts, footer updated with both emails
- **V6 OG image fix** — replaced 7.3 MB portrait `hero-render.jpg` with 1200×680 landscape `og-image.jpg` (~400 KB). Used iLoveIMG to crop.
- **V7 keyword expansion** — 28 keywords total covering Hebrew product terms, customer language (white/black marble, gold accent), service types (renovation, villa), English internationals (Calacatta, Statuario, Italian marble)
- **Open Graph verification at opengraph.xyz** — preview now shows agate sink + Hebrew title + description correctly. Remaining "issues" are upsell suggestions (text overlay) — declined as off-brand for premium positioning.

### Decisions
- **Email is footer-only backup channel.** Main contact = website form (→ Supabase) + WhatsApp. Email accounts won't actively receive customer-initiated mail except rare cases.
- **Both emails forward to gmail.** Ales handles his own customer emails via his gmail; Avshi gets full visibility via his gmail. Two separate forwarders, no copy-to.
- **SPF/DKIM/DMARC concerns deferred** — will fix only if customers report bouncing/spam issues. Trial campaign won't be email-heavy.
- **OG image accept-as-is (1200×680 vs perfect 1200×630).** 50 px difference invisible to humans, WhatsApp/Facebook crop slightly differently anyway.
- **Trabelsi partnership locked to "send traffic, no deep integration" for V1.** Site shows generic samples without Trabelsi branding/badge until partnership formalized.
- **Italian marble import not in business model.** Trabelsi inventory is the supply chain.

### Open questions / blockers
- **None blocking after this session.** Domain live, emails working, SEO shipped, site fully functional.
- **Google won't index for 1-3 days unless submitted to Search Console** — Session 28 task.
- **No real photos of finished sinks yet** — Session 28 will source from Ales.

### Lessons learned
- **LiveDNS Zone Editor is the right place** for DNS — not the "Name Servers" page (which only shows where domain points). The `linux1/linux2.livedns.co.il` nameservers are correct defaults; just need to edit individual zone records.
- **Cloudinary cloud name CAN be empty in env vars** — happened in Vercel. Critical to verify NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME has actual value `dqdku88vv`, not just exists.
- **Cloudinary API key field "Root"** is the master key. The other auto-generated keys (`moderation`, `mediaflows_*`) are scoped to specific features and won't work for general resource listing.

### Next session
- See Session 28 (above).

---

## 2026-05-18 → 2026-05-19 — Session 27 — Marble Art Sinks campaign site LAUNCH DAY

### Goals
- Scaffold a brand new Next.js campaign site for marble-art.co.il (separate from CRM repo Sinks_ART)
- Build Hebrew RTL landing page with hero, value props, gallery placeholder, lead form
- Wire form to Supabase (shared with CRM)
- Israeli phone validation
- Deploy to Vercel
- Wait for domain approval (LiveDNS / ISOC-IL)

### Done
- **New Next.js 16.2.6 + React 19.2.4 + TypeScript + Tailwind v4 scaffold** at `C:\SinkS\sinks-bathroom-design\` and `github.com/avshi2-maker/sinks-bathroom-design`
- **Stack:** App Router, `src/` structure, Heebo font from Google Fonts for Hebrew, `dir="rtl"` on `<html>`
- **12 source files in `src/`:**
  - `app/layout.tsx` — Heebo font, base metadata
  - `app/globals.css` — Tailwind v4 with `@theme` and CSS variables (charcoal #0F0F0F, cream #F5F1EA, brass #B89968)
  - `app/page.tsx` — page composition
  - `app/actions.ts` — server action `submitLead` writing to Supabase
  - `components/Header.tsx` — sticky header with M placeholder logo + WhatsApp button
  - `components/Hero.tsx` — agate render full-bleed background, "אל תסתפקו בשיפוץ" tagline, brass CTA
  - `components/WhyUs.tsx` — 3-column value props
  - `components/HowItWorks.tsx` — 4-step process, dark section
  - `components/Gallery.tsx` — initial Supabase-based empty state (later replaced V8)
  - `components/LeadForm.tsx` — 6-field form with budget tiers + project types
  - `components/PhoneInput.tsx` — Israeli phone validator (mobile 05X+7, landline 0X+7-8, strips +972/dashes)
  - `components/Footer.tsx` — dark footer with brand mark + dual emails + WhatsApp
  - `lib/supabase.ts` — client singleton
- **Hero image:** spectacular Madagascar agate sink Nano Banana render at 7.3 MB (`public/hero-render.jpg`)
- **Form pipeline working end-to-end:** browser → server action → Supabase `leads` table → row visible in Table Editor
- **RLS policies applied to leads table:**
  - `Allow anonymous lead submission` — INSERT only, WITH CHECK (status='new')
  - `Allow service role full access` — ALL for service_role
- **Israeli phone validation:** live green ✓ for valid mobile/landline, red ✗ for invalid, error messages in Hebrew
- **WhatsApp button strategy:** auto-open after submit DEFERRED — form just saves to Supabase, Avshi contacts manually for personal touch (decision: "I'll WhatsApp them when I'm ready")
- **Vercel deployment via GitHub import** — Hobby plan, project `sinks-bathroom-design`, env vars imported from `.env.local` (Supabase URL, anon key, WhatsApp number, Cloudinary cloud name)
- **First commit `a458ce2`:** 35 files, 8,040 insertions, "Session 27: Next.js scaffold + Hebrew RTL landing page + lead form + Supabase + agate hero"
- **Initial deploy:** `sinks-bathroom-design.vercel.app` — public URL working with full HTTPS

### Decisions
- **Two-repo architecture:** Campaign site (`sinks-bathroom-design`) writes to leads, reads sink_media. CRM (`Sinks_ART`) full access via service_role. Both share Supabase `givcxgzhfoetujhrjgvc.supabase.co`.
- **Old static Gemini mockup preserved in `archive/static_mockup_v1_18052026/`** before fresh scaffold.
- **WhatsApp button taxonomy locked:**
  - Header `וואטסאפ` → opens WhatsApp directly
  - Hero CTA `מלאו פרטי בקשה בבקשה` → smooth-scrolls to form
  - Footer: `וואטסאפ` (opens WA) + `מלאו טופס` (scrolls to form)
- **Phone normalization at form submit:** strip to digits-only, store as `0505231042` in DB (not `+972...` or `050-...`). Cleaner for dedup + admin tools.
- **Inspiration file upload (V2 feature) DEFERRED** — temporarily removed from LeadForm to ship core flow first. Will re-add in Session 28 after FTP architecture decision.
- **Graceful degradation patterns:** Gallery shows "coming soon" if no items; Hero shows CSS gradient if hero image missing.

### Files in repo (committed in a458ce2)
```
.gitignore (NEW, excludes node_modules + .env*)
archive/static_mockup_v1_18052026/ (old Gemini mockup preserved)
public/hero-render.jpg (7.3 MB Madagascar agate sink)
src/app/* (5 files including actions.ts, globals.css, layout.tsx, page.tsx, test-supabase/page.tsx)
src/components/* (9 files: Header, Hero, WhyUs, HowItWorks, Gallery, LeadForm, PhoneInput, Footer, InspirationUpload [defined but unused])
src/lib/supabase.ts
+ Next.js scaffold files (eslint, postcss, next.config, package.json, tsconfig)
```

### Open questions / blockers (at session end)
- **Domain not approved yet** — `marble-art.co.il` purchase pending ISOC-IL approval (typically 1-3 days).
- **`.vercel.app` URL works** but not branded — temporary until domain lands.
- **InspirationUpload component deferred** — was causing build errors (V2 dependencies removed alongside).
- **No real images on gallery** — empty state showing "coming soon" placeholder.

### Lessons learned
- **PowerShell `Add-Content` is silent on success.** No output = good.
- **Two `.env.local` files can confuse:** one in `Sinks_ART/`, one in `sinks-bathroom-design/`. Always verify path before editing.
- **Cursor's search bar can lie about file contents** if you have the wrong file open. PowerShell `Select-String` is the ground truth.
- **Vercel auto-deploys on every git push to main.** Build time ~2-3 min.
- **DNS propagation for `.co.il` can be as fast as 15-30 min** despite the "up to 24 hours" warning.

### Next session
- See Session 27 cont. (V5-V7 SEO + domain wire-up) above.

---

## 2026-05-07 — Session 18 cont. — Production env vars fix + REAL end-to-end verification

### Goals
- Diagnose 500 error from `/api/sinc-transcribe` on production (`ELEVENLABS_API_KEY is not set in environment`).
- Apply the Vercel fix correctly, without repeating the prior session's confused "Link Shared Variable" path.
- Genuinely verify the full SinC-ART pipeline on production — not just page load.
- Correct the false "Production verified on phone" claim in the earlier Session 18 entry.

### Done
- **Confirmed code is correct on `main`** — production deployment `9iEaJSiMG` (Current) is a redeploy of `FbFYFaoSH`, built from commit `911ba33` which contains all of Phase D. Code was never the problem.
- **Confirmed env vars at project level (not shared/team)** — `ELEVENLABS_API_KEY` (Sensitive) + `ELEVENLABS_MODEL_ID = scribe_v1`, both scoped Production+Preview, present in the project-level Environment Variables tab. The prior session HAD completed adding them; the handover doc was outdated about this state.
- **Root cause identified** — the production deployment had been built BEFORE the env vars were added at the project level. Vercel bakes env vars at **build time**, not runtime — adding them post-build does nothing until a fresh build runs. Build cache must be disabled on the redeploy for new env vars to be embedded.
- **Redeploy without build cache executed** — Vercel UI: `···` menu on the Current row → Redeploy → unchecked "Use existing Build Cache". New deployment went Ready in ~60s and inherited the Current badge.
- **REAL end-to-end production verification** at `https://sinks-art.vercel.app/sinc` with a Hebrew audio call. Cost meter readings:
  - Cloudinary upload: 2.4s, $0.0000 ✅
  - ElevenLabs Scribe v1 transcription: 7.0s, $0.2667 ✅ (Hebrew speakers diarized as דובר 1 / דובר 2)
  - Claude analysis: 13.7s, 1,223 input / 549 output tokens, $0.0119 ✅
  - **Total per call: $0.2786**
- **Save flow verified on production** — comm_id `a5b08005...`, "פרויקט חדש נוצר" badge shown, Path B (new customer + auto-created lead project) round-trip confirmed.
- **/sinc page is fully Phase D operational on production.** First time genuinely true since the page shipped.

### Decisions
- **Honest correction over rewrite.** The earlier Session 18 entry's "Production verified on phone" line was false at the time it was written (only page-load was tested, not the pipeline). Per this file's own rule ("Append, never rewrite past entries"), the line stands as-is in the prior section; this entry is the correction of record.
- **Redeploy without cache is mandatory** when env vars are added or changed on Vercel. Adding as Rule #20 in skill v16.
- **Two-step Vercel env var verification flow locked in** — (1) screenshot of project-level env vars page to confirm presence, (2) only then redeploy without cache. The "Link Shared Variable" UI is too confusing on Hobby plan and is hereby ruled out for future sessions.

### Open questions / blockers
- **None blocking.** Production is stable, code is on `main`, Phase D is verified end-to-end with real cost data.
- **Cosmetic UI line:** "לא נבחר לקוח — נמען המייל / WhatsApp לא ימולא אוטומטית" — this is expected behavior (export buttons need a customer link to auto-fill recipients). Not a bug.
- **GoTrueClient warning** — carry-over from earlier entry. Harmless; cleanup in future polish phase.

### Lessons learned
- **Verification ≠ page load.** A page rendering proves nothing about whether its API endpoints work. The word "verified" going forward requires an end-to-end test with real input, visible cost meter readings, AND a successful save (where applicable). If there is no cost number to point at, the feature is not verified on production.
- **Vercel build-cache trap.** Env vars added after a deployment's build do not retroactively apply. Any env var change requires a redeploy with build cache **OFF**.
- **Verify current state before re-prescribing a fix.** A handover claiming "X is broken / try Y" should be cross-checked against the actual current state of the system before repeating Y. The prior session's env var work was already done; re-running the same UI dance would have wasted more time.

### Next session
- **Phase E** — move legacy single-file SinC-ART demos (`demos/sinc_art_call_intake_*.html`) to `demos/legacy/`. ~30 min.
- **Phase 16 starter — `/customers/[id]`** — so saved calls (like today's `a5b08005`) are viewable in-app, not only via Supabase Table Editor. Lights up ExportFooter's "פרויקט" placeholder button. ~90 min.
- **Skill v16 update** — add Rule #20 (redeploy without cache after env var changes); add "verification ≠ page load" to the "what good looks like" section.

## 2026-05-07 — Session 18 — SinC-ART Phase D: customer/project save flow — committed 548cb76

### Goals
- Activate the disabled "✓ אשר ושמור" button on /sinc.
- Two-path UX: pick existing customer OR create new + auto-link to project.
- Save runs the full chain: customer (if new) → project (if needed) → customer_communications → media_analyses (with media_type='audio').
- Verify both paths end-to-end in Supabase.
- Production verify on phone.

### Done
- **Phase D shipped end-to-end** — single A-to-Z commit `548cb76`, 7 file changes, +899 / -172 lines.
- **Schema diagnostic FIRST (lesson from previous sessions):** ran 5 queries against Supabase to verify whitelists + RLS state before writing TypeScript. Found media_type whitelist missing 'audio'; everything else looked OK on first pass. (3 more schema gaps surfaced during testing — see "Lessons learned".)
- **SQL migration #1:** `phase_d_audio_media_type_06052026-v1.sql` — added 'audio' to `media_analyses.media_type` whitelist. Atomic ALTER TABLE, no data touched.
- **SQL migration #2:** `phase_d_anon_insert_customers_07052026-v1.sql` — added missing `anon_insert_customers` RLS policy on customers table (mirrors the existing `anon_insert_projects` pattern).
- **types.ts updated:**
  - Added `SincCallFullSavePayload` (full save bundle including speakerMap + bubbles + raw transcript)
  - Added `SincCallSaveResult` (returns comm_id + media_id + project_id + project_was_new flag)
  - Fixed `SincProjectRow` to match actual schema: dropped `notes_jsonb`, added `description_he` + `notes` (text) + `inquiry_date`
  - Marked legacy `SincCallSavePayload` as `@deprecated` (kept for backwards-compat per Rule #3)
- **supabaseSinc.ts updated:**
  - New `createCustomer(nameHe, phone, notes)` — uses `source='phone'` (matches whitelist)
  - New `listActiveProjectsForCustomer(customerId)` — returns ALL active projects, not just most-recent
  - New `saveCallFull(payload)` — chains createLeadProject (if needed) → INSERT customer_communications → INSERT media_analyses, with orphan-id error message if step 3 fails after step 2
  - Single `PROJECT_COLS` constant reused across 3 SELECTs (DRY fix from earlier inconsistency)
  - Legacy `saveCallAnalysis` kept with `@deprecated` JSDoc per Rule #3
- **SaveCustomerModal.tsx (NEW, 350 lines):**
  - Two-tab UX: 🔍 לקוח קיים + ➕ לקוח חדש
  - Pick tab: searchable customer list + project picker (existing or auto-create new)
  - New tab: name (required) / phone / notes form, name pre-filled from Claude's `customer_name_he` extraction
  - Modal pattern: dismissable, click-outside-to-close, ESC implicit via backdrop
- **CallProcessingFlow.tsx updated:**
  - 5-state save state machine: `idle` → `modal_open` → `saving` → `saved` | `save_error`
  - Replaced disabled placeholder button with real flow
  - Success badge shows comm_id (first 8 chars) + " · פרויקט חדש נוצר" when applicable
  - Error state with retry button (preserves analysis state — no re-pipeline cost)
  - "שיחה חדשה" button on success → calls onCancel → returns to file picker
- **End-to-end LOCAL test PASSED — Path A (existing customer):** comm `0e572a17`, ~280ms total write time, full row chain in Supabase verified (customer + project + comm + media all linked correctly). Cost: $0.5458.
- **End-to-end LOCAL test PASSED — Path B (new customer):** customer "גל ספיר חדש" + auto-created project + comm `2a74496c` + media row, ~342ms total. All 4 inserts succeeded after 2 RLS/whitelist patches. Cost: $0.2780.
- **Production verified on phone** — `sinks-art.vercel.app/sinc` loads cleanly, footer shows expected Phase B/C label (Phase D doesn't change visible markers, only adds save functionality).

### Files in repo (committed in 548cb76)
```
phase_d_audio_media_type_06052026-v1.sql                              (NEW, stray copy at root — TO BE CLEANED)
src/components/sinc/CallProcessingFlow.tsx                            (modified — Phase D save state machine)
src/components/sinc/SaveCustomerModal.tsx                             (NEW, 350 lines)
src/lib/sinc/supabaseSinc.ts                                          (modified — saveCallFull, createCustomer, etc.)
src/lib/sinc/types.ts                                                 (modified — Phase D types + schema fix)
supabase/phase_d_anon_insert_customers_07052026-v1.sql                (NEW, applied to Supabase)
supabase/phase_d_audio_media_type_06052026-v1.sql                     (NEW, applied to Supabase)
```

### Decisions
- **Save runs client-side** (not via new server endpoint) — matches existing /intake pattern. RLS is the enforcement layer; supabase service key stays server-only.
- **Auto-create "ליד" project when customer has no active project** — title `שיחה - dd/mm/yyyy`, description "נוצר אוטומטית משיחת לקוח (SinC-ART)", inquiry_date set to today.
- **`source='phone'` for sinc-call customers** — semantic match (a SinC call IS a phone call). Available on existing whitelist; no migration needed.
- **NOT atomic across the 3 INSERTs** — if step 3 (media_analyses) fails after step 2 (comm), the orphan comm_id is included in the error message for future cleanup. Acceptable tradeoff for Phase D; transactional pattern can be added in a future RPC if needed.

(... older session entries preserved below this line — see git history if file gets truncated ...)
