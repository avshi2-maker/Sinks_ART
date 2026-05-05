# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.
- When an idea from `IDEAS_PARKING.md` becomes active, copy it into "Goals" and update its tag in the parking lot.

## 2026-05-05 — Session 16 — Vercel production sync + Phase 15.5 (live API meter + action bar) — committed bfec0c3

### Goals
- Configure Vercel env vars so production `/intake` actually works (not just localhost)
- Verify production end-to-end with a real photo upload
- Build Phase 15.5: live API meter (status panel) + action bar (Print/Email/WhatsApp/Project) under every analysis
- Lock the new patterns into SKILL.md so future analyzers follow them automatically

### Done
- **Vercel env vars added (3 new):** `NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE = marble_intake`, `NEXT_PUBLIC_CLOUDINARY_PRESET_CALLS = marble_calls`, `ANTHROPIC_API_KEY` (Sensitive toggle ON). Caught and fixed a typo (`ANTROPIC_API_KEY` missing the H — would have caused silent 500 errors). Existing 5 vars preserved.
- **Vercel redeploy without build cache** — forced fresh build to pick up new env vars. Build succeeded in 34 seconds.
- **Production `/intake` end-to-end VERIFIED** — uploaded a 2nd real photo (asymmetric chiseled marble sink with faucet), Claude correctly identified material as "אבן גירנית או שיש" with the hedge "(הערכה בלבד על פי פרופורציות)", flagged "האם הכיור נראה כמשולב (integrated) בקאונטר ולא עומד בנפרד". Save persisted both rows. Cost: $0.0169.
- **Phase 15.5 UI shipped** — 3 new files + 2 modified, ~660 lines total:
  - `src/lib/intake/exportFormats.ts` (~280 lines) — pure formatters: `buildSubject`, `buildPlainTextBody`, `buildPlainTextBodyForCustomer`, `buildGmailUrl`, `buildOutlookHandoffUrl`, `copyAnalysisForOutlook`, `buildWhatsAppUrl`, `normalizePhoneForWaMe`, `openPrintWindow`, `buildPrintHtml`
  - `src/components/intake/ApiCallStatus.tsx` (~165 lines) — sticky live status panel: module name, live timer (ticks every 200ms), tokens, cost. 3-state machine: `idle` → `running` (blue pulse) → `done` (frozen green). Persists between calls until next call begins.
  - `src/components/intake/AnalysisActionBar.tsx` (~150 lines) — 5-button row under every analysis: 🖨️ הדפס · 📋 לאאוטלוק · 📧 Gmail · 💬 וואטסאפ · 🔗 פרויקט (placeholder until Phase 16 customer page)
  - `src/components/intake/analyzers/PhotoAnalyzer.tsx` (modified) — wires `onStatusChange` callback + renders `<AnalysisActionBar>` in review stage
  - `src/app/intake/page.tsx` (modified) — owns `apiStatus` state, renders `<ApiCallStatus>` in sticky right column on desktop (stacks on mobile)
