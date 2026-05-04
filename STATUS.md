# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.
- When an idea from `IDEAS_PARKING.md` becomes active, copy it into "Goals" and update its tag in the parking lot.

## 2026-05-04 — Session 14 — Phase 15 backend (multi-format media intake) — committed 955691c

### Goals
- Lock the architecture rule (no more single-file HTML for new features) into both SKILL.md and Claude memory
- Build Phase 15 backend as multi-file React/TypeScript inside `src/`
- Activate Cloudinary + create SQL schema + wire model selection
- Establish the Cursor + npm + tsx + tsc workflow Avshi will use going forward

### Done
- **Architecture rule locked in 3 places:** SKILL.md item #7 (no single-file HTML, 1500-line ceiling), SKILL.md item #8 (one console command at a time during debugging), plus 2 persistent Claude memory entries. Future bots cannot exploit Avshi's non-coder status by defaulting to single-file builds.
- **Cloudinary activated:** cloud `dqdku88vv` (free tier, 25 credits/month). Two unsigned presets — `marble_calls` (folder `marble-sinks/calls`, used by SinC-ART for audio) and `marble_intake` (folder `marble-sinks/intake`, Phase 15 multi-format).
- **SQL migration applied** (`phase15_schema_03052026-v2.sql`):
  - New `media_analyses` table — 21 columns, FK to `customer_communications`, 3 RLS policies (anon select/insert/update), updated_at trigger
  - `customer_communications.comm_type` whitelist extended from 8 to 14 values (preserved `call/whatsapp/email/meeting/photo/note/document/other` + added `sketch/mp4/pdf/youtube/instagram/url`)
  - Path B confirmed: every inbound media saves a `customer_communications` row AND a `media_analyses` row
- **5 backend files shipped** in `src/lib/intake/` and `src/app/api/analyze-photo/` (~600 lines total, 54 tests passing):
  - `detectMediaType.ts` (108 lines) — pure logic, 24/24 tests
  - `cloudinary.ts` (140 lines) — upload + URL transform helpers, 12/12 tests
  - `claudeVision.ts` (140 lines) — server-side Anthropic API wrapper, 18/18 tests
  - `prompts.ts` (125 lines) — Hebrew prompts for photo/sketch/mp4/pdf
  - `route.ts` (95 lines) — Next.js API endpoint at `/api/analyze-photo`
- **First Phase 15 React component:** `src/components/intake/CustomerPicker.tsx` (~150 lines) — dropdown with Hebrew status badges, reuses Session 13 customer/project data shape
- **`src/lib/supabase.ts` upgraded:** preserved existing `Sink/SinkImage/SinkWithImage/SourceType` types (gallery still works), added Phase 15 types (`Customer/Project/ProjectStatus/CustomerWithProject/MediaAnalysis/MediaTypeDB/MediaAnalysisStatus`), disabled auth subsystem (kills GoTrueClient duplicate-instances warning)
- **Model locked: `claude-sonnet-4-6`** — retires no sooner than Feb 17, 2027 (~289 days). Longest-lived Sonnet currently active. Same price tier as 4-5, better at vision tasks.
- **`.env.local` cleaned up:** removed duplicate Cloudinary lines + stale `marble_rfq` preset reference. Now contains `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dqdku88vv`, `NEXT_PUBLIC_CLOUDINARY_PRESET_CALLS=marble_calls`, `NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE=marble_intake`, `ANTHROPIC_API_KEY=...` (server-side only)
- **Cursor workflow established:** Avshi can now create files via sidebar, edit in editor area, run commands in built-in terminal, save with Ctrl+S, all UTF-8 + Hebrew handled correctly. Replaces the prior Notepad-based workflow that was mangling Hebrew characters.
- **Cost guardrails baked in:** `MAX_OUTPUT_TOKENS = 1500` cap in `claudeVision.ts`, computed `api_cost_usd` per call stored in DB, server-side key handling so `ANTHROPIC_API_KEY` never reaches the browser

### Files in repo (committed in 955691c on `main`)
```
src/lib/intake/
├── claudeVision.ts          (5,056 bytes)
├── claudeVision.test.ts     (8,044 bytes)
├── cloudinary.ts            (5,169 bytes)
├── cloudinary.test.ts       (5,332 bytes)
├── detectMediaType.ts       (3,386 bytes)
├── detectMediaType.test.ts  (5,109 bytes)
└── prompts.ts               (7,431 bytes)

src/app/api/analyze-photo/
└── route.ts                 (3,090 bytes)

src/components/intake/
└── CustomerPicker.tsx       (5,123 bytes)

src/lib/supabase.ts          (modified)
phase15_schema_03052026-v2.sql
HANDOVER_03052026_evening.md
SKILL.md                     (replaced via Cursor's Skill UI)
```

