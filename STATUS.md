# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.

## 2026-05-06 — Session 17 (continued) — SinC-ART Phase B/C: audio pipeline + speaker map + WhatsApp emoji fix — committed 64cae72

### Goals
- Replace `/sinc` Phase A placeholder with Phase B (data layer) + Phase C (audio pipeline).
- Wire end-to-end: Cloudinary audio upload → ElevenLabs Scribe v1 diarization → Claude Hebrew analysis.
- Refactor `/intake` to use new shared components (ApiCostMeter generic, ExportFooter generic).
- Test on a real Hebrew audio recording, then production verify on phone.

### Done
- **`/sinc` Phase B/C shipped end-to-end** — single A-to-Z commit `64cae72`, 21 file changes, +2,544 / -611 lines.
- **Phase B (data layer):** new `src/lib/sinc/` with 7 files — types, prompts, claudeAnalysis, supabaseSinc, apiMeter, cloudinaryAudio, elevenlabs.
- **Phase C (audio pipeline):** 3-stage flow shown in live ApiCostMeter — upload (Cloudinary) → transcribe (ElevenLabs scribe_v1) → analyze (claude-sonnet-4-6). Two new API routes: `/api/sinc-transcribe`, `/api/sinc-analyze`. New components: `AudioFilePicker.tsx`, `CallProcessingFlow.tsx` (408 lines).
- **Shared components refactor:** new `src/components/shared/` and `src/lib/shared/` — `ApiCostMeter.tsx` (mode=single|pipeline) and `ExportFooter.tsx` (generic via `ReportSnapshot` interface). `/intake` PhotoAnalyzer + Mp4Analyzer migrated. Old intake-specific files removed: `AnalysisActionBar.tsx` (renamed to shared/ExportFooter), `ApiCallStatus.tsx` (deleted, replaced by ApiCostMeter), `intake/exportFormats.ts` (deleted, replaced by shared/exportFormats).
- **ElevenLabs env vars added** to `.env.local` and Vercel Production: `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL_ID=scribe_v1`. Sensitive toggle ON in Vercel.
- **End-to-end LOCAL test passed** on a 40-sec trimmed Hebrew audio file: full pipeline ran in ~24 sec, total cost $0.2782 (Cloudinary $0.0000 / ElevenLabs $0.2667 / Claude $0.0115). Speaker bubbles + Hebrew analysis fields populated correctly.
- **2 bugs caught during testing — both fixed before commit (no deferred work):**
  - **Bug 1: Speaker rename was per-bubble, not global.** Fixed via single-source-of-truth `speakerMap: Record<string, string>` (ElevenLabs original label → display name). New "👥 שמות הדוברים" amber panel above the bubbles. Edit one row → propagates to every bubble of that speaker AND to the exported transcript.
  - **Bug 2: Every emoji in WhatsApp export rendered as U+FFFD (`�`).** Hebrew was fine. Diagnosed via free print-preview test (emoji rendered fine in print → bug confined to URL path). Cause: the `wa.me/?text=` redirect strips the leading byte of 4-byte UTF-8 sequences. Fix: switched `buildWhatsAppUrl` to `https://api.whatsapp.com/send`. **Side-effect: `/intake` PhotoAnalyzer + Mp4Analyzer WhatsApp export silently fixed too** (same shared file).
- **Test audio quarantine:** added `TEST_*.mp3`, `TEST_*.wav`, `TEST_*.m4a`, `*.test.mp3` to `.gitignore`. Caught a 488 KB test file at the project root before it got committed.
- **Production verified** on `sinks-art.vercel.app/sinc` (laptop + phone): cream background, Frank Ruhl Libre title, RTL dropzone, footer reads `Phase B/C · 06/05/2026`. Vercel auto-deploy succeeded first try.

