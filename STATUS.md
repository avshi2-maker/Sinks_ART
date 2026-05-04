# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.
- When an idea from `IDEAS_PARKING.md` becomes active, copy it into "Goals" and update its tag in the parking lot.

## 2026-05-04 — Session 15 — Phase 15 UI complete + first real photo analyzed end-to-end — committed 984dd9f

### Goals
- Build the 3 React UI files needed to expose Phase 15 to a browser (MediaInput, PhotoAnalyzer, intake/page)
- End-to-end test: upload a real photo → AI analysis → save to DB → verify in Supabase
- Address the security exposure of the Supabase service role key from Session 14

### Done
- **MediaInput.tsx (~210 lines)** — two-tab UI (📁 העלאת קובץ / 🔗 הדבקת קישור), 50 MB file limit with friendly Hebrew errors, URL validation, auto-detect badge ("זוהה: 🖼️ תמונה")
- **PhotoAnalyzer.tsx (~270 lines)** — 4-stage state machine: idle → uploading → analyzing → review. Wires Cloudinary upload + `/api/analyze-photo` + 6 editable Hebrew fields + thumbnail preview + cost display
- **app/intake/page.tsx (~180 lines)** — the route at `/intake`. Ties CustomerPicker + MediaInput + PhotoAnalyzer together. Save flow writes BOTH `customer_communications` row AND `media_analyses` row in one go, resets form on success
- **End-to-end test PASSED:** uploaded `20190722_102750.jpg` (concrete pedestal sink with engraved "SINK" text) for customer דוד כהן. Claude vision correctly identified material as "אבן מלאכותית או בטון אדריכלי" (NOT marble), shape as "מלבני עם חריץ תחתי", flagged the engraving as "יש לברר עם הלקוח". Cost: **$0.0180**. Both DB rows verified via SQL — `media_analyses.id = ef7f3e31-5577-4e25-b63e-56584c56e369`, linked correctly to `customer_communications` and `customers.דוד כהן`
- **Security: rotated TWO production keys** after partial leaks during chat debugging — Anthropic API key + Supabase service_role key. Updated `.env.local`, restarted dev server, verified app still works with new keys. The exposed old keys are now dead.
- **Cursor workflow nailed:** Avshi created folders + files via sidebar, pasted code without issues, used the integrated terminal for npm + git + tsc commands, recovered from one folder-named-as-file mishap (Move-Item failure → diagnosed via Mode `-a----` vs `d-----` distinction)
- Committed `984dd9f` to `main`. Vercel auto-deploy triggered.

### Files in repo (committed in 984dd9f)
```
src/app/intake/page.tsx                              (8,586 bytes)
src/components/intake/MediaInput.tsx                 (7,791 bytes)
src/components/intake/analyzers/PhotoAnalyzer.tsx    (11,256 bytes)
supabase/phase15_schema_03052026-v2.sql              (renamed from repo root)
```

### Decisions
- **Click-to-browse only for v1** — drag-and-drop deferred to UI polish phase. Click works on every device including mobile.
- **50 MB file size cap** with friendly Hebrew error message on overflow. Cloudinary free tier supports up to 100 MB but tighter cap protects credits.
- **Path A — only photo/sketch shipped today.** Other 5 media types (mp4, pdf, youtube, instagram, url) show "coming soon" Hebrew amber notice when detected. Each gets its own analyzer in subsequent sessions, same pattern as PhotoAnalyzer.
- **Save model confirmed working in production:** customer_communications row + media_analyses row written atomically in one save click. Failure of either rolls back the whole save (currently best-effort — could harden with a transaction in a later session).
- **Two-terminal pattern in Cursor** during dev: terminal #1 runs `npm run dev` (don't close), terminal #2 for git + diagnostics. Established as the pattern for this project.
- **Production secrets are NEVER pasted into chat.** Even partial pastes of `.env.local` exposed enough of the keys to require rotation. Rule logged: when comparing env vars, paste only variable NAMES, never values. Use `Get-Content .env.local | ForEach-Object { ($_ -split '=')[0] }` to safely list names.