### Decisions
- **Phase 15 = "Multi-Format Media Intake"** (renamed from misnamed "YouTube permissions architecture" inherited from prior bot). Real spec: 7 input types (photo/sketch/mp4/pdf/youtube/instagram/url) get analyzed by AI → structured Hebrew output → into gallery/HUB → feeds into price offers + artist briefs
- **Build location: inside `src/`** (multi-file React/TypeScript), NOT bolted onto SinC-ART's single-file HTML. Skill rule #7 enforces this going forward.
- **Save model: both** — write a `customer_communications` row (with new `comm_type` value like `'photo'`, `'mp4'`, etc.) AND a `media_analyses` row (with structured AI output). Two-row pattern preserves the unified communications timeline while adding rich extracted data.
- **Anthropic API: server-side only.** `ANTHROPIC_API_KEY` lives in `.env.local` without `NEXT_PUBLIC_` prefix, accessed only from `src/app/api/analyze-photo/route.ts`. Browser components POST to that endpoint — they never see the key.
- **Cloudinary URL transform tricks** (no API call, pure URL manipulation): `/upload/so_1,w_1200,f_jpg/clip.jpg` extracts second-1 frame from any video for AI analysis; `/upload/pg_1,w_1200,f_jpg/plans.jpg` extracts page-1 of any PDF. Pattern conceptually lifted from Beni CRM (`safetyHandleFile`/`snagHandleFile`/`asset_inbox`) — proven in production. Code itself rewritten as TypeScript per skill rule #7.
- **PhotoAnalyzer first** — simplest analyzer of the 7 (no frame extraction, no PDF parsing, highest volume per spec). Once it works end-to-end, the other 6 are variations on the same pattern.
- **Cursor → not Notepad** for any project file. Notepad strips Hebrew characters and adds BOM markers that break TypeScript compilation. Locked in skill rule #9.
- **Be explicit about WHERE to paste** — chat vs editor vs terminal. New developers mix these up; spell it out in instructions. Locked in skill rule #10.

### Open questions / blockers
- **Phase 13c orphan call** (`6257b6aa...` for סיגל לוי) still has `project_id = null` from before Phase 13d existed. Backfill via SQL update or leave as-is? Currently leaving.
- **`api_cost_usd` not yet wired** from `MARBLE_METER` into call save payload (parked from Session 13).
- **SinC-ART model migration:** current `claude-sonnet-4-20250514` retires June 15, 2026 (~42 days). Need to bulk-replace to `claude-sonnet-4-6` across all `demos/sinc_art_call_intake_*.html` files before then.
- **Supabase service role key potential exposure** — partial leak to chat in screenshot during debugging. Recommend rotating in Supabase dashboard before next session. Park as TODO.

### Next session
- Phase 15 UI build (3 files):
  1. `src/components/intake/MediaInput.tsx` (~80 lines) — URL input OR file upload
  2. `src/components/intake/analyzers/PhotoAnalyzer.tsx` (~140 lines) — wires MediaInput → cloudinary → /api/analyze-photo → results display
  3. `src/app/intake/page.tsx` (~80 lines) — the route at `/intake` that ties everything together
- End-to-end test: upload one of Ales's WhatsApp photos → see structured Hebrew analysis → save to DB → confirm both rows (`customer_communications` + `media_analyses`) land correctly
- Push to GitHub → Vercel auto-deploys → verify on `sinks-art.vercel.app/intake`

### Lessons learned (skill v12+ backlog)
- **Anthropic model lifecycle is ~12 months.** Always check retirement date when picking a model — don't default to whatever was used in a previous session. Long-lived models are worth the small effort to find.
- **Browser-side env vars need `NEXT_PUBLIC_` prefix; server-side don't.** `ANTHROPIC_API_KEY` (no prefix) = server-only and safe. `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = browser-readable, fine because it's not a secret.
- **TypeScript is forgiving about extra fields, strict about missing ones.** Adding fields to a type that the original query returned is harmless. Removing fields breaks every consumer of that type. When refactoring shared types: PRESERVE first, ADD second, REMOVE never (without checking every usage).
- **Windows folder casing is a real trap.** `C:\sinks\sinks_art` and `C:\SinkS\Sinks_ART` look identical to humans; PowerShell paths sometimes interact weirdly. Worth canonicalizing the project root path early.
- **`Move-Item` fails silently when source and destination resolve to nested-but-not-real paths.** Always `Test-Path` both source and destination before moving. Files-named-as-folders (Mode `-a----` instead of `d-----` on Get-ChildItem) are the most confusing failure mode.
- **Cursor's `U` indicator means "Untracked" (Git), not "Unsaved" (filesystem).** Files with `U` are saved on disk but not yet committed. This is normal for new files until first `git add` + `git commit`.

---

## 2026-05-03 — Session 13 — Customer CRM end-to-end + editable speaker bubbles (Phases 13a-13d + Phase 14)

### Goals
- Resume from Phase 13b (RLS blocker from morning session)
- Ship 13c (real call INSERT), 13d (project auto-create + status pipeline)
- Build Phase 14 (editable speaker bubbles) if time allowed
- Address known bugs from morning handover

