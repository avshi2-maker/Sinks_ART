# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.

---

## 2026-05-21 — Session 28 cont. — V8 Gallery LIVE — root cause: swapped Cloudinary credentials

### Goals
- Diagnose and fix V8 gallery empty-on-live-site blocker from Session 28
- Restore the four gallery sections (sinks → samples → concepts → sketches) on marble-art.co.il

### Done
- **V8 gallery LIVE on production** — all four sections render real images from Cloudinary as designed.
- **Root cause identified — swapped credentials, not a folder issue.** Cloudinary `CLOUDINARY_API_KEY` slot in `.env.local` and Vercel held a 27-character value (format of an API **secret**), while `CLOUDINARY_API_SECRET` held the wrong value too. Cloudinary returned silent 401 Unauthorized on every Admin/Search API call. The original `by_asset_folder` endpoint code's `if (!res.ok) return []` swallowed the 401 with no visible error — gallery appeared "empty" with no diagnostic signal.
- **`src/lib/cloudinaryGallery.ts` rewritten** — switched from `/resources/by_asset_folder` to the Search API (`POST /resources/search`) with expression `folder="x" OR asset_folder="x"`. Works for both folder modes; future-proof against this category of bug. Added structured `[Gallery]` console logging visible in Vercel Function Logs (folder, total_count, first asset's folder/asset_folder fields).
- **Local `.env.local` corrected** — re-pasted the 15-digit API Key and 27-char API Secret from Cloudinary Console → Settings → API Keys, into the correct slots. Length verification confirmed 15 / 27.
- **Vercel env vars corrected** — both `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` updated via project Settings → Environment Variables. All three environments (Production / Preview / Development) checked.
- **Redeploy WITHOUT build cache** executed — same Rule #20 trap as Session 18. New deployment went Ready, gallery populated within seconds.
- **Cloudinary folder structure confirmed** — dynamic folder mode. Assets store `folder=''` (empty) and `asset_folder='marble-art/<section>'`. Total 64 image assets in account (includes earlier session test uploads beyond the 35 from Session 28).
- **Diagnostic methodology captured** — PowerShell direct API call to Cloudinary `/usage` endpoint with `.env.local` values is the fastest auth-vs-data-vs-config triage. Bypasses all Next.js / Vercel / build-cache layers and reads the truth directly from the API. Worth recording for future credential debugging.

### Decisions
- **Search API over by_asset_folder going forward.** Single endpoint, two folder modes covered, sub-folders supported. Trade-off is one extra API call per page render (counted against Cloudinary credits) vs eliminating an entire category of "empty array, silent 401" failures. Worth it.
- **Diagnostic logging stays on in production.** The `[Gallery]` console.info lines in `cloudinaryGallery.ts` are kept enabled — they are cheap, server-only, and give us instant root-cause data the next time a folder query returns empty.
- **Credentials policy reinforced.** When re-pasting API keys from a vendor console: always verify the format before saving. Cloudinary API Key is exactly 15 digits (all numeric). API Secret is ~27 chars (mixed alphanumeric + `-_`). A length mismatch immediately flags a paste error.

### Lessons learned
- **Silent 401 is the worst error.** A handler that returns `[]` on any non-2xx response hides the most important debugging signal of all — that the API itself rejected the call. Future fetcher utilities in this project should log the status code and body before returning empty.
- **"It works locally" lies if local and Vercel env vars are both wrong the same way.** Always test against the live API endpoint directly with the actual env values, not just the framework's wrapped behavior.
- **Verify the shape of an API value before assuming it's the right one.** 15 digits vs 27 chars is a 5-second check that would have caught Session 28's swap at upload time.

### Open questions / blockers
- **None blocking.** Production is live and verified by Avshi.

### Next session
- **PRIORITY 1: Google Search Console submission** + verify domain + submit sitemap.
- **PRIORITY 2: Google Analytics 4 setup** with UTM tracking before any ad campaign.
- **Re-add inspiration file upload** (V2 feature deferred earlier, customer reference image uploads).
- **FTP architecture discussion** — folder convention, who has credentials, auto-tagger from FTP, review UI, Cloudinary upload step.
- **Quiz/wizard intake flow (Phase 24)** — 8-step conversion engine (4-6 hours, Session 29+).
- **Cleanup**: 29 stray test uploads in Cloudinary (64 total vs 35 expected). Decide which to delete vs keep.

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

(... older session entries preserved — see git history if file gets truncated ...)