### Files in repo (committed in 64cae72)
```
.gitignore                                           (modified, TEST_*.mp3 patterns)
src/app/intake/page.tsx                              (modified, footer v1.7)
src/app/sinc/page.tsx                                (modified, replaced Phase A placeholder)
src/app/api/sinc-analyze/route.ts                    (NEW)
src/app/api/sinc-transcribe/route.ts                 (NEW)
src/components/intake/ApiCallStatus.tsx              (DELETED → replaced by shared/ApiCostMeter)
src/components/intake/AnalysisActionBar.tsx          (RENAMED → shared/ExportFooter.tsx)
src/components/intake/analyzers/Mp4Analyzer.tsx      (modified, uses shared imports)
src/components/intake/analyzers/PhotoAnalyzer.tsx    (modified, uses shared imports)
src/components/shared/ApiCostMeter.tsx               (NEW, generic, mode=single|pipeline)
src/components/shared/ExportFooter.tsx               (NEW, generic via ReportSnapshot)
src/components/sinc/AudioFilePicker.tsx              (NEW)
src/components/sinc/CallProcessingFlow.tsx           (NEW, 408 lines)
src/lib/intake/exportFormats.ts                      (DELETED → replaced by shared/exportFormats)
src/lib/shared/exportFormats.ts                      (NEW, 271 lines)
src/lib/sinc/apiMeter.ts                             (NEW)
src/lib/sinc/claudeAnalysis.ts                       (NEW)
src/lib/sinc/cloudinaryAudio.ts                      (NEW)
src/lib/sinc/elevenlabs.ts                           (NEW)
src/lib/sinc/prompts.ts                              (NEW)
src/lib/sinc/supabaseSinc.ts                         (NEW)
src/lib/sinc/types.ts                                (NEW)
```

### Decisions
- **3-stage pipeline shown in live meter** — user sees per-stage time + cost + token count for Cloudinary, ElevenLabs, Claude. Total cost displayed at the bottom.
- **`speakerMap` as single source of truth** — keyed by ElevenLabs' original `דובר 1`/`דובר 2` labels. Bubbles render via `displayName(originalLabel)` lookup. No mutation of bubble data.
- **WhatsApp URLs locked to `api.whatsapp.com/send` project-wide** (not just /sinc). Reason: the wa.me redirect mishandles 4-byte UTF-8 percent-escapes for emoji. Codified as **Rule #18** in skill v15.
- **`normalizePhoneForWaMe` function name kept** despite the wa.me → api.whatsapp.com migration. Backwards-compat with any future imports — function output (digits-only E.164) is identical.
- **Save flow ("✓ אשר ושמור") deliberately disabled** with "(יבוא בקרוב)" label — Phase D ships the customer/project save flow. The audio pipeline itself is feature-complete; the save button is an upcoming-feature placeholder, not deferred work.
- **Test audio always gitignored** (`TEST_*.mp3`, `TEST_*.wav`, `TEST_*.m4a`, `*.test.mp3`) — keeps repo lean, audio artifacts can never accidentally land on GitHub.
- **Free diagnostics first** (added to debugging toolkit) — when a bug shows at the end of a paid pipeline, look for free verification paths (print preview, console logs, source byte inspection) before re-running the pipeline.

### Open questions / blockers
- **Phase D pending** — customer/project save flow + customer linking modal (~90 min). The audio pipeline produces structured analysis ready to save to `customer_communications` + `media_analyses` tables; Phase D wires the picker UI then saves.
- **Phase E pending** — deprecate `demos/sinc_art_call_intake_v11.html`, move to `demos/legacy/` (~30 min).
- **`/intake` WhatsApp button silently auto-fixed** by the shared exporter change but not re-verified on production. Likely fine, but worth a 30-sec retest before declaring it done.
- **ElevenLabs Starter plan** — 30k credits/month, ~1k credits per audio minute = ~30 min audio/month at no cost. Heavy testing days will eat through this.
- **Commit message has cosmetic typos** (`sspeaker`, `Phase B//C`) — not amending, would change hash and force-push.

