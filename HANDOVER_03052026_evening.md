# Marble Sinks — Evening Handover (Session 13 complete)

**Date:** 03 May 2026
**Status:** All planned work shipped. Architecture rule locked. Ready for Phase 15 next session.
**Time spent:** ~6 productive hours (morning + afternoon)

---

## What shipped today (in order)

### Phase 13a — RLS fix
- Anon read policies added to `customers`, `projects`, `customer_communications`
- Anon insert policy added to `customer_communications`
- Unblocked the morning's 4-hour debugging session

### Phase 13c — Real call save (v6)
- Replaced placeholder Phase 13b save with real INSERT to `customer_communications`
- Maps: customer_id, comm_type='call', audio_url, transcript, duration_seconds, ai_analysis (jsonb), subject, body
- Added `window.MARBLE_DEBUG` console handle (Bug 4 fix)

### Phase 13d — Project pipeline (v7)
- New columns/migrations: `customer_communications.project_id`, `projects.status` migrated to Hebrew, CHECK constraint whitelist of 8 Hebrew values
- Auto-create project on first call when no active project exists
- Customer dropdown shows live status badge `[שיחת בירור]`, `[ליד]`, etc.
- Status change dropdown + project notes textarea in save modal
- 8-stage payment-driven pipeline: ליד → שיחת בירור → הצעת מחיר נשלחה → אושר → שולמה מקדמה → תשלום מלא → הסתיים → אבוד

### Phase 14 — Editable speaker bubbles (v8)
- ElevenLabs word-level diarization parsed into editable turns
- Speaker labels: preset dropdown (אמן יוסי / אמן דני / לקוח / מנהל / אחר) + free-text custom override
- contenteditable bubbles, color-coded per speaker
- Settings modal Bug 3 fix (1.8s confirmation + key-length warnings)

### Hallucination strip (v9 + v10)
- Manual 🧹 button in v9 (regex strips Hebrew name+colon prefixes)
- Auto-strip on every transcribe in v10 (no clicks needed)
- Sharpened Claude analysis prompt to ignore [bracket] labels when extracting names
- GoTrueClient duplicate-instances warning silenced

### WhatsApp popup-blocker fix (v11)
- Replaced `prompt()` with inline modal — `window.open()` now runs inside user-gesture click context
- Pre-fills last-used number from localStorage

---

## State of the systems

### Files
- **Public website:** `C:\sinks\sinks_art\src\` (Next.js, deployed at https://sinks-art.vercel.app)
  - 5 hand-written files in `src/`: layout.tsx, page.tsx, gallery/page.tsx, lib/supabase.ts, globals.css
  - Total ~10KB hand-written code; rest is node_modules + .next build cache
- **Internal tool:** `C:\SinkS\demos\sinc_art_call_intake_03052026-v11.html` (~2,329 lines, single-file, runs from local disk only)
- **Repo:** All synced to `avshi2-maker/Sinks_ART` on GitHub. `demos/` subfolder has v5/v7/v8/v9/v10/v11 + api_meter.js + previous versions
- **Last commit:** "Session 13: SinC-ART v5-v11 + Phases 13a-13d + Phase 14 + bug fixes"

### Database (Supabase `givcxgzhfoetujhrjgvc`)
- 7 tables total
- New since this morning: `customers`, `projects`, `customer_communications` populated with real call data
- RLS allows anon read/write (public-tier security; auth migration parked for Session 16+)
- Hebrew status values stored directly; CHECK constraint enforces whitelist

### Test data in DB
- Customer דוד כהן has 2 calls + 1 auto-created project at status `שיחת בירור` with notes
- Customer יעל מזרחי has 1 call + 1 auto-created project at status `ליד`
- Customer סיגל לוי has 1 orphan call from before Phase 13d (project_id = null) — leave as-is for now

### Versions confirmed working
- v11 = the canonical SinC-ART. All previous versions (v5-v10) kept in repo for reference.
- Console: `MARBLE_DEBUG.version` returns `'03052026-v11'`

---

## Architecture rule LOCKED (3 places)

After 7 prior frustrations of bots defaulting to single-file HTML, the rule is now in:

1. **Memory #11** — console commands during debugging are useful, send one at a time
2. **Memory #12** — multi-file projects only; single-file HTML allowed only for tiny prototypes or continuing existing demos like SinC-ART; STOP at ~1,500 lines
3. **SKILL.md #7** — explicit no-single-file rule with line threshold
4. **SKILL.md #8** — console commands rule
5. **SKILL.md description** — already had "modern TypeScript and proper folder structure" language

**Future bots cannot miss this.** It loads automatically with the marble-art-sinks skill.

---

## What's next — Phase 15: Multi-Format Media Intake

### What it is
Renamed from yesterday's "YouTube permissions architecture" (which was a misnomer). The real feature is a **multi-format inbound media analyzer** that handles 7 input types from WhatsApp/calls:

1. Picture (photo of existing sink/sample/sketch)
2. YouTube link (Ales's Ukrainian artist friends)
3. MP4 short clip (sent via WhatsApp)
4. URL link (any reference website)
5. Instagram link
6. PDF drawing (architect's plans)
7. Handwritten sketch with measurements

### Volume mix
- 50% direct customer inbound
- 40% routed through Ales (the artist)
- 10% from Ales's Ukraine network (YouTube discoveries)

### Architecture decisions made today
- **Build location:** inside `src/` of the Next.js app — multi-file React components, NOT a new SinC-ART HTML demo
- **Save model = both:** new row in `customer_communications` (with new comm_types: `youtube`, `instagram`, `photo`, `mp4`, `pdf`, `sketch`, `url`) AND a new dedicated table for structured AI output
- **New table proposed:** `media_analyses` — one-to-one with the `customer_communications` row, holds extracted dimensions/stone/shape/design intent/etc.
- **Eventual goal:** all outputs stored in gallery/HUB for building price offers, presenting offers, logging jobs, sharing with Ales's Ukraine network

### Blockers to clear before building
- Confirm `media_analyses` is the right name and shape for the new table
- Confirm `npm --version` works (Avshi confirmed: yes)
- Confirm Cursor + dev server flow (Avshi confirmed: yes)

---

## Working style reminders for the next bot

- English chat, Hebrew app UI
- Plan first, build second, test before next phase
- Send DevTools console commands ONE at a time during debugging
- NEVER default to single-file HTML — Phase 15 builds in `src/` as multi-file React/TypeScript
- Avshi works copy-paste — give him whole files, not snippets
- Filenames include `DDMMYYYY-vN`
- Never delete without approval

---

## Lessons learned today

- Schema introspection before INSERT code prevents debugging cycles (one `information_schema.columns` query saves an iteration)
- Postgres CHECK constraints are separate from column defaults — both must be migrated when changing allowed values
- `prompt()` before `window.open()` = popup blocker. Use inline modals
- ElevenLabs Scribe v1 hallucinates Hebrew speaker name prefixes when `diarize=true`. Auto-strip with regex handles it
- Per-feature version bumps + tested checkpoints beat bundled changes (v6→v11, all green)
- `claude.ai/customize/skills` has a **Replace** option in the `...` menu — overwrites a skill in place. No delete-then-upload needed.

---

— End of handover —