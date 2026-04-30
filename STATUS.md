# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.
- When an idea from `IDEAS_PARKING.md` becomes active, copy it into "Goals" and update its tag in the parking lot.

---

## 2026-04-30 — Session 3 — Call intake feature

### Goals

- Adapt the Gadi voice demo for the marble sinks sales context
- Add speaker turn detection + editing (rename speakers, fix transcription mistakes inline)
- Tune the שלב ב' analysis JSON to extract design parameters (dimensions, room, shape, stone preference, style) for downstream render sessions
- Set up working docs: `IDEAS_PARKING.md` and `STATUS.md`

### Done

- Built `marble_call_intake_30042026-v1.html` — single-file demo (1,446 lines)
- Replaced the legal-assistant prompt with a sink-artist sales-call prompt
- Implemented speaker turns: ElevenLabs `words` array is now grouped by `speaker_id`, rendered as colored bubbles
- Speaker pills are click-to-rename — global rename across all turns of that speaker
- Each turn's text is `contenteditable` for fixing transcription errors inline
- Added "שמור עריכות" button to lock in edits before שלב ב'
- Added third panel: **Design Brief** — extracts dimensions, room type, shape, stone, color, style keywords, mounting, drain, free notes, timeline
- Added **"Copy brief for render session"** button — copies a clean English handoff text to clipboard, ready to paste into a fresh Claude session for Nano Banana prompt building
- Created `IDEAS_PARKING.md` with seeded categories (Catalog, Customer Interaction, AI Image Generation, Pricing, Mobile, Artist Workflow, Backend, Marketing, Legal)
- Created this `STATUS.md`

### Decisions

- Call intake stays in single-file HTML for now (matching Gadi-style codebase) for quick iteration
- When the marble-sinks Next.js app is built, this becomes a proper `CallIntake.tsx` component — added to ideas parking under "Backend / Tech"
- Anthropic API call still uses `anthropic-dangerous-direct-browser-access: true` — fine for demo, server-side migration tagged for later
- Lead temperature taxonomy: `cold` (just curious) / `warm` (asking detailed questions) / `hot` (ready to order)
- Design brief schema mirrors the fields used by the Nano Banana prompt template — call → analysis → render handoff is now a clean pipeline

### Open questions / blockers

- ElevenLabs Scribe diarization quality on Hebrew is unknown — needs real testing on a sample call
- Need a sample customer call (with consent) to validate the prompt + design brief extraction
- Decide where transcripts + analysis are stored long-term (new Supabase table `customer_calls`?)

### Next session

- Test the demo with a real or scripted Hebrew customer call
- If diarization quality is good → design the `customer_calls` Supabase table
- If diarization is poor → consider switching to OpenAI Whisper or Deepgram for Hebrew

---

## 2026-04-29 — Session 2 — Skill creation + AI image policy

### Goals

- Capture all the project context into a reusable skill so future sessions don't start from scratch
- Decide how to handle AI-generated concept images legally and ethically

### Done

- Built `marble-art-sinks` skill (packaged as `.skill` file, ~18KB)
- Skill includes: SKILL.md, schema.sql, coding_conventions.md, ai_image_pipeline.md, architecture.md, ARTIST_PHOTO_BRIEF.md, ai_record_template.json
- Defined AI image policy: every concept image gets a `סקיצה` badge automatically
- Added `source_type`, `ai_prompt`, `ai_model`, `source_reference`, `approved_by_artist` columns to the `sinks` schema
- Defined the 4-step AI image pipeline: reference → JSON+prompt → Nano Banana → Cloudinary → Supabase

### Decisions

- AI concept images are **always** labeled `סקיצה` — no opt-out, no hiding
- Every concept stays hidden (`approved_by_artist = false`) until the artist who would build it confirms they can produce something in that spirit
- Pinterest images are **never** displayed on the production site — only allowed as `source_reference` metadata
- Hebrew photo brief delivered to the two artists for them to start producing real phone-photo content in parallel
- Working style locked: plan first, implement second; complete files only (no snippets); never delete without approval

### Next session

- (Originally: build call intake — became Session 3)

---

## 2026-04-29 — Session 1 — Project kickoff

### Goals

- Define what this project is and isn't
- Lock the tech stack
- Produce a first homepage mockup

### Done

- Identified that the bank-transfer screenshot was uploaded by mistake — set aside
- Locked tech stack: **Next.js 15 + Supabase + Cloudinary + Vercel + wa.me handoff**
- Decided on a multi-file Git/Vercel build, NOT a single-file HTML build like other projects
- Produced first homepage mockup (hero, artist strip, gallery cards, RFQ teaser)
- Drafted Supabase schema (artists, sinks, sink_images, rfq_requests)
- Defined the 4-step RFQ wizard: model → location/dimensions → media → contact
- Confirmed Pinterest reference board is for **style direction only**, not for production images

### Decisions

- New GitHub account dedicated to this client (not Avshi's existing `avshi2-maker`)
- Vercel free subdomain to start, custom domain later
- Hebrew RTL throughout, no multi-language in v1
- v1 explicitly excludes: payments, customer accounts, order tracking, blog, newsletter

### Next session

- Build a reusable skill so we don't re-explain the project every time → became Session 2

---