- **4 real bugs found and fixed during testing:**
  1. **Outlook + mailto:body Hebrew is garbled** — known 20-year-old Outlook bug. Fixed via "📋 לאאוטלוק" button using clipboard handoff: copy formatted body to clipboard + open `mailto:` with only To+Subject + user pastes body with Ctrl+V (Hebrew arrives clean because clipboard preserves UTF-8 correctly).
  2. **Footer leaking customer-facing internal data** — "Marble Art Sinks · ניתוח אוטומטי · עלות API: $0.0169" was appearing in WhatsApp messages to customers. Fixed: footer now ONLY in print HTML (internal records); email/Gmail/WhatsApp bodies have NO footer.
  3. **Body text in Outlook/Gmail rendered LTR not RTL** — Mitigated with U+200F RTL marker prefix. Not perfect (Outlook/Gmail's URL encoding strips bidi context) — Avshi accepts manual Ctrl+Shift+Right-arrow as fallback.
  4. **WhatsApp said "phone number doesn't exist"** — Root cause: סיגל לוי's phone in DB was `0501234567` (test number, not a real WhatsApp account). Fixed via SQL update: all 3 demo customers now have Avshi's real phone (`0505231042`) + email so testing flows to a real device.
- **PowerShell here-string fallback discovered** — Cursor paste was repeatedly mangling Hebrew + JSX in `AnalysisActionBar.tsx` (10 cascading TypeScript errors). Solution: write file directly via PowerShell `@'...'@` + `Out-File -Encoding UTF8`, bypassing all paste/clipboard layers. Locked in skill rule #14.
- **Operating rules expanded #11-#14** — added to SKILL.md:
  - **#11**: Every new analyzer (Pdf/Mp4/YouTube/Instagram/Url) MUST integrate Phase 15.5 patterns (`onStatusChange` + `<AnalysisActionBar>`)
  - **#12**: Never paste `.env.local` values into chat
  - **#13**: In RTL/Hebrew JSX, prefer `<span>` over `<>...</>` fragment shorthand
  - **#14**: PowerShell here-string fallback for Hebrew files when Cursor paste breaks
- **SKILL.md upgraded to v13** — 378 lines (was 228). Added: Operating Rules section near top (#7-#14 with magic phrase), Phase 15.5 Patterns section, current Project Structure tree, updated identifiers (Vercel ID, Cloudinary cloud, WhatsApp number), 9 new decision-log entries. Live in claude.ai → Customize → Skills.

### Files in repo (committed in bfec0c3 on `main`)
```
src/app/intake/page.tsx                              (modified, +20 lines)
src/components/intake/AnalysisActionBar.tsx          (NEW, ~150 lines)
src/components/intake/ApiCallStatus.tsx              (NEW, ~165 lines)
src/components/intake/analyzers/PhotoAnalyzer.tsx    (modified, +30 lines)
src/lib/intake/exportFormats.ts                      (NEW, ~280 lines)
```
Plus SKILL.md v13 in claude.ai (lives outside repo).

### Decisions
- **Path B for Outlook + Hebrew** — clipboard handoff (2-step user flow: button copies + opens compose, user pastes body with Ctrl+V) instead of trying to encode body into mailto URL. Reasoning: clipboard always preserves UTF-8 cleanly; Outlook's mailto-body parser is broken for non-Latin and won't be fixed.
- **Gmail gets its own button** — separate from Outlook because Avshi uses Outlook for himself, Gmail for sending to Ales. Two channels, two buttons.
- **WhatsApp uses customer-facing body (no footer)**; email uses customer-facing body too (Ales is internal but emails get forwarded). Print keeps the footer (internal records).
- **No drag-and-drop yet** — click-to-browse only. Drag-drop deferred to UI polish phase.
- **Project button = "coming soon Phase 16" alert** — explicit honesty over a half-built customer detail page.
- **3 demo customers now share Avshi's contact info** for testing. Real customer data will replace these when artist onboarding completes.
- **`SUPABASE_SERVICE_ROLE_KEY` left stale on Vercel** — Phase 15 doesn't use it server-side. Cleanup deferred. Same for `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (wrong-name leftover from initial setup).

### Open questions / blockers
- **5 more analyzers pending** — PdfAnalyzer, Mp4Analyzer, YouTubeAnalyzer, InstagramAnalyzer, UrlAnalyzer. Each ~120-150 lines. PhotoAnalyzer.tsx is the template; new analyzers MUST follow Rule #11 patterns.
- **No customer detail page** — `/customers/[id]` not built yet. AnalysisActionBar's "Project" button is a placeholder until Phase 16.
- **No project auto-creation in intake save flow** — if customer has no active project, save still writes `project_id = null`. Same orphan pattern as Phase 13 sigal call. Acceptable for now.
- **WhatsApp link preview** of cloudinary URLs shows broken image card (not a code bug, just how WhatsApp scrapes raw image URLs). Avshi accepts as-is, parked.
- **SinC-ART model migration before June 15, 2026** — `claude-sonnet-4-20250514` retires that day. Need bulk-replace to `claude-sonnet-4-6` across all `demos/sinc_art_call_intake_*.html`. ~40 days remaining as of today.

### Next session — Session 17 menu (pick one to start)
- **A. PdfAnalyzer.tsx (~90 min)** — architects' drawings → first-page JPEG via Cloudinary `pg_1` transform → Claude vision. Common from contractor customers. Closest analog to PhotoAnalyzer (already implemented).
- **B. Mp4Analyzer.tsx (~120 min)** — customer videos → first-frame JPEG via Cloudinary `so_1` transform → Claude vision. Higher volume (40% per spec).
- **C. YouTubeAnalyzer.tsx (~150 min)** — Ales's Ukraine network references. Most complex; needs YouTube transcript + thumbnail.
- **D. UrlAnalyzer + InstagramAnalyzer (~120 min)** — fetch page content + screenshot, send to Claude. Trickier than file uploads.
- **E. UI polish (~60 min)** — drag-drop on file zone, mobile breakpoints, IntakeHistory page showing past analyses per customer.
- **F. Customer detail page at `/customers/[id]` (~90 min)** — unlocks Project button, adds 1 page + 1 layout. Phase 16 starter.
- **G. SinC-ART model migration to `claude-sonnet-4-6` (~30 min)** — bulk replace before June 15, 2026 retirement.

**Recommended order:** A → B → F → E → C → D → G

### Lessons learned (skill v14+ backlog)
- **Outlook's mailto-body Hebrew bug is a 20-year unresolved issue** — never try to put non-Latin text in `mailto:body=`. Always use clipboard handoff for Outlook + Hebrew (the "Path B" pattern).
- **`<>...</>` JSX fragments break parsers when mixed with Hebrew text** — even when the source file is correct on my side, after paste through Cursor with Hebrew labels, the `>` characters get misread as bidi markers. **Always use explicit `<span>` in RTL JSX.** (Rule #13)
- **PowerShell here-string is the bulletproof fallback** for writing Hebrew-heavy files when Cursor paste breaks. `@'...'@ | Out-File -Encoding UTF8` bypasses every paste layer. (Rule #14)
- **Test phone numbers in seed data should be flagged or replaced before WhatsApp testing** — `0501234567` looks plausible but breaks integrations. Add a NOT NULL CHECK or seed validator in future schema migrations.
- **Vercel env var name typos cause silent failures** — `ANTROPIC_API_KEY` looked right at a glance, would have returned 500 errors only when user clicked Analyze. Always copy-paste env var names from documentation, never type them.
- **WhatsApp auto-previews any URL in body** — broken cloudinary preview card is unavoidable without metadata work. Either suppress URL or accept the visual quirk.
- **Vercel redeploy MUST be without cache** when env vars changed. Cached builds use the old env values even though new vars are listed in settings.
- **Production smoke testing on the actual production URL** caught nothing localhost couldn't have caught — but it's still worth doing for confidence and for catching deploy-only bugs (build errors, env missing, wrong Node version).

---

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
- **50 MB file size cap** with friendly Hebrew error message on overflow.
- **Path A — only photo/sketch shipped today.** Other 5 media types (mp4, pdf, youtube, instagram, url) show "coming soon" Hebrew amber notice.
- **Save model confirmed working in production:** customer_communications row + media_analyses row written atomically in one save click.
- **Two-terminal pattern in Cursor** during dev: terminal #1 runs `npm run dev` (don't close), terminal #2 for git + diagnostics.
- **Production secrets are NEVER pasted into chat.** Use `Get-Content .env.local | ForEach-Object { ($_ -split '=')[0] }` to safely list names.

### Open questions / blockers
- **Vercel env vars not yet synced.** /intake will likely fail on sinks-art.vercel.app/intake until production env vars are added. (RESOLVED in Session 16)
- **`SUPABASE_SERVICE_ROLE_KEY` is in local `.env.local` but Phase 15 doesn't use it.**
- **Other 5 analyzer types pending** (mp4, pdf, youtube, instagram, url).
- **No project auto-creation in intake save flow.**

### Next session
- Phase 15.5: live API meter + action bar (Print/Email/WhatsApp) under every analysis (DONE in Session 16)
- Then PdfAnalyzer.tsx as first new analyzer (Session 17 pending)

### Lessons learned (skill v12+ backlog)
- **Anthropic model lifecycle is ~12 months.** Always check retirement date when picking a model.
- **Browser-side env vars need `NEXT_PUBLIC_` prefix; server-side don't.**
- **TypeScript is forgiving about extra fields, strict about missing ones.** When refactoring shared types: PRESERVE first, ADD second, REMOVE never.
- **Windows folder casing is a real trap.** `C:\sinks\sinks_art` and `C:\SinkS\Sinks_ART` look identical to humans.
- **`Move-Item` fails silently when source and destination resolve to nested-but-not-real paths.** Always `Test-Path` both before moving.
- **Cursor's `U` indicator means "Untracked" (Git), not "Unsaved" (filesystem).**

---

## 2026-05-04 — Session 14 — Phase 15 backend (multi-format media intake) — committed 955691c

### Goals
- Lock the architecture rule (no more single-file HTML for new features) into both SKILL.md and Claude memory
- Build Phase 15 backend as multi-file React/TypeScript inside `src/`
- Activate Cloudinary + create SQL schema + wire model selection
- Establish the Cursor + npm + tsx + tsc workflow Avshi will use going forward

### Done
- **Architecture rule locked in 3 places:** SKILL.md item #7 (no single-file HTML, 1500-line ceiling), SKILL.md item #8 (one console command at a time during debugging), plus 2 persistent Claude memory entries.
- **Cloudinary activated:** cloud `dqdku88vv` (free tier, 25 credits/month). Two unsigned presets — `marble_calls` (folder `marble-sinks/calls`) and `marble_intake` (folder `marble-sinks/intake`).
- **SQL migration applied** (`phase15_schema_03052026-v2.sql`):
  - New `media_analyses` table — 21 columns, FK to `customer_communications`, 3 RLS policies, updated_at trigger
  - `customer_communications.comm_type` whitelist extended from 8 to 14 values
  - Path B confirmed: every inbound media saves a `customer_communications` row AND a `media_analyses` row
- **5 backend files shipped** in `src/lib/intake/` and `src/app/api/analyze-photo/` (~600 lines total, 54 tests passing):
  - `detectMediaType.ts` (108 lines) — pure logic, 24/24 tests
  - `cloudinary.ts` (140 lines) — upload + URL transform helpers, 12/12 tests
  - `claudeVision.ts` (140 lines) — server-side Anthropic API wrapper, 18/18 tests
  - `prompts.ts` (125 lines) — Hebrew prompts for photo/sketch/mp4/pdf
  - `route.ts` (95 lines) — Next.js API endpoint at `/api/analyze-photo`
- **First Phase 15 React component:** `src/components/intake/CustomerPicker.tsx` (~150 lines)
- **`src/lib/supabase.ts` upgraded:** preserved existing types (gallery still works), added Phase 15 types
- **Model locked: `claude-sonnet-4-6`** — retires no sooner than Feb 17, 2027
- **`.env.local` cleaned up.** Cursor workflow established. Cost guardrails baked in (`MAX_OUTPUT_TOKENS = 1500`).

### Decisions
- **Phase 15 = "Multi-Format Media Intake"** (renamed from misnamed "YouTube permissions architecture")
- **Build location: inside `src/`** (multi-file React/TypeScript), NOT bolted onto SinC-ART
- **Save model: both** — write a `customer_communications` row AND a `media_analyses` row
- **Anthropic API: server-side only**
- **Cloudinary URL transform tricks** for video frame + PDF page extraction
- **PhotoAnalyzer first** — simplest analyzer of the 7
- **Cursor → not Notepad**, **be explicit about WHERE to paste**

### Open questions / blockers
- **Phase 13c orphan call** for סיגל לוי still has `project_id = null`. Currently leaving.
- **`api_cost_usd` not yet wired** from `MARBLE_METER` into call save payload.
- **SinC-ART model migration:** current `claude-sonnet-4-20250514` retires June 15, 2026.
- **Supabase service role key potential exposure** (RESOLVED in Session 15)

### Next session
- Phase 15 UI build (3 files): MediaInput, PhotoAnalyzer, intake/page (DONE in Session 15)

### Lessons learned (skill v12+ backlog)
- See Session 15 above (lessons consolidated)

---

## 2026-05-03 — Session 13 — Customer CRM end-to-end + editable speaker bubbles (Phases 13a-13d + Phase 14)

### Goals
- Resume from Phase 13b (RLS blocker from morning session)
- Ship 13c (real call INSERT), 13d (project auto-create + status pipeline)
- Build Phase 14 (editable speaker bubbles) if time allowed

### Done
- **Phase 13a fix:** RLS policies rewritten to allow anon reads
- **Phase 13c:** Real INSERT to `customer_communications` — calls now persist with full transcript + structured `ai_analysis` jsonb
- **Phase 13d:** Project auto-create + 8-stage Hebrew status pipeline (`ליד → שיחת בירור → הצעת מחיר נשלחה → אושר → שולמה מקדמה → תשלום מלא → הסתיים → אבוד`)
- **Phase 14:** Editable speaker bubbles via ElevenLabs word-level diarization + per-speaker preset dropdowns
- WhatsApp popup-blocker fix, GoTrueClient warning silenced, ElevenLabs Hebrew hallucination auto-strip
- Versions shipped: **v5 → v6 → v7 → v8 → v9 → v10 → v11** in single working day

### Decisions
- **Status lives on `projects`, not `customers`** (Path B)
- **Hebrew values stored directly in DB** for `projects.status`
- **8-stage payment-driven pipeline**
- **Stay on ElevenLabs** despite Hebrew hallucination issues
- **Console commands during debugging are useful** — corrected the "stop sending console commands" earlier guidance

### Open questions / blockers
- Phase 13c row id `6257b6aa...` has `project_id = null` (legacy)
- `audio_url` is null on most saved calls because Force Cloud is off
- **Phase 15 (YouTube permissions architecture):** awaiting clarification (RESOLVED Session 14 — Phase 15 became Multi-Format Media Intake)

### Lessons learned (skill v11 backlog)
- **Schema introspection before INSERT code prevents debugging cycles**
- **Postgres CHECK constraints are separate from column defaults**
- **`prompt()` before `window.open()` = popup blocker** — use inline modals
- **ElevenLabs Scribe v1 hallucinates speaker prefixes** on Hebrew calls
- **Per-feature version bumps + tested checkpoints beat bundled changes**
