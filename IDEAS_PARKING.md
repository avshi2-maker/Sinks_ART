# Marble Art Sinks — Ideas Parking Lot

A living document. Add ideas as they come up — no filtering, no judgement, no prioritization needed at the time of capture. Triage and prioritize later.

**Last updated:** 07/05/2026

---

## How to use this file

- Add new ideas under the relevant `##` category. Create a new category if none fits.
- Each idea is one bullet. Keep the wording short — a sentence or two.
- Always add a date in parens at the start: `(30/04/2026)`.
- Mark status with a tag: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped · `[?]` needs more thought.
- If an idea has unanswered questions, add a `→` line under it with the question.
- When an idea graduates into active development, move it (or copy it) into `STATUS.md` under that day's session.

**Quick add zone** is at the bottom — dump raw thoughts there if you don't want to categorize on the spot. Sort them later.

---

## Catalog & Gallery

- `[ ]` (30/04/2026) Filter the gallery by stone type, shape, artist, source_type
- `[ ]` (30/04/2026) Sort by "newest first", "most popular", "most expensive"
- `[ ]` (30/04/2026) Compare-mode: select 2-3 sinks and view side by side
- `[ ]` (30/04/2026) Saved favorites for guest visitors (browser localStorage, no login needed)
- `[?]` (30/04/2026) "Sinks similar to this" recommendations using stone type + shape + price band

## Customer Interaction (RFQ, calls, voice)

