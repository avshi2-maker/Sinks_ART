# Marble Art Sinks — Ideas Parking Lot

A living document. Add ideas as they come up — no filtering, no judgement, no prioritization needed at the time of capture. Triage and prioritize later.

**Last updated:** 03/05/2026

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
- `[x]` (01/05/2026) SinC-ART: Action buttons on AI analysis output — Copy summary / Copy tasks / Copy web_changes / Send to WhatsApp via wa.me / Print ← done Session 12
- `[ ]` (01/05/2026) SinC-ART: Test Cloudinary upload path with >100MB file (still pending; today's tests stayed under 25MB)
- `[x]` (01/05/2026) SinC-ART: Save transcripts + analyses to Supabase. ← done Session 13. Implemented as `customer_communications` table (NOT `customer_calls` as originally planned) — broader scope so the same table holds emails/WhatsApp/etc later. Schema: id, customer_id, project_id, comm_type, audio_url, transcript, duration_seconds, ai_analysis (jsonb), subject, body, api_cost_usd, occurred_at, created_at.
- `[ ]` (01/05/2026) SinC-ART future: Email/WhatsApp digest at end of week — "summary of all calls this week with the artists"

- `[x]` (30/04/2026) Call intake page: upload audio → ElevenLabs Scribe → speaker editing → Claude analysis → design brief → render handoff ← done Session 13 (full pipeline live as `sinc_art_call_intake_03052026-v11.html`)
- `[x]` (30/04/2026) Save analyzed calls to Supabase ← done Session 13 (see customer_communications above)
- `[ ]` (30/04/2026) Auto-create an RFQ draft from a call analysis (one click: "convert this call into an RFQ")
- `[ ]` (30/04/2026) Automatic call → render → mockup pipeline: end-to-end so customer gets back a concept image within 24h
- `[ ]` (30/04/2026) Mobile-first form for capturing on-site visit notes (voice + photos + dimensions)
- `[ ]` (30/04/2026) WhatsApp inbound webhook: forwarded customer voice notes auto-transcribe and queue for review
- `[?]` (30/04/2026) Allow customer to record a 30-sec voice intro on the RFQ form ("tell us about your space")

- `[x]` (03/05/2026) 8-stage Hebrew payment-driven status pipeline on projects: ליד → שיחת בירור → הצעת מחיר נשלחה → אושר → שולמה מקדמה → תשלום מלא → הסתיים → אבוד ← done Session 13 (Phase 13d)
- `[x]` (03/05/2026) Project auto-create per customer on first call; subsequent calls attach to the most-recently-updated active project ← done Session 13 (Phase 13d, "Path B")
- `[x]` (03/05/2026) Project notes textarea on save modal — pre-filled from DB, edits write back to projects table ← done Session 13
- `[x]` (03/05/2026) WhatsApp send via inline modal (popup-blocker safe) — pre-fills last-used number from localStorage ← done Session 13
- `[x]` (03/05/2026) Customer dropdown shows live status badge per customer: `סיגל לוי · 050... · [שיחת בירור]` ← done Session 13
- `[x]` (03/05/2026) ElevenLabs hallucinated speaker prefix auto-strip on every transcribe + manual 🧹 button for re-runs ← done Session 13 (v9-v10)
- `[x]` (03/05/2026) Sharpened Claude analysis prompt to ignore `[bracket]:` labels when extracting names into "contacts" ← done Session 13 (v10)
- `[ ]` (03/05/2026) Backfill old Phase 13c row (id `6257b6aa...`) with a `project_id` — one-time SQL update for the orphan row saved before Phase 13d existed
- `[ ]` (03/05/2026) Status change history log — every status transition saved with timestamp + optional reason note (currently only the latest status is visible; transitions are lost)
- `[ ]` (03/05/2026) Multi-project picker in save modal — when a customer has 2+ active projects, let user pick which project this call belongs to (currently uses most-recently-updated)
- `[?]` (03/05/2026) Auto-suggest a status change at save time based on AI analysis content (e.g., "this sounds like a payment confirmation — suggest שולמה מקדמה")
- `[?]` (03/05/2026) Fallback to OpenAI Whisper if ElevenLabs hallucination patterns get worse — current strip handles them, but parked as plan B

## AI Image Generation

- `[ ]` (30/04/2026) Render session helper: paste design brief + attach marble sample → outputs Nano Banana prompt + ready record JSON
- `[ ]` (30/04/2026) Append marble texture reference image to every Nano Banana prompt for stone realism
- `[ ]` (30/04/2026) Library of "approved marble textures" the artists vouch for, organized by stone type
- `[ ]` (30/04/2026) Concept image variations: from one approved concept generate 3-4 variants (different lighting, angle, room context)
- `[ ]` (30/04/2026) "Customer-specific mockup" — generate concept image with the actual dimensions/room mentioned in their call
- `[?]` (30/04/2026) Multi-shot concept set: front 3/4, top-down, profile, detail crop — all matching the same sink
- `[ ]` (01/05/2026) The Sink Scanner feature: customer sends sink photos → AI extracts shape/dimensions/stone/color → generates Hebrew quote brief. Discussed in Session 7. Standalone HTML demo first, integrate into Next.js later.

## Pricing & Quotes (future)

- `[ ]` (30/04/2026) Pricing calculator from dimensions + stone type + shape complexity + finish + mounting type
- `[ ]` (30/04/2026) Stored stone-cost table per artist (different artists buy at different rates)
- `[ ]` (30/04/2026) Auto-quote PDF generated and attached to WhatsApp handoff
- `[ ]` (30/04/2026) Deposit-collection link via Israeli payment provider (Tranzila, Cardcom, Payplus)
- `[?]` (30/04/2026) Customer-facing "build your own" quote estimator on the site (input dimensions → ballpark price)
- `[ ]` (03/05/2026) Wire `api_cost_usd` from MARBLE_METER into the call save payload — column already exists in `customer_communications` but currently always saves as null. Would let us see per-call costs in DB queries.

## API inventory (which API does what)

- Anthropic Claude: text reasoning, AI analysis, prompt generation
- ElevenLabs: speech-to-text (Hebrew + others)
- Cloudinary: media storage + transformations + format conversion
- Supabase: database + auth + file storage
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

- `[ ]` (30/04/2026) Migrate the call intake demo from single-file HTML to a proper React/Next.js component in the marble-sinks app
- `[ ]` (30/04/2026) Move Anthropic API calls server-side (currently browser-direct with `dangerous-direct-browser-access`)
- `[ ]` (30/04/2026) Set up Supabase types codegen (`supabase gen types typescript`)
- `[x]` (30/04/2026) Add a `customer_calls` table linked to `rfq_requests` to store transcripts + analysis ← done Session 13 as `customer_communications` (broader scope: holds calls + emails + WhatsApp + future channels)
- `[ ]` (30/04/2026) Daily backup of Supabase to a local dump file
- `[?]` (30/04/2026) Use Supabase Storage instead of Cloudinary for some media types (cost comparison needed)
- `[ ]` (02/05/2026) Cost monitoring: api_meter.js could later persist totals to Supabase per-user/per-day/per-project for billing analysis. Currently localStorage only.
- `[ ]` (02/05/2026) Cost monitoring: extend api_meter.js to track Cloudinary in actual dollars when paid plan starts (currently free tier = $0)
- `[ ]` (02/05/2026) Cost monitoring: when we move Anthropic API call server-side, the meter needs an API endpoint hook instead of direct response parsing
- `[ ]` (02/05/2026) ElevenLabs paid plan decision: Starter $5/month gives 30K credits (~30 min/day = ~1 call), Creator $22/month gives 100K (~100 min/day). Decide based on call volume in the coming week.
- `[ ]` (02/05/2026) Test 3GP→Cloudinary→ElevenLabs end-to-end the next time a Samsung call recording arrives. Should "just work" with v3 routing.
- `[ ]` (02/05/2026) Consider: should v3 cache the format detection per-file in case user changes mind and switches force-cloud after upload? (Currently rechecks on transcribe click — fine.)

- `[x]` (03/05/2026) `window.MARBLE_DEBUG` console handle — exposes supabaseClient, transcript, turns, speakers, loaded project, plus `stripLeadingLabels()`, `loadCustomers()`, `recomputeTranscript()` helpers ← done Session 13
- `[x]` (03/05/2026) Settings modal warns inline when an API key looks suspiciously short (catches PowerShell-clipboard truncation issues like the morning's debugging hell) ← done Session 13
- `[x]` (03/05/2026) GoTrueClient duplicate-instances warning silenced — skip reinit when URL unchanged + disable unused auth subsystem (`persistSession: false`) ← done Session 13
- `[ ]` (03/05/2026) Customer detail page — view all calls + projects + status timeline for one customer (currently calls are saved but only browsable via raw SQL)
- `[ ]` (03/05/2026) Project detail page — full timeline view: call history + status changes + notes evolution + linked artist
- `[?]` (03/05/2026) Move from anon-key reads to proper Supabase Auth (currently public-readable; planned for Session 16+)

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