### Done
- **Phase 13a fix:** RLS policies rewritten to allow anon reads (was blocking entire customer dropdown)
- **Phase 13c:** Real INSERT to `customer_communications` — calls now persist with full transcript + structured `ai_analysis` jsonb + audio metadata
- **Phase 13d:** Project auto-create + 8-stage Hebrew status pipeline + project notes
  - New columns: `customer_communications.project_id`, status default migrated `'lead'` → `'ליד'`
  - CHECK constraint migrated to whitelist 8 Hebrew values
  - Customer dropdown shows status badges: `סיגל לוי · 050... · [שיחת בירור]`
  - Auto-create project named `פרויקט · [name] · [date]` on first call when no active project exists
- **Phase 14:** Editable speaker bubbles via ElevenLabs word-level diarization
  - Per-speaker preset dropdown (`אמן (יוסי)` / `אמן (דני)` / `לקוח` / `מנהל` / `אחר`) + free-text custom override
  - `contenteditable` bubbles, color-coded per speaker
  - Labeled output `[אבשי]: ... [אלס]: ...` flows into both Claude analysis and Supabase save
- **Bug 3 fix (settings modal closes too fast):** Now stays open 1.8s with inline confirmation + auto-warns if any key looks suspiciously short
- **Bug 4 fix (no console access to supabaseClient):** Added `window.MARBLE_DEBUG` handle exposing client, transcript, turns, speakers, loaded project, and helpers
- **WhatsApp popup-blocker fix:** Replaced `prompt()` flow with inline modal so `window.open()` runs inside the user-gesture click context. Pre-fills last-used number from localStorage
- **GoTrueClient duplicate-instances warning:** Silenced by skipping reinit when URL unchanged + disabling unused auth subsystem
- **ElevenLabs hallucinated speaker prefixes:** Detected pattern (1–3 Hebrew words ≥3 chars + colon) — auto-stripped on every transcribe via `stripHallucinatedLeadingLabels()`, plus manual 🧹 button. Sharpened Claude analysis prompt to ignore `[bracket]:` labels when extracting names from contacts
- Versions shipped: **v5 → v6 → v7 → v8 → v9 → v10 → v11** in single working day

### Files in repo (now under `demos/` in `Sinks_ART`)
- sinc_art_call_intake_03052026-v11.html (88KB) — current
- sinc_art_call_intake_03052026-v5/v7/v8/v9/v10.html — kept for reference
- All previous demos (v1–v4 + marble_call_intake_30042026-v1.html + api_meter.js + api_meter_test.html) committed as well

### Decisions
- **Status lives on `projects`, not `customers`** (Path B — auto-create project per customer). Cleaner long-term model: one customer can have multiple projects over time
- **Hebrew values stored directly in DB** for `projects.status` instead of English keys with display translation. SELECT queries readable in Hebrew; English-locale tooling looks weird. Acceptable trade-off
- **8-stage payment-driven pipeline:** `ליד → שיחת בירור → הצעת מחיר נשלחה → אושר → שולמה מקדמה → תשלום מלא → הסתיים → אבוד`. Replaces generic sales pipeline with marble-business-specific stages
- **Stay on ElevenLabs** despite Hebrew hallucination issues — auto-strip handles it cheaply. Did NOT migrate to Whisper (parked as last-resort if Path A failed)
- **Console commands during debugging are useful, not overwhelming** — corrected the "stop sending console commands" lesson from morning handover. Memory updated

### Open questions / blockers
- Phase 13c row from earlier in the day (id `6257b6aa...`) has `project_id = null` because it was saved before Phase 13d existed. Backfill via SQL update or leave as-is? Currently leaving
- `audio_url` is null on most saved calls because Force Cloud is off. If every call's audio should be archived, the toggle stays on
- **Phase 15 (YouTube permissions architecture):** awaiting Avshi's clarification on what this feature actually is. Cannot plan without context

### Next session
- Phase 15 planning + build (after Avshi sends YouTube context)
- Optional small items: (1) backfill old Phase 13c row's `project_id`, (2) wire `api_cost_usd` from `MARBLE_METER` into call save payload

### Lessons learned (skill v11 backlog)
- **Schema introspection before INSERT code prevents debugging cycles.** Asking for one `information_schema.columns` query saved an entire iteration round
- **Postgres CHECK constraints are separate from column defaults.** When migrating allowed values, both must be updated — otherwise updates work but inserts of new values fail
- **`prompt()` before `window.open()` = popup blocker.** Modern Chrome treats sync modal dialogs as consuming the user-gesture token. Use inline modals instead
- **ElevenLabs Scribe v1 hallucinates speaker name prefixes** on Hebrew phone calls when `diarize=true`. Pattern is regular enough to auto-strip with a Hebrew-word-count regex
- **Per-feature version bumps + tested checkpoints beat bundled changes.** Each v6→v11 had its own test cycle; nothing got stuck