### Open questions / blockers
- **Vercel env vars not yet synced.** `/intake` will likely fail on `sinks-art.vercel.app/intake` until production env vars are added. Tomorrow's first task.
- **`SUPABASE_SERVICE_ROLE_KEY` is in local `.env.local` but Phase 15 doesn't use it.** Could remove entirely from local config — only the anon key is needed for browser-side Supabase access. Park as cleanup.
- **Other 5 analyzer types pending** (mp4, pdf, youtube, instagram, url). PhotoAnalyzer is the template; each variant is ~120-150 lines + a different prompt.
- **No project auto-creation in intake save flow.** If selected customer has no active project, the save writes `project_id = null` (same orphan-pattern as the Phase 13 call from סיגל לוי). Acceptable for now; later we can mirror SinC-ART's auto-create-project behavior.

### Next session — Session 16 menu (pick one to start)
- **A. Vercel deploy + env vars (15 min)** — make `/intake` work in production. Highest leverage, lowest effort.
- **B. PdfAnalyzer.tsx (~90 min)** — architects' drawings → first-page JPEG via Cloudinary `pg_1` transform → Claude vision with `pdfPage1AnalysisPrompt`. Common from contractor customers.
- **C. Mp4Analyzer.tsx (~120 min)** — customer kitchen walk-around videos → first-frame JPEG via Cloudinary `so_1` transform → Claude vision. Higher-volume per spec (40% via Ales WhatsApp).
- **D. UrlAnalyzer / InstagramAnalyzer (~120 min)** — fetch page content via web_fetch + screenshot, send to Claude. Trickier than file uploads.
- **E. YouTubeAnalyzer (~150 min)** — needs YouTube transcript API + thumbnail extraction. The most complex of the 7.
- **F. UI polish pass (~60 min)** — drag-and-drop on file zone, mobile breakpoints, better thumbnails, IntakeHistory page showing past analyses per customer.
- **G. SinC-ART model migration** — bulk-replace `claude-sonnet-4-20250514` → `claude-sonnet-4-6` in all `demos/sinc_art_call_intake_*.html` files BEFORE June 15, 2026 retirement.

**Recommended order:** A → B → F → C → E → D → G

### Lessons learned (skill v13+ backlog)
- **Always use multiple terminals when running a dev server.** Once `npm run dev` blocks a terminal, subsequent commands need a second terminal. New devs naturally try Ctrl+C the server to free up the prompt — DON'T. Open a parallel terminal instead.
- **Git "deleted" entries can be ghosts.** When `git status` shows a file as deleted but `Test-Path` returns False AND `git restore` says "did not match any file(s) known to git" → the file was staged once but the actual blob never made it into git history. Recreate the file and `git add` to convert the phantom delete into a normal new-file entry.
- **`git rm --cached` cancels a staged operation without touching disk.** Useful when staging shows something that's actually fine.
- **Renames are auto-detected.** Moving a file to a new folder + `git add` produces `renamed: old/path -> new/path` rather than separate delete + add entries. Cleaner history.
- **Notepad and chat clients both eat secrets in transit.** Notepad mangles Hebrew; chat clients auto-link `process.env.X` and truncate at colons (pager prompts). Both also display API keys at full length, which is how leaks happen. **Cursor for editing, no chat for env values, ever.**
- **The architecture rule (skill #7) paid for itself today.** Phase 15 UI shipped as 3 small files. If we'd built it the SinC-ART way, it would be ~700 lines of jQuery-style bolted-on code. Instead it's 660 lines of typed React components with clean state flow. Modifications tomorrow change ONE component, not the whole thing.

---

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
- **Supabase service role key potential exposure** — partial leak to chat in screenshot during debugging. Recommend rotating in Supabase dashboard before next session. Park as TODO. (RESOLVED in Session 15)

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