### Lessons learned (skill v14 → v15)
- **WhatsApp emoji corruption pattern:** `wa.me/?text=` strips 4-byte UTF-8 leading bytes during the redirect. Hebrew (2-byte UTF-8) survives, every emoji becomes `�`. **Always use `https://api.whatsapp.com/send`** — locked as **new Rule #18** in skill v15.
- **`Get-Content file | Measure-Object -Line` is unreliable** for counting lines. Use `(Get-Content file).Count` instead. Cost a 5-minute false alarm during file verification.
- **Identical bytes ≠ identical encoding behavior at every layer.** Browser-rendered emoji proves the JS string is valid; WhatsApp-mangled emoji proves the corruption point is between `encodeURIComponent` and the receiving client. The fix must go at the corruption point.
- **"Single source of truth" beats "propagate via search-replace"** for editable categorical labels. A map (`originalKey → displayValue`) survives hallucinated/duplicate labels; text-based propagation breaks the moment two labels normalize to the same display name.
- **`git commit -m "..." -m "..."` chained inside PowerShell is fragile** for long messages. Use `git commit -F <tempfile>` with a here-string-built message file instead.
- **Long PowerShell here-strings work great for `.tsx`/`.ts`** (Rule #14) but should NOT be used for files >10 KB or markdown (Rule #17). Hit this boundary today; download → Move-Item was the right call for both `CallProcessingFlow.tsx` (17 KB) and `exportFormats.ts` (11 KB).
- **`encodeURIComponent` is correct for emoji URL-encoding** — bug was in the wa.me redirect, not the encoder. Don't rewrite encoders without proof they're broken.

### Next session — Session 18 candidates (in order of likelihood)
- **A. Phase D — SinC-ART save flow** (~90 min). Customer/project linking modal, save analysis to `customer_communications` (comm_type='call') + `media_analyses`. Activates the disabled "✓ אשר ושמור" button.
- **B. /intake WhatsApp re-verify on production** (~5 min). Quick phone test that the silent auto-fix works.
- **C. Phase E — Demos cleanup** (~30 min). Move `demos/sinc_art_call_intake_*.html` to `demos/legacy/`. Update README.
- **D. Q1+Q2 — Library/Gallery page** (~90 min). `/customers/[id]` for customer-scoped browsing, `/library` for cross-customer reference, new `is_reference_library` boolean on `media_analyses`.
- **E. PdfAnalyzer.tsx** (~90 min). Architects' drawings via `pg_1` Cloudinary transform.

**Avshi's likely path: A → B → C → Q1+Q2 (unlocks Phase 16 price-offer engine).**

---

## 2026-05-06 — Session 17 — Mp4Analyzer with frame extraction + time picker — committed 4aac95e

### Goals
- Build Mp4Analyzer.tsx as the second analyzer in the Phase 15 family (after PhotoAnalyzer)
- Use Cloudinary URL transforms (so_N) to extract a single JPEG frame from any uploaded MP4
- Allow user to manually pick which second of the video to analyze (default: second 1)
- Follow Rule #11 strictly — integrate live API meter + AnalysisActionBar
- Verify production end-to-end with real Ales walk-around video

### Done
- **Mp4Analyzer.tsx (366 lines, 14 KB)** — full new analyzer with 5-stage state machine. Extracted frame preview + manual time picker (number input + "🔄 שלוף ונתח שוב" button + "▶️ הצג סרטון מקורי" toggle). Saves the ORIGINAL video URL to DB so any future second can be re-extracted.
- **cloudinary.ts modified** — `getVideoFrameUrl(videoUrl, secondMark)` now accepts an optional second mark (default 1). Backward compatible.
- **Type union extended** — `mediaType: 'photo' | 'sketch'` → `'photo' | 'sketch' | 'mp4'` in 3 places. Added `mp4: 'סרטון'` to label map.
- **intake/page.tsx routing added** — new `showMp4Analyzer` boolean, parallel `<Mp4Analyzer>` block alongside existing `<PhotoAnalyzer>`. Save flow handles `comm_type: 'mp4'` with subjectKind = 'סרטון'. Footer bumped to v1.6.
- **End-to-end LOCAL test verified:** uploaded `כיור.mp4` for customer יעל מזרחי. Frame extracted at second 1, Claude correctly identified pedestal sink with 'SINK' engraving, cost $0.0171. Re-extracted at second 8 + second 5 — both worked.
- **Save verified in Supabase:** row `8a1d35d2...` with `media_type='mp4'`, original video URL stored, Hebrew analysis intact.
- **PRODUCTION smoke test PASSED on phone** — 2 real MP4 walk-around videos via `sinks-art.vercel.app/intake`, second-8 frame extraction verified, full Hebrew analysis delivered.
- **Committed `4aac95e`** to main (5 files, +403/-67 lines). Vercel auto-deploy successful.

### Files in repo (committed in 4aac95e)
```
src/app/intake/page.tsx                              (modified, MP4 routing)
src/components/intake/analyzers/Mp4Analyzer.tsx      (NEW, 366 lines)
src/components/intake/analyzers/PhotoAnalyzer.tsx    (modified, type union)
src/lib/intake/cloudinary.ts                         (modified, getVideoFrameUrl secondMark)
src/lib/intake/exportFormats.ts                      (modified, mp4 label)
```

### Decisions
- **Default frame at second 1** (not middle) — fast, predictable, avoids title cards
- **Frame + "▶️ play original video" toggle + manual time picker** — best of all worlds
- **50MB file cap retained from Phase 15** — to be revisited next (Phase 15.6 raises to 100MB)
- **Save the ORIGINAL video URL, not the frame URL** — frame is a transform, recoverable forever
- **Re-extract a different frame = costs another $0.018** — explicit user choice
- **Status panel persists last call's stats until next call begins** — Phase 15.5 pattern

### Open questions / blockers
- **Fast Refresh state loss in dev mode** — clicking "שלוף ונתח שוב" while editing files in Cursor caused analyzer to reset. Confirmed dev-mode-only (Next.js Fast Refresh wipes useState during rebuild). NOT a production bug.
- **Q1+Q2: Library/Gallery page** — `/customers/[id]` plus possibly `/library` with `is_reference_library` boolean. ~90 min.
- **Q3: Raise file cap to 100MB + upload progress bar** — current 50MB ≈ 30-60 sec @ 1080p, too short for 2-5 min walk-throughs. ~30 min.
- **Cloudinary free tier**: 25 GB monthly bandwidth. At 100MB videos, ~250 views/month before paid tier needed.

### Lessons learned (skill v14 → committed)
- **Rule #15 LOCKED** (memory + skill): NEVER ask Avshi to edit individual lines, search inside a file, navigate to a specific line, or use Find & Replace. ALWAYS provide the COMPLETE FILE via PowerShell here-string. Applies across ALL projects.
- **Always `pwd` and `cd C:\SinkS\Sinks_ART` at session start** — terminals default to wrong folders. Hit this 3 times today.
- **Multi-line Find & Replace in Cursor is unreliable** — whitespace/indentation differences cause "No results."
- **Type union extension is a 2-step trap** — searching for `'photo' | 'sketch'` only catches the first match if other instances have different whitespace. Always verify with `Select-String`.
- **Next.js dev-mode Fast Refresh wipes useState during file edits** — production builds don't have Fast Refresh.
- **MP4 size/duration math**: 50MB ≈ 30-60 sec @ 1080p, 100MB ≈ 1-2 min, 200MB ≈ 3-4 min.

### Next session — Session 18 candidates
- **A. Library/Gallery page (Q1+Q2)** — `/customers/[id]` for customer-scoped browsing, `/library` for cross-customer reference, new `is_reference_library` column. ~90 min.
- **B. Phase 15.6 polish** — raise MP4 cap to 100MB, add upload progress bar, handle video rotation. ~30 min.
- **C. PdfAnalyzer.tsx** — `pg_1` Cloudinary transform for first PDF page. Architects' drawings. ~90 min.
- **D. Phase 16 price offer engine** — material cost lookup, labor estimator, margin slider, Hebrew PDF. ~150 min.
- **E. SinC-ART model migration** to `claude-sonnet-4-6` before June 15, 2026. ~30 min.

**Avshi's likely path: A then B → unlocks Phase 16 price-offer engine**

---

## 2026-05-05 — Session 16 — Vercel production sync + Phase 15.5 (live API meter + action bar) — committed bfec0c3

### Goals
- Configure Vercel env vars so production `/intake` actually works (not just localhost)
- Verify production end-to-end with a real photo upload
- Build Phase 15.5: live API meter + action bar (Print/Email/WhatsApp/Project) under every analysis
- Lock the new patterns into SKILL.md so future analyzers follow them automatically

### Done
- **Vercel env vars added (3 new):** `NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE`, `NEXT_PUBLIC_CLOUDINARY_PRESET_CALLS`, `ANTHROPIC_API_KEY`. Caught and fixed a typo (`ANTROPIC_API_KEY` missing the H).
- **Vercel redeploy without build cache** — forced fresh build to pick up new env vars.
- **Production `/intake` end-to-end VERIFIED** — uploaded a real photo (asymmetric chiseled marble sink), Claude correctly identified material with the hedge "(הערכה בלבד)". Save persisted both rows. Cost: $0.0169.
- **Phase 15.5 UI shipped** — 3 new files + 2 modified, ~660 lines total: `exportFormats.ts`, `ApiCallStatus.tsx`, `AnalysisActionBar.tsx`, modified `PhotoAnalyzer.tsx`, modified `intake/page.tsx`.
- **4 real bugs found and fixed during testing:** Outlook+mailto Hebrew bug → clipboard handoff; footer leaking customer-facing data → footer print-only; LTR rendering → U+200F RTL marker; "phone doesn't exist" → updated demo customers with real phone.
- **PowerShell here-string fallback discovered** — Cursor paste was repeatedly mangling Hebrew + JSX.
- **Operating rules expanded #11-#14** — added to SKILL.md.
- **SKILL.md upgraded to v13** — 378 lines.

### Decisions
- **Path B for Outlook + Hebrew** — clipboard handoff. Reasoning: clipboard preserves UTF-8 cleanly.
- **Gmail gets its own button** — separate from Outlook because Avshi uses Outlook for himself, Gmail for sending to Ales.
- **WhatsApp uses customer-facing body (no footer)**; email same. Print keeps the footer.
- **No drag-and-drop yet** — click-to-browse only.
- **Project button = "coming soon Phase 16" alert** — explicit honesty over a half-built customer page.
- **3 demo customers now share Avshi's contact info** for testing.

### Open questions / blockers
- **5 more analyzers pending** — Pdf, Mp4 (DONE Session 17), YouTube, Instagram, Url.
- **No customer detail page** — `/customers/[id]` not built yet.
- **WhatsApp link preview** of cloudinary URLs shows broken image card (not a code bug).
- **SinC-ART model migration before June 15, 2026.**

### Lessons learned (skill v13 → shipped)
- **Outlook's mailto-body Hebrew bug is a 20-year unresolved issue.**
- **`<>...</>` JSX fragments break parsers when mixed with Hebrew text** — use explicit `<span>`.
- **PowerShell here-string is the bulletproof fallback** for writing Hebrew-heavy files.
- **Test phone numbers in seed data should be flagged or replaced** before WhatsApp testing.
- **Vercel env var name typos cause silent failures** — always copy-paste, never type.
- **Vercel redeploy MUST be without cache** when env vars changed.

---

## 2026-05-04 — Session 15 — Phase 15 UI complete + first real photo analyzed end-to-end — committed 984dd9f

### Goals
- Build the 3 React UI files needed to expose Phase 15 to a browser
- End-to-end test: upload a real photo → AI analysis → save to DB → verify in Supabase
- Address the security exposure of the Supabase service role key from Session 14

### Done
- **MediaInput.tsx (~210 lines)** — two-tab UI, 50 MB file limit, URL validation, auto-detect badge.
- **PhotoAnalyzer.tsx (~270 lines)** — 4-stage state machine: idle → uploading → analyzing → review. 6 editable Hebrew fields + thumbnail preview + cost display.
- **app/intake/page.tsx (~180 lines)** — the route at `/intake`. Save writes BOTH `customer_communications` row AND `media_analyses` row.
- **End-to-end test PASSED:** uploaded real concrete pedestal sink photo for customer דוד כהן. Claude correctly identified material as "אבן מלאכותית או בטון אדריכלי" (NOT marble). Cost: **$0.0180**.
- **Security: rotated TWO production keys** after partial leaks during chat debugging.
- **Cursor workflow nailed.**

### Decisions
- **Click-to-browse only for v1.** **50 MB file size cap.** **Path A** — only photo/sketch shipped today.
- **Two-terminal pattern in Cursor** during dev.
- **Production secrets are NEVER pasted into chat.**

### Open questions / blockers
- **Vercel env vars not yet synced** (RESOLVED Session 16).
- **Other 5 analyzer types pending** (Mp4 done Session 17).

### Lessons learned (skill v12 → shipped)
- **Anthropic model lifecycle is ~12 months.**
- **Browser-side env vars need `NEXT_PUBLIC_` prefix.**
- **TypeScript is forgiving about extra fields, strict about missing ones.**
- **Windows folder casing is a real trap.**
- **Cursor's `U` indicator means "Untracked" (Git), not "Unsaved" (filesystem).**

---

## 2026-05-04 — Session 14 — Phase 15 backend (multi-format media intake) — committed 955691c

### Goals
- Lock the architecture rule (no more single-file HTML for new features) into both SKILL.md and Claude memory
- Build Phase 15 backend as multi-file React/TypeScript inside `src/`
- Activate Cloudinary + create SQL schema + wire model selection

### Done
- **Architecture rule locked in 3 places.**
- **Cloudinary activated:** cloud `dqdku88vv`, two unsigned presets — `marble_calls`, `marble_intake`.
- **SQL migration applied** (`phase15_schema_03052026-v2.sql`) — `media_analyses` table + extended `comm_type` whitelist.
- **5 backend files shipped** in `src/lib/intake/` and `src/app/api/analyze-photo/` (~600 lines, 54 tests passing).
- **First Phase 15 React component:** `CustomerPicker.tsx`.
- **`src/lib/supabase.ts` upgraded.**
- **Model locked: `claude-sonnet-4-6`** — retires no sooner than Feb 17, 2027.

### Decisions
- **Phase 15 = "Multi-Format Media Intake"** — build inside `src/` (multi-file), NOT bolted on to SinC-ART.
- **Save model: both** — write `customer_communications` row AND `media_analyses` row.
- **Anthropic API: server-side only.**
- **Cloudinary URL transform tricks** for video frame + PDF page extraction.
- **PhotoAnalyzer first** — simplest analyzer of the 7.

### Open questions / blockers
- See Session 15+ above (resolved).

---

## 2026-05-03 — Session 13 — Customer CRM end-to-end + editable speaker bubbles (Phases 13a-13d + Phase 14)

### Goals
- Resume from Phase 13b (RLS blocker)
- Ship 13c (real call INSERT), 13d (project auto-create + status pipeline)
- Build Phase 14 (editable speaker bubbles) if time allowed

### Done
- **Phase 13a fix:** RLS policies rewritten.
- **Phase 13c:** Real INSERT to `customer_communications`.
- **Phase 13d:** Project auto-create + 8-stage Hebrew status pipeline.
- **Phase 14:** Editable speaker bubbles via ElevenLabs word-level diarization.
- Versions shipped: **v5 → v11** in single working day.

### Decisions
- **Status lives on `projects`, not `customers`** (Path B).
- **Hebrew values stored directly in DB** for `projects.status`.
- **8-stage payment-driven pipeline.**
- **Stay on ElevenLabs** despite Hebrew hallucination issues.

### Lessons learned (skill v11 → shipped)
- **Schema introspection before INSERT code prevents debugging cycles.**
- **Postgres CHECK constraints are separate from column defaults.**
- **`prompt()` before `window.open()` = popup blocker.**
- **ElevenLabs Scribe v1 hallucinates speaker prefixes** on Hebrew calls.
- **Per-feature version bumps + tested checkpoints beat bundled changes.**