- `[x]` (01/05/2026) SinC-ART: Auto-route any non-mp3/m4a/wav file through Cloudinary for automatic format conversion (Cloudinary handles 3GP, AMR, etc. natively). Removes the manual cloudconvert.com step. ← done Session 11
- `[x]` (01/05/2026) SinC-ART: Editable speaker bubbles in transcript — parse ElevenLabs diarized words array, group by speaker_id, render as colored bubbles, allow click-to-rename per speaker (rename applies globally to all turns of that speaker) ← done Session 13 (Phase 14)
- `[x]` (01/05/2026) SinC-ART: Action buttons on AI analysis output — Copy summary / Copy tasks / Copy web_changes / Send to WhatsApp via wa.me / Print ← done Session 12 — superseded Session 17 by generic ExportFooter (5-button bar: Print/Outlook/Gmail/WhatsApp/Project)
- `[ ]` (01/05/2026) SinC-ART: Test Cloudinary upload path with >100MB file (still pending; today's tests stayed under 25MB)
- `[x]` (01/05/2026) SinC-ART: Save transcripts + analyses to Supabase. ← done Session 13 as `customer_communications` table — extended Session 18 (Phase D) with parallel `media_analyses` row holding `ai_full_report` jsonb (transcript, bubbles, speaker_map, raw_transcript_text, duration_sec, audio_url, saved_phase, saved_at)
- `[ ]` (01/05/2026) SinC-ART future: Email/WhatsApp digest at end of week — "summary of all calls this week with the artists"

- `[x]` (30/04/2026) Call intake page: upload audio → ElevenLabs Scribe → speaker editing → Claude analysis → design brief → render handoff ← done Session 13 as single-file demo, then **migrated to React/Next.js Sessions 17-18** as `/sinc` route with `CallProcessingFlow.tsx` orchestrating the full pipeline. Live at `sinks-art.vercel.app/sinc`.
- `[x]` (30/04/2026) Save analyzed calls to Supabase ← done Session 13; canonical save flow extended Session 18 (Phase D) via `saveCallFull()` in `src/lib/sinc/supabaseSinc.ts`
- `[ ]` (30/04/2026) Auto-create an RFQ draft from a call analysis (one click: "convert this call into an RFQ")
- `[ ]` (30/04/2026) Automatic call → render → mockup pipeline: end-to-end so customer gets back a concept image within 24h
- `[ ]` (30/04/2026) Mobile-first form for capturing on-site visit notes (voice + photos + dimensions)
- `[ ]` (30/04/2026) WhatsApp inbound webhook: forwarded customer voice notes auto-transcribe and queue for review
- `[?]` (30/04/2026) Allow customer to record a 30-sec voice intro on the RFQ form ("tell us about your space")

- `[x]` (03/05/2026) 8-stage Hebrew payment-driven status pipeline on projects: ליד → שיחת בירור → הצעת מחיר נשלחה → אושר → שולמה מקדמה → תשלום מלא → הסתיים → אבוד ← done Session 13 (Phase 13d)
- `[x]` (03/05/2026) Project auto-create per customer on first call; subsequent calls attach to the most-recently-updated active project ← done Session 13 (Phase 13d, "Path B"); reaffirmed Session 18 (Phase D) — `saveCallFull` calls `createLeadProject` when no `project_id` provided
- `[x]` (03/05/2026) Project notes textarea on save modal — pre-filled from DB, edits write back to projects table ← done Session 13
- `[x]` (03/05/2026) WhatsApp send via inline modal (popup-blocker safe) — pre-fills last-used number from localStorage ← done Session 13
- `[x]` (03/05/2026) Customer dropdown shows live status badge per customer: `סיגל לוי · 050... · [שיחת בירור]` ← done Session 13
- `[x]` (03/05/2026) ElevenLabs hallucinated speaker prefix auto-strip on every transcribe + manual 🧹 button for re-runs ← done Session 13 (v9-v10)
- `[x]` (03/05/2026) Sharpened Claude analysis prompt to ignore `[bracket]:` labels when extracting names into "contacts" ← done Session 13 (v10)
- `[ ]` (03/05/2026) Backfill old Phase 13c row (id `6257b6aa...`) with a `project_id` — one-time SQL update for the orphan row saved before Phase 13d existed
- `[ ]` (03/05/2026) Status change history log — every status transition saved with timestamp + optional reason note (currently only the latest status is visible; transitions are lost)
- `[~]` (03/05/2026) Multi-project picker in save modal — partially done Session 18 (Phase D): `SaveCustomerModal` exists with picker UI, BUT search input does not filter the customer list (pre-existing bug; see Backend/Tech)
- `[?]` (03/05/2026) Auto-suggest a status change at save time based on AI analysis content (e.g., "this sounds like a payment confirmation — suggest שולמה מקדמה")
- `[?]` (03/05/2026) Fallback to OpenAI Whisper if ElevenLabs hallucination patterns get worse — current strip handles them, but parked as plan B

- `[x]` (07/05/2026) **Phase 16.5 — post-save customer page navigation.** After saving a call, indigo "👤 פתח עמוד לקוח" button + ExportFooter "🔗 פרויקט" button both navigate to `/customers/[customer_id]`. Verified live on production. Commit `f341fef`. Surfaced and fixed a latent Phase D defect: `saveCallFull` was using `payload.customer_id` for the insert but never returning it; now exposed in `SincCallSaveResult`.
- `[ ]` (07/05/2026) **Customer name whitespace normalization** — Phase D bug. Customer names like "Gal   גל" stored unnormalized. Fix: add `.trim().replace(/\s+/g, ' ')` in `createCustomer` inside `src/lib/sinc/supabaseSinc.ts` before the insert call.
- `[ ]` (07/05/2026) **Capture `duration_seconds` on call save** — Phase D bug. Column exists in `customer_communications`, ElevenLabs returns the value, but the Phase D save flow doesn't pipe it through. Affects: call duration totals, future per-call cost analytics, weekly digest accuracy.

## AI Image Generation

- `[ ]` (30/04/2026) Render session helper: paste design brief + attach marble sample → outputs Nano Banana prompt + ready record JSON
- `[ ]` (30/04/2026) Append marble texture reference image to every Nano Banana prompt for stone realism
- `[ ]` (30/04/2026) Library of "approved marble textures" the artists vouch for, organized by stone type
- `[ ]` (30/04/2026) Concept image variations: from one approved concept generate 3-4 variants (different lighting, angle, room context)
- `[ ]` (30/04/2026) "Customer-specific mockup" — generate concept image with the actual dimensions/room mentioned in their call
- `[?]` (30/04/2026) Multi-shot concept set: front 3/4, top-down, profile, detail crop — all matching the same sink
- `[ ]` (01/05/2026) The Sink Scanner feature: customer sends sink photos → AI extracts shape/dimensions/stone/color → generates Hebrew quote brief. Discussed in Session 7. Standalone HTML demo first, integrate into Next.js later.
  - **Update (07/05/2026):** photo and MP4 analyzers already migrated to React at `/intake` (Phase 15.5). The "Sink Scanner" outcome is largely realized; remaining work is naming/UX-level — possibly merging into a single "ניתוח מדיה" entry from the Phase 17 dashboard.

## Pricing & Quotes (future)

- `[ ]` (30/04/2026) Pricing calculator from dimensions + stone type + shape complexity + finish + mounting type
- `[ ]` (30/04/2026) Stored stone-cost table per artist (different artists buy at different rates)
- `[ ]` (30/04/2026) Auto-quote PDF generated and attached to WhatsApp handoff
- `[ ]` (30/04/2026) Deposit-collection link via Israeli payment provider (Tranzila, Cardcom, Payplus)
- `[?]` (30/04/2026) Customer-facing "build your own" quote estimator on the site (input dimensions → ballpark price)
- `[x]` (03/05/2026) Wire `api_cost_usd` from MARBLE_METER into the call save payload — column exists in `customer_communications`. ← done Session 18 (Phase D): `saveCallFull` payload includes `api_cost_usd` and persists it; verified ~$0.27 per pipeline run shows up correctly in the saved row.

## API inventory (which API does what)

- Anthropic Claude: text reasoning, AI analysis, prompt generation. **Server-side via Next.js API routes** as of Session 17 (`/api/sinc-analyze`, `/api/sinc-transcribe`).
- ElevenLabs: speech-to-text (Hebrew + others). Server-side as of Session 17.
- Cloudinary: media storage + transformations + format conversion. Browser-direct upload via signed-URL pattern.
- Supabase: database + auth + file storage. Anon-key reads; project ID `pslwvkymccbngtyvgagj`.
- Nano Banana / Gemini: AI image generation (Session 16+, requires Google API key)
- yt-dlp: YouTube clip download (local CLI tool, no API needed)
- Google APIs: NOT used in marble sinks workflow (except potentially Translate later)

## Mobile / Field Operations

- `[ ]` (30/04/2026) Mini CRM mobile sync: visit photos + voice + GPS uploaded from phone, queued for review
- `[ ]` (30/04/2026) On-site measurement form (length / width / depth / drain location / mounting type)
- `[ ]` (30/04/2026) Offline-first capture (works without signal, syncs when online)
- `[ ]` (30/04/2026) Customer signature capture for site visit confirmations

## Artist Workflow

- `[ ]` (30/04/2026) Approval queue admin page: artist sees pending concepts and ticks `approved_by_artist`
- `[ ]` (30/04/2026) Artist receives WhatsApp ping when there's a concept waiting for approval
- `[ ]` (30/04/2026) "In-progress" sink page: artist uploads work-in-progress photos, customer can follow along
- `[ ]` (30/04/2026) Artist's own portfolio uploader (no Avshi-in-the-loop) for adding `real_photo` items
- `[?]` (30/04/2026) Artist availability calendar — show "next slot available" on each artist's profile

## Backend / Tech

- `[x]` (30/04/2026) Migrate the call intake demo from single-file HTML to a proper React/Next.js component in the marble-sinks app ← done Sessions 17-18 (Phases B/C/D). Lives at `src/components/sinc/CallProcessingFlow.tsx`.
- `[x]` (30/04/2026) Move Anthropic API calls server-side (currently browser-direct with `dangerous-direct-browser-access`) ← done Session 17 (Phase B/C). Routes: `/api/sinc-analyze`, `/api/sinc-transcribe`. Server reads `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` from Vercel project env.
- `[ ]` (30/04/2026) Set up Supabase types codegen (`supabase gen types typescript`)
- `[x]` (30/04/2026) Add a `customer_calls` table linked to `rfq_requests` to store transcripts + analysis ← done Session 13 as `customer_communications` (broader scope: holds calls + emails + WhatsApp + future channels); Phase D (Session 18) added parallel `media_analyses` row.
- `[ ]` (30/04/2026) Daily backup of Supabase to a local dump file
- `[?]` (30/04/2026) Use Supabase Storage instead of Cloudinary for some media types (cost comparison needed)
- `[ ]` (02/05/2026) Cost monitoring: api_meter.js could later persist totals to Supabase per-user/per-day/per-project for billing analysis. Currently localStorage only.
- `[ ]` (02/05/2026) Cost monitoring: extend api_meter.js to track Cloudinary in actual dollars when paid plan starts (currently free tier = $0)
- `[x]` (02/05/2026) Cost monitoring: when we move Anthropic API call server-side, the meter needs an API endpoint hook instead of direct response parsing ← done Session 17 (Phase B/C). `apiMeter.ts` reads `data.apiCostUsd` from API route response; `ApiCostMeter` component renders the live readings.
- `[ ]` (02/05/2026) ElevenLabs paid plan decision: Starter $5/month gives 30K credits (~30 min/day = ~1 call), Creator $22/month gives 100K (~100 min/day). Decide based on call volume in the coming week.
- `[ ]` (02/05/2026) Test 3GP→Cloudinary→ElevenLabs end-to-end the next time a Samsung call recording arrives. Should "just work" with v3 routing.
- `[ ]` (02/05/2026) Consider: should v3 cache the format detection per-file in case user changes mind and switches force-cloud after upload? (Currently rechecks on transcribe click — fine.)

- `[x]` (03/05/2026) `window.MARBLE_DEBUG` console handle — exposes supabaseClient, transcript, turns, speakers, loaded project, plus `stripLeadingLabels()`, `loadCustomers()`, `recomputeTranscript()` helpers ← done Session 13
- `[x]` (03/05/2026) Settings modal warns inline when an API key looks suspiciously short (catches PowerShell-clipboard truncation issues like the morning's debugging hell) ← done Session 13
- `[x]` (03/05/2026) GoTrueClient duplicate-instances warning silenced — skip reinit when URL unchanged + disable unused auth subsystem (`persistSession: false`) ← done Session 13
- `[x]` (03/05/2026) Customer detail page — view all calls + projects + status timeline for one customer (currently calls are saved but only browsable via raw SQL) ← done Session 18 cont. (Phase 16). Lives at `/customers/[id]`. Server component, Hebrew RTL, renders customer card + projects list + תקשורת timeline.
- `[ ]` (03/05/2026) Project detail page — full timeline view: call history + status changes + notes evolution + linked artist
- `[?]` (03/05/2026) Move from anon-key reads to proper Supabase Auth (currently public-readable; planned for Session 16+)

### Phase B/C/D/E/16/16.5 milestones (Sessions 17–19, 06–07/05/2026)

- `[x]` (06/05/2026) **Phase B/C — Audio pipeline migrated to React/Next.js.** Replaced single-file HTML demo with `CallProcessingFlow.tsx` orchestrating: audio file pick → Cloudinary upload (with progress) → `/api/sinc-transcribe` (ElevenLabs) → `/api/sinc-analyze` (Claude) → review screen with editable speaker bubbles + Hebrew analysis sections + ApiCostMeter sidebar.
- `[x]` (06/05/2026) **Phase D — Full save flow.** `saveCallFull()` writes both `customer_communications` (the call record) and `media_analyses` (parallel media row holding the full AI report jsonb: transcript bubbles, speaker_map, raw transcript text, duration_sec, audio URL). Modal for picking customer + project, with auto-create-project fallback (status `ליד`, title `שיחה - DD/MM/YYYY`).
- `[x]` (06/05/2026) **Phase D fix 1 — schema reality.** `projects` table has `description_he` + `notes` (text), NOT `notes_jsonb`. Code corrected.
- `[x]` (07/05/2026) **Phase D fix 2 — `customers.source` whitelist.** Allowed values: `pinterest`, `whatsapp`, `instagram`, `website`, `referral`, `walk-in`, `phone`, `other`. SinC-created customers now use `'phone'` (literal semantic match — it IS a phone call).
- `[x]` (07/05/2026) **Production env vars fix.** Commit `d33587d`. ELEVENLABS_API_KEY + ELEVENLABS_MODEL_ID set at Vercel project level, redeployed without cache. Full pipeline verified end-to-end on production at $0.2786 per call.
- `[x]` (07/05/2026) **Phase E — Legacy demos archived.** Commit `5d08b9f`. Ten SinC-ART legacy single-file demos moved from `demos/` to `demos/legacy/` with explanatory README. Keeps the demo path uncluttered for future single-file experiments.
- `[x]` (07/05/2026) **Phase 16 — Customer detail page** at `/customers/[id]`. 6 files, ~498 lines, server component, Hebrew RTL. Verified live: `https://sinks-art.vercel.app/customers/626efdd8-bacc-44fd-974d-7cfe5574736d` renders Gal's record (customer card, projects list, communications timeline).
- `[x]` (07/05/2026) **Phase 16.5 — Post-save customer page navigation.** Commit `f341fef`. Indigo "👤 פתח עמוד לקוח" button in saved-state block + ExportFooter `onProjectClick` wired to open `/customers/[customer_id]` in a new tab. Verified live end-to-end on production.
- `[x]` (07/05/2026) **Phase 16.5 latent fix — `SincCallSaveResult.customer_id` exposed.** Phase D defect: `saveCallFull` consumed `payload.customer_id` for the insert but never returned it. No caller had needed the value until Phase 16.5 tried to navigate post-save. Fixed at source (types.ts + supabaseSinc.ts) instead of band-aiding the consumer.

### Generic export bar (Session 17)

- `[x]` (06/05/2026) **`ExportFooter` generic 5-button action bar** (`src/components/shared/ExportFooter.tsx`). Buttons: 🖨️ הדפס · 📋 לאאוטלוק · 📧 Gmail · 💬 וואטסאפ · 🔗 פרויקט. Driven by a generic `ReportSnapshot` interface (`src/lib/shared/exportFormats.ts`). Used by SinC-ART, photo analyzer, MP4 analyzer — and any future analyzer/report page.
- `[x]` (06/05/2026) **WhatsApp emoji bug fix.** `buildWhatsAppUrl` uses `https://api.whatsapp.com/send` instead of `https://wa.me/`. The wa.me redirect mishandles 4-byte UTF-8 percent-escapes (all emoji), turning them into U+FFFD ("�") on the receiving side. api.whatsapp.com preserves the bytes correctly on web AND mobile. Hebrew (2-byte UTF-8) was unaffected; the bug only showed up because every export body opens with 📋 and ends with 🖼️.

### Open bugs (queued for next bug-cleanup session)

- `[ ]` (07/05/2026) **SaveCustomerModal search input doesn't filter.** Pre-existing Phase D bug. The "חיפוש לפי שם / טלפון / מייל..." input accepts text but does not filter the customer list below. File: `src/components/sinc/SaveCustomerModal.tsx`. Forces user to scroll to find a customer in a long list. Estimated fix: ~30 min.
- `[ ]` (07/05/2026) **Working tree cleanup.** Untracked junk in project root: `callflow_dump.txt` (debug output from earlier diagnosis), `files.zip`, `files/` directory. Probably trash. Also `HANDOVER_session19_07052026.md` to be reviewed (keep if it's the original handover doc, otherwise delete). Estimated fix: ~5 min once each is reviewed.

## Multi-module unification & navigation (roadmap from Session 19)

**Background:** Two main modules now exist on production:
- `/sinc` — phone call audio analysis (Phase B/C/D, Sessions 17–18)
- `/intake` — photo + MP4 analyzers (Phase 15.5, earlier sessions)

Both already share infrastructure: same Vercel deploy, same Supabase database, same `customer_communications` + `media_analyses` tables, same ExportFooter component, same ApiCostMeter, same `ReportSnapshot` type, same Cloudinary uploads, same Anthropic API key. The plumbing is unified.

What's NOT unified yet is the **user experience layer** — there's no single internal home that surfaces both modules together, no top navigation bar, no "today's work" view. Avshi has to type each URL by hand to switch modules.

The `/` root remains the public marketing landing (`שיש אמנותי`) — different audience, different purpose, NOT to be merged with the work app.

- `[ ]` (07/05/2026) **Phase 17 — Internal home / dashboard at `/work`.** Avshi's "open this first thing in the morning" page. Components:
  - Today's activity strip (calls saved today, photos analyzed today, videos analyzed today, with cost subtotal)
  - Active projects list (statuses ליד / שיחת בירור / הצעת מחיר נשלחה / אושר / שולמה מקדמה / תשלום מלא), each linking to `/customers/[id]`
  - Quick action buttons: 🎙️ שיחה חדשה → `/sinc`, 📸 ניתוח תמונה → `/intake?mode=photo`, 🎥 ניתוח וידאו → `/intake?mode=video`
  - Recent communications feed (last 10 entries from `customer_communications`, regardless of `comm_type`)
  - Estimated effort: ~1 session.

- `[ ]` (07/05/2026) **Phase 18 — Top navigation bar across all internal pages.** Consistent bar shown on `/sinc`, `/intake`, `/customers/*`, `/work`. Hebrew RTL. Logo + 4 links + cost-this-month meter on the right. This is the change that makes the app FEEL like one product instead of two. Estimated effort: half a session.

- `[ ]` (07/05/2026) **Phase 19 — Customer page enhancements** at `/customers/[id]`. Build on the page that just shipped in Phase 16. Adds:
  - Filter tabs on the תקשורת timeline (All / Calls / Photos / Videos / Quotes)
  - "📞 חזור ללקוח" quick-action button that opens WhatsApp / Phone with the customer's number prefilled
  - Inline status change for projects (currently requires going to Supabase to change status — bad UX)
  - "Add note" inline form
  - Estimated effort: ~1 session.

- `[?]` (07/05/2026) **Phase 20+ — Authentication.** When the work app gains a real home (Phases 17–19), public access becomes an issue. Currently `/work`, `/customers/[id]`, `/sinc`, `/intake` are all open to anyone who knows the URL. Move to Supabase Auth (email magic-link or password). Tied to the existing "[?] Move from anon-key reads to proper Supabase Auth" item.

## Marketing / SEO / Launch

- `[ ]` (30/04/2026) Hebrew SEO: meta descriptions, schema.org `Product` markup per sink, sitemap
- `[ ]` (30/04/2026) Instagram auto-post: when an artist's `real_photo` goes live, draft an IG post
- `[ ]` (30/04/2026) Newsletter sign-up — once a month, "new sinks this month"
- `[ ]` (30/04/2026) Soft launch list — 20 friends/architects/designers to send the early-access link
- `[?]` (30/04/2026) "Press kit" page for design magazines (downloadable hi-res, artist bios, story)

## Legal / Trust / Policy

- `[ ]` (30/04/2026) Terms & Conditions page in Hebrew
- `[ ]` (30/04/2026) Privacy policy in Hebrew (covers RFQ data, call recordings, GDPR-style basics)
- `[ ]` (30/04/2026) Customer consent flow before recording any call
- `[ ]` (30/04/2026) Clear "concept image vs real product" disclaimer near every `סקיצה` badge

---

## Quick add zone

*(Paste raw thoughts here. Categorize and tag later.)*

-

---
