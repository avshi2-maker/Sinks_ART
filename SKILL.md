---
name: marble-art-sinks
description: Project context for Avshi Sapir's Marble Art Sinks app — an artisan portfolio promoting two Israeli marble sink artists, now also the back-office work CRM (calls, intake, customers, /dashboard). Built as Next.js + Supabase + Cloudinary + Vercel with Hebrew RTL UI. Use this skill whenever Avshi mentions marble sinks, the sinks site, the work CRM, /dashboard, /sinc, /intake, /customers/[id], AI sink concepts, Nano Banana prompts, RFQ form, marble Supabase database, or any feature work here. Apply even for small requests (one component, CSS tweak, one new sink record, debugging) — project context (stack, conventions, schema, AI image policy, artist-approval gate, file delivery rules) is needed to respond correctly. Also use when Avshi shares a reference image and wants a Nano Banana prompt + JSON record, or reviews AI concept images. Do NOT apply Avshi's other-project conventions (var-only JS, sbQ wrapper, single-file HTML) here — this project uses modern TypeScript and proper folder structure.
---

# Marble Art Sinks

## What this project is

Originally: a bilingual artisan portfolio website promoting two Israeli marble sink artists. Visitors browse a catalog of handmade sinks, pick one (or several), and submit an RFQ (Request for Quote) which lands in Avshi's WhatsApp with all attached media — drawings, photos of the install space, voice notes, MP4 walkthroughs.

Now also: a work CRM cockpit for Avshi himself. Internal pages (`/dashboard`, `/sinc`, `/intake`, `/customers/[id]`) handle phone-call intake (audio → transcribe → analyze → save), photo/video analysis, customer detail with communications timeline, and a unified dashboard. The public marketing landing stays at `/`. The customer-facing RFQ flow remains the public-side workflow.

Built properly: real Git workflow, terminal-driven, multi-file Next.js, deployed on Vercel. **Not** another single-file HTML build like Avshi's other projects.

**The longer-term vision** (captured in `IDEAS_PARKING.md` under "NORTH STAR"): this app becomes Avshi's full Business Operating System spanning 5 verticals (marble sinks, flooring art, industrial flooring, special chemical imports, joint venture opportunities), replacing 40 years of fragmented tooling (Dropbox, Microsoft 365, dozens of separate SaaS subscriptions). Read the North Star section of `IDEAS_PARKING.md` whenever a feature decision touches the broader architecture. Marble Art Sinks is the proving ground for the pattern.

## Who's involved

- **Avshi Sapir** — 72-year-old self-taught developer, copy-paste workflow, architects in chat, runs commands in terminal. Triathlete, second-career developer transitioning from flooring contracting.
- **Two marble sink artists** — produce the actual handmade sinks; provide phone photos and approve AI concept images
- **Hebrew-speaking customers in Israel** — the audience; browse the gallery, send RFQs from their phones, place phone calls captured by /sinc

## Operating rules — LOCKED, non-negotiable

These rules were added across Sessions 14–21 after concrete pain. **Future sessions must follow them; if a future Claude session ignores them, Avshi has the magic phrase to push back: "Stop. This file is at [N] lines. Anything new should be a separate file or a refactor — not bolted on. What do you propose?"**

### Rule #7 — No single-file HTML for new features (1500-line ceiling)

For NEW features in this project, always build as multi-file React/TypeScript inside `src/`. A single file must NEVER exceed **1500 lines**. If a feature would push a file past 1500 lines, **stop and propose multi-file architecture before writing more code.**

**Exceptions (allowed to remain single-file):**
- `demos/legacy/sinc_art_call_intake_*.html` — pre-existing call intake demos archived in Phase E. Bug fixes allowed only if a real user report. New work goes into `/sinc` React (already migrated, Sessions 17-18).
- Tiny landing pages, explicit one-off prototypes Avshi specifically requests as single-file.

When in doubt: **multi-file React/TypeScript wins.**

### Rule #8 — One DevTools console command at a time during debugging

When debugging via browser console: send ONE diagnostic command per response, wait for output, then send the next. Avoid dumping 5+ commands at once — Avshi will try to copy-paste them all and lose track of which output goes with which command. He likes console commands; he just needs them paced.

### Rule #9 — Cursor (NOT Notepad) for any project file

Notepad strips Hebrew characters and adds BOM markers that break TypeScript compilation. Avshi uses Cursor for all editing. If Cursor is unavailable, fall back to PowerShell `@'...'@` here-string + `Set-Content -Encoding UTF8` to write files directly to disk (bypasses paste glitches). Never recommend Notepad.

### Rule #10 — Be explicit about WHERE to paste

When giving instructions, specify whether content goes into:
- **Cursor editor** (file content)
- **Cursor terminal** (PowerShell command)
- **Browser DevTools console** (debug command)
- **Supabase SQL editor** (SQL)
- **Vercel dashboard input field** (env var value)

Avshi is a copy-paste developer. Mixing these up causes lost time. Lead each block with a label like "**In Cursor terminal:**" or "**In Supabase SQL editor:**".

### Rule #11 — Every analyzer MUST integrate Phase 15.5 patterns

When building any new analyzer (`PdfAnalyzer.tsx`, `Mp4Analyzer.tsx`, `YouTubeAnalyzer.tsx`, `UrlAnalyzer.tsx`, `InstagramAnalyzer.tsx`), the analyzer MUST integrate the shared infrastructure components shipped in Session 17:

1. **`ApiCostMeter`** (`src/components/shared/ApiCostMeter.tsx`) — live cost display while the API runs. Receives an array of `ApiMeterReading` stages.
2. **`ExportFooter`** (`src/components/shared/ExportFooter.tsx`) — generic 5-button bar (Print / Outlook / Gmail / WhatsApp / Project). Driven by a `ReportSnapshot` from `src/lib/shared/exportFormats.ts`.
3. **`apiMeter.ts` helper** (`src/lib/sinc/apiMeter.ts`) — `makeRunningReading()`, `makeDoneReading()`, `makeErrorReading()` constructors.

The analyzer's review screen must:
- Display the live `ApiCostMeter` with the running stages
- Render `<ExportFooter snapshot={buildSnapshot()} onProjectClick={...} />` above any Save button
- Provide an `onProjectClick` callback that navigates to `/customers/[customer_id]` post-save (Phase 16.5 pattern)

See `src/components/sinc/CallProcessingFlow.tsx` as the current reference implementation. The legacy Phase 15.5 components (`ApiCallStatus.tsx`, `AnalysisActionBar.tsx`) were superseded by these shared versions in Session 17.

### Rule #12 — Never paste `.env.local` values into chat

Even partial pastes (last 8 chars) of API keys/service role keys are enough to trigger rotation. The safe pattern:

```powershell
Get-Content .env.local | ForEach-Object { ($_ -split '=')[0] }
```

This shows ONLY variable NAMES, never values. If Avshi needs to compare local vs Vercel, compare last 8 characters of one field at a time (low-risk slice).

If a key DOES leak in chat, immediately advise rotation: Anthropic console / Supabase dashboard.

### Rule #13 — In RTL/Hebrew JSX, prefer explicit tags over fragment shorthand

React fragment shorthand `<>...</>` confuses the JSX parser when mixed with bidirectional Hebrew text. Use explicit `<span>...</span>` instead. This was a real bug in `AnalysisActionBar.tsx` v2 — fragments compiled fine in clean test files but broke after paste through Cursor with Hebrew labels.

### Rule #14 — Use PowerShell here-string fallback for files with Hebrew

When pasting Hebrew-heavy `.tsx`/`.ts` files into Cursor results in errors that aren't in the source, write the file directly via PowerShell:

```powershell
@'
[file content here]
'@ | Set-Content -Path "src\path\to\file.tsx" -Encoding UTF8
```

Bypasses any paste / clipboard / encoding issues. After write, close + reopen the file in Cursor to refresh the editor. Use `Set-Content` (not `Out-File`) for cleaner UTF-8 BOM handling.

### Rule #15 — NEVER ask Avshi to edit individual lines

Avshi is a copy-paste developer. Never tell him to "go to line 42 and change X to Y", "use Find & Replace", or "edit just this part." Instead:
- Always provide a **complete file** for him to overwrite, OR
- Use a PowerShell regex-replace command in Terminal 2 that does the edit programmatically

Even small one-line changes (typo fix, URL change) get expressed as either a complete-file replacement or a precise `$content = $content.Replace($old, $new)` command. The "edit X to Y on line N" instruction format is forbidden.

### Rule #16 — FIRST command of every task must redirect to project root

Every PowerShell block in Terminal 2 MUST lead with `cd C:\SinkS\Sinks_ART` (the marble project) or `cd C:\SinkS` (when working with the skill or other parent-folder files). Never assume the terminal is in the right folder. Avshi runs multiple Cursor instances and terminal panes; he's been bitten by running git commands from `C:\SinkS\` (no repo there) instead of `C:\SinkS\Sinks_ART\`. The `cd` line is cheap insurance.

### Rule #17 — For markdown or large files, use download → Move-Item, not here-string

PowerShell here-strings (Rule #14) work great for `.tsx` and `.ts` files. They DO NOT work reliably for:
- **Markdown files (`.md`)** — special chars `-`, `**`, backticks, `>`, `<` get parsed as PowerShell operators
- **Large files (>10 KB)** — paste buffer issues, here-string boundary detection fails
- **Files where you can't guarantee perfect leading whitespace on the closing `'@`**

For these, generate the file in your container, present it via `present_files`, and give Avshi a Move-Item command pattern with project-root-or-Downloads fallback:

```powershell
cd C:\SinkS\Sinks_ART
if (Test-Path ".\FILE.ext") {
    Move-Item -Path ".\FILE.ext" -Destination ".\dest\path\FILE.ext" -Force
} elseif (Test-Path "$env:USERPROFILE\Downloads\FILE.ext") {
    Move-Item -Path "$env:USERPROFILE\Downloads\FILE.ext" -Destination ".\dest\path\FILE.ext" -Force
}
```

The fallback handles whether the browser saved to Downloads or directly to project root (Avshi's browser sometimes does the latter).

### Rule #18 — WhatsApp Click-to-Chat URLs must use `api.whatsapp.com/send`, NOT `wa.me`

The `wa.me` redirect mishandles 4-byte UTF-8 percent-escapes (all emoji), turning them into U+FFFD ("�") on the receiving side. The `api.whatsapp.com/send` endpoint is the older official Click-to-Chat URL and preserves emoji bytes correctly on both web and mobile. Hebrew (2-byte UTF-8) is unaffected by either path — the bug only shows up for emoji-heavy bodies. Since every export body opens with 📋 and ends with 🖼️, `wa.me` always corrupted at least two glyphs.

This is now binding for all WhatsApp URL builders in the project. See `src/lib/shared/exportFormats.ts` `buildWhatsAppUrl()` for the canonical implementation.

### Rule #19 — Verify line counts with `(Get-Content file).Count`, NOT `Measure-Object -Line` from a pipe

`Get-Content file | Measure-Object -Line` produces an unreliable count (counts something that isn't lines). Use `(Get-Content file).Count` to get the actual line count. False alarms from this cost time during file verification handoffs.

For paths containing brackets like `src/app/customers/[id]/page.tsx`, use `-LiteralPath`:

```powershell
(Get-Content -LiteralPath ".\src\app\customers\[id]\page.tsx").Count
```

Without `-LiteralPath`, PowerShell interprets `[id]` as a wildcard character set and the file isn't found.

### Rule #20 — Fix existing bugs before advancing to new features

When a bug is surfaced during testing — whether by Avshi or by Claude — fix it BEFORE starting any new feature work. The bug belongs to the phase that surfaced it, not the phase that comes next.

"Defer to next session" is permitted ONLY if BOTH of these are true:
- The bug is non-user-visible (console-only warnings, font preload notes, CSS preload, etc.)
- It's documented in IDEAS_PARKING.md with date AND explicit deferral approval from Avshi

User-visible bugs (clicking the wrong place, seeing the wrong page, broken layouts, incorrect data displayed) NEVER get deferred. They get fixed in the same session as the phase that surfaced them.

Concretely: if Phase 17 testing reveals that "חזרה לעמוד הבית" routes to the marketing page instead of /dashboard, that bug is a Phase 17 problem. It does not get pushed to "Phase 18 top nav will handle it." It gets fixed before Phase 17 closes.

This rule prevents bug accumulation. Latent bugs compound; they never disappear on their own.

## 🏗️ Architectural Rule (cross-project, captured Session 20)

**Binding rule for every module from Session 20 forward**, captured in full detail in `IDEAS_PARKING.md`:

> All media (audio, photo, video, PDF, doc, xlsx, csv, drawing) is uploaded to Cloudinary. Metadata is stored in Supabase. The Cloudinary URL lives on a `media_analyses`-style table. Every row has `customer_id` AND `project_id` foreign keys (or explicit nulls justified in the row's notes). Nothing is stored only in someone's email, Dropbox, local filesystem, or third-party SaaS without a corresponding row in the database.

When designing any feature that touches media or external data, this rule is non-negotiable. It exists because 40 years of Avshi's prior tooling chaos happened only because no such rule existed. Read the full Architectural Rule section in `IDEAS_PARKING.md` before designing PDF intake, spreadsheet intake, quote PDF generation, document signing, or any other module that involves external artifacts.

## Tech stack — locked in

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | TypeScript strict mode |
| Styling | Tailwind CSS + RTL plugin | Hebrew-first |
| UI primitives | shadcn/ui | Copy-into-project components |
| Database | Supabase | Postgres + RLS + Storage if needed |
| Media uploads | Cloudinary | Unsigned upload preset, browser → Cloudinary direct. **Anchored as canonical media layer per Architectural Rule.** |
| Audio transcription | ElevenLabs Scribe v1 | Hebrew diarization. ~$0.40/min. 30k credits/mo on Starter ≈ 30 min/mo free. |
| RFQ delivery | `api.whatsapp.com/send` deep-link | Pre-filled summary + Cloudinary URLs. **NEVER use `wa.me` (Rule #18).** |
| Hosting | Vercel | Hobby plan, Vercel subdomain |
| Repo | GitHub | New account dedicated to this client |
| AI image generation | Nano Banana (Gemini 2.5 Flash Image) | Avshi runs the model, Claude writes the prompts |
| AI vision analysis | `claude-sonnet-4-6` (Anthropic) | Server-side only via `/api/sinc-analyze` and `/api/analyze-photo` |

## Coding conventions FOR THIS PROJECT

These differ from Avshi's other projects. Read carefully — do not apply his other-project conventions here.

| Topic | This project | His other projects |
|---|---|---|
| JS/TS variable declarations | `const` and `let` | `var` only |
| Supabase access | Official `@supabase/supabase-js` client | Custom `sbQ()` wrapper |
| File structure | Multi-file, proper folders | Single-file HTML |
| Build tool | `next build` via Vercel | Manual file copy |
| Type safety | TypeScript strict mode | Vanilla JS |

What stays the same as his other projects:
- Filenames include `DDMMYYYY-vN` where it makes sense (deliverable docs, schema files, exported reports — NOT source files at fixed paths)
- All app UI is Hebrew RTL
- Step-by-step working style, plan before implementing, never delete without approval

## Communication and language rules

- **Chat with Avshi**: English only
- **Code comments and identifiers**: English
- **App UI shown to customers**: Hebrew, right-to-left
- **Documents shown to the artists** (briefs, instructions): Hebrew
- **Deliverable filenames**: English with `DDMMYYYY-vN` suffix

## Working style — non-negotiable

1. **Plan first, implement second.** Always lay out the plan in chat before producing code.
2. **Slow and bug-free** beats fast and risky.
3. **Never delete code, data, or files without explicit approval** from Avshi.
4. **Always provide complete files**, not snippets that require Avshi to splice into existing code (Rule #15).
5. **One concern per response** — don't pile six features into a single message.
6. **Avshi works copy-paste** — give him the whole file or the whole SQL block, not "add this line here" (Rule #15).
7. **Two terminals in Cursor** during dev: terminal #1 runs `npm run dev` (don't close), terminal #2 for git/diagnostics.
8. **Fix existing bugs before advancing** (Rule #20) — never let a known user-visible bug carry into the next phase.
9. **Never ask technical decision questions.** Pick the best professional option, state why in 1-2 sentences, proceed. Only ask about business decisions or environment checks.
10. **Verify with Avshi's eyes.** "I added the code" ≠ "the feature works." Production verification by Avshi is the only verification standard that counts.

## The image policy (critical)

The site has three categories of images, distinguished by the `source_type` column on the `sinks` table:

| `source_type` | Badge in UI | What it is | Who approves |
|---|---|---|---|
| `concept` | `סקיצה` (amber) | AI-generated by Nano Banana | The artist who would build it must tick `approved_by_artist` before it goes live |
| `real_photo` | `יצירה מקורית` (green) | Photo of an actual sink the artist made | Auto-approved (it's their own work) |
| `inspiration` | `השראה` (gray) | Reference image; never orderable | Hidden from main gallery; lives only on inspiration page if used at all |

**Hard rules:**
- Every AI-generated image carries the `סקיצה` badge automatically. No exceptions, no opt-out.
- Every concept image stays hidden until `approved_by_artist = true`. The artist who would actually build it confirms "yes, I can produce something in this spirit."
- Pinterest / web-scraped images are NEVER displayed on the production site, even with a label. They're allowed only as `source_reference` metadata pointing back to what inspired a concept.
- The RFQ form headline changes based on `source_type` — see `references/architecture.md` for the exact copy.

This policy exists to protect the artists legally (no copyright issues), protect the customer (no false expectations), and protect the brand (no "I bought sketch #14, where is it" complaints).

## The AI image pipeline

Standard workflow when Avshi sends reference images and asks for prompts:

1. Avshi sends 1–20 reference images in chat
2. For each image, output:
   - A structured JSON record (drops directly into Supabase `sinks` table)
   - A polished Nano Banana prompt in English
   - A Hebrew name for the model
   - A 2-line Hebrew description
3. Avshi runs the prompts in Nano Banana, uploads the resulting images to Cloudinary
4. Avshi pastes the Cloudinary URL into the JSON, runs the SQL `INSERT`
5. Image goes live with `approved_by_artist = false` — hidden until artist approves
6. Artist approves → image appears in gallery with `סקיצה` badge

The full template and prompt-writing guide lives in `references/ai_image_pipeline.md` and `assets/ai_record_template.json`. Read those before generating prompts.

## Project structure (current — Session 21, 08/05/2026)

```
Sinks_ART/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                          public marketing landing (שיש אמנותי)
│  │  ├─ gallery/page.tsx                  full catalog (public)
│  │  ├─ dashboard/                        Phase 17, Session 21
│  │  │  ├─ page.tsx                       orchestrator (Server Component)
│  │  │  ├─ layout.tsx                     header strip, RTL container
│  │  │  └─ fetchDashboardData.ts          server-side Supabase queries (4 parallel)
│  │  ├─ sinc/page.tsx                     SinC-ART call intake (Phase B/C/D, Sessions 17-18)
│  │  ├─ intake/page.tsx                   Phase 15 multi-format media intake
│  │  ├─ customers/
│  │  │  └─ [id]/page.tsx                  Phase 16 customer detail page
│  │  ├─ api/
│  │  │  ├─ analyze-photo/route.ts         server-side Claude vision (Phase 15)
│  │  │  ├─ sinc-transcribe/route.ts       server-side ElevenLabs Scribe (Phase B)
│  │  │  └─ sinc-analyze/route.ts          server-side Claude analysis (Phase C)
│  │  └─ layout.tsx                        RTL, fonts, header/footer
│  ├─ components/
│  │  ├─ dashboard/                        Phase 17, Session 21
│  │  │  ├─ TodayActivityStrip.tsx         4 cards: calls/photos/videos/cost
│  │  │  ├─ QuickActions.tsx               3 large route buttons
│  │  │  ├─ TasksStrip.tsx                 placeholder with mock tasks (Phase 17.5 will replace)
│  │  │  ├─ ActiveProjectsList.tsx         table sorted by last activity
│  │  │  └─ RecentCommsFeed.tsx            last 10 across all comm_types
│  │  ├─ customers/                        Phase 16, Session 18 cont.
│  │  │  ├─ CustomerHeader.tsx
│  │  │  ├─ ProjectsList.tsx
│  │  │  └─ CommsTimeline.tsx
│  │  ├─ sinc/                             Phase B/C/D, Sessions 17-18
│  │  │  ├─ AudioFilePicker.tsx
│  │  │  ├─ CallProcessingFlow.tsx         orchestrator: upload → transcribe → analyze → save
│  │  │  ├─ SaveCustomerModal.tsx          Phase D modal with picker + auto-create-project
│  │  │  └─ SpeakerNamePanel.tsx
│  │  ├─ shared/                           Session 17 — used by SinC, Intake, future analyzers
│  │  │  ├─ ApiCostMeter.tsx               live cost display (replaces ApiCallStatus)
│  │  │  └─ ExportFooter.tsx               5-button export bar (replaces AnalysisActionBar)
│  │  └─ intake/                           Phase 15
│  │     ├─ CustomerPicker.tsx
│  │     ├─ MediaInput.tsx
│  │     └─ analyzers/
│  │        └─ PhotoAnalyzer.tsx           reference for Rule #11
│  ├─ lib/
│  │  ├─ supabase.ts
│  │  ├─ shared/
│  │  │  └─ exportFormats.ts               generic ReportSnapshot + per-channel formatters
│  │  ├─ sinc/                             Phase B/C/D, Sessions 17-18
│  │  │  ├─ types.ts                       SincCallSaveResult, SincCallFullSavePayload, etc.
│  │  │  ├─ supabaseSinc.ts                listCustomers, saveCallFull, etc.
│  │  │  ├─ cloudinaryAudio.ts             audio upload helper
│  │  │  └─ apiMeter.ts                    makeRunningReading, makeDoneReading, makeErrorReading
│  │  └─ intake/
│  │     ├─ detectMediaType.ts             pure logic + tests
│  │     ├─ cloudinary.ts                  upload + URL transform helpers
│  │     ├─ claudeVision.ts                server-side Anthropic wrapper
│  │     └─ prompts.ts                     Hebrew prompts per media type
├─ supabase/
│  └─ phase15_schema_03052026-v2.sql       media_analyses + comm_type whitelist
├─ demos/
│  └─ legacy/                              Phase E archive: 10 single-file SinC-ART demos
├─ STATUS.md                               daily session log (newest on top)
├─ IDEAS_PARKING.md                        North Star vision + Architectural Rule + roadmap
├─ .env.local                              gitignored
└─ package.json
```

## Database

Full schema lives in `references/schema.sql`. Run that file in the Supabase SQL Editor when initializing or when adding columns. Always version the schema file with `DDMMYYYY-vN` and commit it to the repo.

Key tables (Phase D and 16/16.5/17 additions noted):
- `artists` — the two makers
- `sinks` — catalog rows
- `sink_images` — multiple images per sink
- `rfq_requests` — incoming leads (RFQ form submissions)
- `customers` — Phase 13 (id, name_he, phone, email, source, notes, created_at). **Phase D fix 2 (07/05/2026):** `source` is whitelist-constrained; allowed values are `pinterest`, `whatsapp`, `instagram`, `website`, `referral`, `walk-in`, `phone`, `other`. **Session 20 fix:** `createCustomer` now applies `.replace(/\s+/g, ' ')` after `.trim()` to collapse internal whitespace in names.
- `projects` — Phase 13d (id, customer_id, title_he, status [8 Hebrew values], description_he, notes [text], inquiry_date, created_at). **Phase D fix 1 (06/05/2026):** schema reality — `description_he` + `notes` (text) columns, NOT a `notes_jsonb` column.
- `customer_communications` — Phase 13c (id, customer_id, project_id, comm_type [14 values], subject, body, ai_analysis jsonb, audio_url, api_cost_usd, duration_seconds, created_at). **Session 20 fix:** `duration_seconds` (int4) is now populated by `saveCallFull` for call rows; previously always null. **Latent column-naming issue:** `audio_url` is audio-specific by name; for photo/mp4 rows, the URL lives on `media_analyses.cloudinary_url` (joined via `comm_id`). Future migration may rename `audio_url` → `media_url`.
- `media_analyses` — Phase 15 (id, comm_id, customer_id, project_id, media_type, source_url, cloudinary_url, thumbnail_url, source_filename, extracted_dimensions, extracted_stone_type, extracted_shape, design_intent_he, reference_summary_he, ai_full_report jsonb, status, approved_by, used_for_quote, api_cost_usd, created_at, updated_at). **Phase D extension:** `ai_full_report` jsonb now holds `analysis`, `speaker_map`, `bubbles`, `raw_transcript_text`, `duration_sec`, `audio_url`, `saved_phase`, `saved_at` for SinC-ART calls.

`customer_communications.comm_type` whitelist (14 values): `call`, `whatsapp`, `email`, `meeting`, `photo`, `note`, `document`, `other`, `sketch`, `mp4`, `pdf`, `youtube`, `instagram`, `url`.

`projects.status` whitelist (8 Hebrew values): `ליד`, `שיחת בירור`, `הצעת מחיר נשלחה`, `אושר`, `שולמה מקדמה`, `תשלום מלא`, `הסתיים`, `אבוד`.

RLS policies: anyone can `SELECT` from `sinks` where `is_published = true AND approved_by_artist = true`. Anon can `INSERT` into `rfq_requests`, `customer_communications`, `media_analyses` (open during user testing — tighten in Phase 20+ when real auth ships). Only authenticated users (Avshi) can write to `sinks` / `sink_images` / `artists`.

## Project identifiers (live)

These are the real, live identifiers for this project. Reference them when generating connection strings, env files, or URLs.

| Service | Identifier | Notes |
|---|---|---|
| GitHub repo | `avshi2-maker/Sinks_ART` | https://github.com/avshi2-maker/Sinks_ART |
| Vercel project | `sinks-art` (lowercase) | Project ID `prj_lrgtda27Mjf6S8MRvKwOP2OBHc35`. Hobby plan. |
| Vercel branch | `main` | PRODUCTION environment → `sinks-art.vercel.app` |
| Supabase project ref | `givcxgzhfoetujhrjgvc` | URL: https://givcxgzhfoetujhrjgvc.supabase.co |
| Cloudinary cloud_name | `dqdku88vv` | Free tier, 25 credits/month |
| Cloudinary preset (Phase 15) | `marble_intake` | Folder `marble-sinks/intake`, unsigned |
| Cloudinary preset (SinC-ART) | `marble_calls` | Folder `marble-sinks/calls`, unsigned |
| WhatsApp number | `972505231042` | E.164 without `+` |

## Required `.env.local` (current)

```
NEXT_PUBLIC_SUPABASE_URL=https://givcxgzhfoetujhrjgvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...                # Supabase dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY=...                    # server-only; not currently used
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dqdku88vv
NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE=marble_intake
NEXT_PUBLIC_CLOUDINARY_PRESET_CALLS=marble_calls
NEXT_PUBLIC_WA_NUMBER=972505231042
ANTHROPIC_API_KEY=sk-ant-...                     # server-only, NEVER NEXT_PUBLIC_, NEVER pasted to chat (Rule #12)
ELEVENLABS_API_KEY=...                           # server-only, used by /api/sinc-transcribe
ELEVENLABS_MODEL_ID=scribe_v1                    # ElevenLabs Scribe v1
```

The same set must exist on Vercel → Settings → Environments → Production. After adding/changing on Vercel, **redeploy WITHOUT build cache** so the new vars take effect (this is what fixed the production audio pipeline in Session 18 cont., commit `d33587d`).

## Phase 15.5 / Session 17 shared component patterns

These shared components, refactored from Phase 15.5's per-page components into project-wide `src/components/shared/` and `src/lib/shared/` in Session 17, give every analyzer/page a consistent live status meter and consistent export options.

### 1. ApiCostMeter (`src/components/shared/ApiCostMeter.tsx`)

Replaces the older `ApiCallStatus.tsx`. Renders an array of `ApiMeterReading[]` stages with per-stage status, tokens, and cost. Modes: `single` (one big reading) or `pipeline` (multiple stages).

Constructors in `src/lib/sinc/apiMeter.ts`:
- `makeRunningReading(stage, moduleLabel)` — call when starting
- `makeDoneReading(prev, inputTokens, outputTokens, costUsd)` — call on success
- `makeErrorReading(prev, errorMsg)` — call on failure

### 2. ExportFooter (`src/components/shared/ExportFooter.tsx`)

Replaces the older `AnalysisActionBar.tsx`. Generic 5-button bar driven by a `ReportSnapshot`:

| Icon | Label | Action |
|---|---|---|
| 🖨️ | הדפס | `openPrintWindow()` — prints HTML with internal cost footer |
| 📋 | לאאוטלוק | `copyBodyForOutlook()` — clipboard write + `mailto:` (no body), user pastes with Ctrl+V |
| 📧 | Gmail | `buildGmailUrl()` — Gmail web compose with body pre-filled |
| 💬 | וואטסאפ | `buildWhatsAppUrl()` — uses `api.whatsapp.com/send` (Rule #18), no internal footer |
| 🔗 | פרויקט | `onProjectClick` callback — Phase 16.5 wires this to `/customers/[customer_id]` post-save |

### 3. ReportSnapshot + exportFormats.ts (`src/lib/shared/exportFormats.ts`)

Generic interface every analyzer fills:

```ts
interface ReportSnapshot {
  reportTypeHe: string;
  subjectSuffix: string;
  customer?: { nameHe: string; email?: string | null; phone?: string | null };
  projectContext?: string;
  sections: { headingHe: string; bodyHe: string | null | undefined }[];
  primaryAssetUrl?: string;
  primaryAssetLabelHe?: string;
  apiCostUsd?: number;
}
```

`buildPlainTextBody()`, `buildSubject()`, `buildGmailUrl()`, `buildWhatsAppUrl()`, `copyBodyForOutlook()`, `openPrintWindow()` all consume this snapshot. Body is prefixed with `\u200F` (RTL marker) to nudge clients toward right-to-left rendering. Print HTML keeps the internal footer (cost, branding) since print is for Avshi's records, not for sharing.

**Hard rule for new analyzers (Rule #11):** the analyzer's review stage must instantiate `<ExportFooter snapshot={buildSnapshot()} onProjectClick={...} />` and call the `apiMeter` helpers at the appropriate stages. Without these, the live meter doesn't work and the export bar doesn't appear — the user experience regresses.

## Account setup checklist (historical reference)

These were created during setup. Kept here for reference.

1. **GitHub** — used existing `avshi2-maker` account
2. **Vercel** — signed in with GitHub, created `sinks-art` project (Hobby plan)
3. **Supabase** — project created, ref `givcxgzhfoetujhrjgvc`
4. **Cloudinary** — `dqdku88vv` cloud, two unsigned presets: `marble_calls`, `marble_intake`
5. **Anthropic** — API key created, stored server-side only
6. **ElevenLabs** — API key created (Session 17), Scribe v1 model. Stored server-side only.

## Decision log

Append-only. Update with date + brief note when major calls are made.

| Date | Decision |
|---|---|
| 29/04/2026 | Tech stack locked: Next.js + Supabase + Cloudinary + Vercel + WhatsApp deep-link handoff |
| 29/04/2026 | New GitHub account for client, Vercel subdomain to start (no custom domain yet) |
| 29/04/2026 | AI concept images allowed, ALWAYS labeled `סקיצה`, gated by `approved_by_artist` flag |
| 29/04/2026 | Pinterest images forbidden in production; usable only as concept-prompt inspiration |
| 29/04/2026 | Photo brief delivered to the two artists in Hebrew |
| 30/04/2026 | Call intake demo built (`marble_call_intake_30042026-v1.html`) |
| 30/04/2026 | Working docs added: `IDEAS_PARKING.md` (future ideas), `STATUS.md` (daily session log) |
| 30/04/2026 | GitHub repo created at existing `avshi2-maker` account; repo name `Sinks_ART` |
| 30/04/2026 | Vercel project `sinks-art` provisioned, deployed from `main` branch |
| 30/04/2026 | Supabase project ref locked: `givcxgzhfoetujhrjgvc` |
| 03/05/2026 | SinC-ART call intake demo iterated v5 → v11 with editable speakers, status pipeline, customer/project linking |
| 04/05/2026 | **Phase 15 = Multi-Format Media Intake**. Built backend, Cloudinary activated, schema migration. Model `claude-sonnet-4-6` |
| 04/05/2026 | **Operating rules #7-#10 locked** |
| 04/05/2026 | Phase 15 UI shipped, end-to-end tested with real customer photo for $0.018 |
| 05/05/2026 | Vercel env vars synced for Phase 15. `sinks-art.vercel.app/intake` verified in production |
| 05/05/2026 | **Phase 15.5 patterns added: live API meter + export action bar. Rule #11 locked.** |
| 05/05/2026 | **Rules #12-#14 added** |
| 05/05/2026 | WhatsApp/email body footer removed (was leaking "API cost" to customers). Footer kept only in print HTML |
| 06/05/2026 | **Phase B/C — SinC-ART migrated from single-file HTML to React/Next.js.** Lives at `/sinc`. Replaced demo with `CallProcessingFlow.tsx`. Server routes: `/api/sinc-transcribe`, `/api/sinc-analyze`. Anthropic and ElevenLabs API calls moved server-side. |
| 06/05/2026 | **Phase D — Full save flow.** `saveCallFull()` writes to both `customer_communications` and `media_analyses`. SaveCustomerModal with picker + auto-create-project fallback. |
| 06/05/2026 | **Phase D fix 1 — schema reality.** `projects` has `description_he` + `notes` (text), NOT `notes_jsonb`. Code corrected. |
| 06/05/2026 | **Generic ExportFooter + exportFormats refactor.** Per-page Phase 15.5 components consolidated to `src/components/shared/` and `src/lib/shared/`. |
| 06/05/2026 | **WhatsApp emoji bug fixed.** Switched from `wa.me/` to `api.whatsapp.com/send` to preserve emoji bytes. **Rule #18 locked.** |
| 07/05/2026 | **Phase D fix 2 — `customers.source` whitelist.** Allowed values pinned. SinC-created customers use `'phone'`. |
| 07/05/2026 | **Production env vars fix.** Commit `d33587d`. ELEVENLABS_API_KEY + ELEVENLABS_MODEL_ID at Vercel project level, redeployed without cache. |
| 07/05/2026 | **Phase E — Legacy demos archived.** Commit `5d08b9f`. Ten single-file demos moved from `demos/` to `demos/legacy/`. |
| 07/05/2026 | **Phase 16 — Customer detail page** at `/customers/[id]`. Server component, Hebrew RTL, customer card + projects list + תקשורת timeline. |
| 07/05/2026 | **Phase 16.5 — Post-save customer page navigation.** Commit `f341fef`. Indigo "👤 פתח עמוד לקוח" button + ExportFooter `onProjectClick` wired to `/customers/[customer_id]`. Latent Phase D defect surfaced and fixed: `SincCallSaveResult.customer_id` now exposed to caller. |
| 08/05/2026 | **Bug-cleanup hour (Session 20).** Working tree cleanup (4 junk files deleted). Customer name whitespace normalization (commit `80145c7`). `duration_seconds` capture on call save (commit `566dad1`, verified live). SaveCustomerModal search filter false-bug investigation closed. |
| 08/05/2026 | **NORTH STAR vision captured.** 5-vertical Business Operating System (marble sinks, flooring art, industrial flooring, chemical imports, JV). 18-24 month build. Full content in `IDEAS_PARKING.md`. |
| 08/05/2026 | **Architectural Rule captured.** All media through Cloudinary, metadata in Supabase, customer_id+project_id required. Binding for all future modules. Closes the Supabase-Storage-vs-Cloudinary question (Cloudinary wins). |
| 08/05/2026 | **Rules #15-#19 locked.** Complete-files-only, project-root cd, download for markdown/large files, api.whatsapp.com over wa.me, line counts via `(Get-Content).Count`. |
| 08/05/2026 | **Phase 17 — `/dashboard` cockpit shipped.** Commit `300daba`. 8 files, 5 sections (TodayActivityStrip, QuickActions, TasksStrip placeholder, ActiveProjectsList, RecentCommsFeed). Server-rendered, Hebrew RTL, real Supabase data. |
| 08/05/2026 | **Customer page back-link routes to /dashboard.** Commit `bb5e0c2`. Bug surfaced during Phase 17 production verification, fixed in same session per Rule #20. |
| 08/05/2026 | **Rule #20 locked.** Fix existing bugs before advancing to new features. |

## Reference files

Read these when relevant — don't load all of them up front.

- **`references/schema.sql`** — Full Supabase schema. Read when creating/altering the database.
- **`references/coding_conventions.md`** — TypeScript and Next.js conventions. Read before writing or modifying any code file.
- **`references/ai_image_pipeline.md`** — Nano Banana prompt-writing guide and JSON record schema. Read before generating prompts.
- **`references/architecture.md`** — Component architecture, data flow, RFQ form copy variants.
- **`assets/ARTIST_PHOTO_BRIEF.md`** — Hebrew photo brief for the artists (deliverable, send as-is).
- **`assets/ai_record_template.json`** — JSON template for one sink record.

## Working docs Avshi maintains in his repo

These live in the GitHub repo (`avshi2-maker/Sinks_ART`), not in the skill bundle. They evolve constantly.

- **`IDEAS_PARKING.md`** — Living parking lot for future feature ideas, organized by category. Status tags: `[ ]` todo, `[~]` in progress, `[x]` done, `[-]` dropped, `[?]` needs more thought. **Also contains the NORTH STAR vision section and the Architectural Rule** (cross-project binding rules for the broader Business Operating System). Read these sections before designing anything that touches media, multi-vertical workflows, or long-term architecture.
- **`STATUS.md`** — Daily session log, newest at the top. Each session has Goals / Done / Decisions / Open questions / Next session.

## Related demo files (separate from the main app)

- **`demos/legacy/`** — Phase E archive (Session 18 cont.). Ten single-file SinC-ART demos. Reference only; new work happens in `/sinc` React.
- **`marble_call_intake_30042026-v1.html`** — Original earlier version, kept as reference.

## Known pending items (always-current — Session 21)

### High-priority next phases (per IDEAS_PARKING roadmap)

- **Phase 17.5 — Real `tasks` table + CRUD flow.** Replace `TasksStrip.tsx` placeholder with live data. ~1 session.
- **Phase 18 — Top navigation bar across all internal pages.** Half a session.
- **Phase 19 — Customer page enhancements.** Filter tabs, quick-action button, inline status change, "Add note" form. ~1 session.
- **Phase 19.5 — Customer Media Library tab** at `/customers/[id]`. First implementation of the Architectural Rule's "unified library" promise. ~1-1.5 sessions.

### Standing items still open

- **5 more analyzers needed:** PdfAnalyzer, Mp4Analyzer (improve), YouTubeAnalyzer, InstagramAnalyzer, UrlAnalyzer. Each ~120-150 lines, follows current `CallProcessingFlow.tsx` reference. Must integrate Phase 15.5 / Session 17 patterns (Rule #11).
- **Real Supabase Auth migration** — Phase 20+. Currently anon RLS open for write.
- **SinC-ART model migration** — current `claude-sonnet-4-20250514` retires June 15, 2026. Bulk-replace to `claude-sonnet-4-6` across all `demos/legacy/sinc_art_call_intake_*.html` files BEFORE June 15.
- **ElevenLabs paid plan decision** (decision-overdue) — Starter $5/mo (30K credits ≈ 1 call/day) or Creator $22/mo (100K ≈ 3-4/day). Avshi has run ~10 pipeline tests this week.
- **Cleanup stale Vercel env vars:** `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (wrong name from earlier setup), `SUPABASE_SERVICE_ROLE_KEY` (not used).
- **Latent migrations** (deferred per Rule #20 with Avshi approval): rename `customer_communications.audio_url` → `media_url`, backfill old null `duration_seconds` rows, backfill whitespace in old customer names.

### Future verticals + content types (North Star — not started)

- **Phase 22-26 (planned, IDEAS_PARKING):** WhatsApp Business API integration, Email (Outlook+Gmail) integration, identity matching engine, in-app project knowledge layer (Claude + Supabase pgvector, NotebookLM-equivalent), governance/permissions framework.
- **Future verticals** (broader Business Operating System): flooring art, industrial flooring, chemical imports, JV opportunities. Each follows the same architectural pattern.
- **Future content types:** PDF intake, spreadsheet intake (Excel + CSV), quote PDF generator, document signing flow, voice memo intake.

## What "good" looks like

- Avshi can paste your output into a terminal, SQL editor, or file in Cursor with zero edits required
- Hebrew text reads naturally to a native speaker (not Google-translated)
- Every code block is complete — no `// ... rest of file ...`
- Every SQL change comes with a versioned filename
- Concept-image rules are followed without Avshi having to remind you
- The artist-approval gate is respected — never suggest publishing a `concept` row directly
- New analyzers integrate Phase 15.5 / Session 17 patterns (Rule #11) without Avshi having to remind you
- Operating rules #7–#20 are followed without Avshi having to invoke the magic phrase
- Bugs surfaced during testing get fixed in the same session, not deferred (Rule #20)
- North Star vision and Architectural Rule are consulted before any feature touching media or multi-vertical scope

## Operating rules — additions from Session 22 (Sunday 10/05/2026 + Monday 11/05/2026)

### Rule #21 — PowerShell here-strings strip JSX/HTML opening tags

When using PowerShell `@'...'@` here-strings to write `.tsx`, `.jsx`, or `.html` files, PowerShell sometimes silently strips opening tags like `<a`, `<div>`, `<form>`, `<img>`. The closing tags survive. Symptoms: file appears malformed, "Unexpected token" errors, JSX attributes look orphaned.

**Cost when missed:** Session 22 — 45 minutes lost on the CallBackButton step retrying the same broken pattern.

**Rule:** any new file containing JSX/HTML opening tags MUST use the download pattern:
1. Generate file via `create_file` tool
2. Present via `present_files` for download
3. User downloads to `C:\SinkS\Sinks_ART\` (their default download location)
4. One `Move-Item` to the correct subfolder
5. Verify with `Contains('<a')` and similar checks

**Small edits to existing files** via PowerShell `Replace()` are safe IF the edit doesn't write a new opening tag. Adding 2 lines, swapping a prop, removing a span — all safe. Writing a whole new `<form>` block — NOT safe, use download.

### Rule #22 — Next.js `'use server'` files can only export async functions

Files with the `'use server'` directive at the top can ONLY export async functions. Next.js silently strips non-function exports (constants, types, sync functions) at build time. Symptoms: `import { MY_CONST } from '@/server-file'` returns `undefined` at runtime, causing `TypeError: X.map is not a function` or similar.

**Cost when missed:** Session 22 — 20 minutes lost on Step 5 when `PROJECT_STATUSES` array exported from `projectMutations.ts` returned undefined in `ProjectStatusBadge.tsx`.

**Rule:** when designing a server-side mutations file:
- Server file (`'use server'`) — exports ONLY `async function` mutations
- Constants, types, validation arrays — go in the consuming client component OR in a separate plain `.ts` file
- If the constant is used by multiple consumers, create a dedicated non-server file like `src/lib/customers/projectConstants.ts`

### Rule #23 — Avshi's Cursor downloads land at `C:\SinkS\Sinks_ART\`

Avshi's Cursor environment defaults browser downloads to the project root, NOT the Windows `Downloads` folder. When directing `Move-Item` for a downloaded file, the source path is `.\filename.ext` (project root), not `$env:USERPROFILE\Downloads\filename.ext`.

**Rule:** for any download-pattern file delivery:
- Source: `.\filename.ext` (or just relative to current `cd`)
- Destination: `.\src\...\filename.ext`
- Skip the "check Downloads folder first" logic — it's wrong for Avshi's setup

### Rule #24 — Clarity markers for commands vs. chat

Avshi has confused chat output with commands multiple times across sessions, leading to harmless but annoying PowerShell errors. The visual mixing of code blocks and English explanation makes it easy to copy the wrong thing.

**Rule for all chat with Avshi:**
1. **Always prefix paste-targets with "📋 PASTE THIS IN TERMINAL X:"** — never let a code block appear without that marker
2. **Use single-line commit messages** — multi-paragraph commits are visually similar to chat and get mis-pasted
3. **Split long commands into 2-3 smaller blocks** rather than one wall — easier to review before pasting
4. **When echoing back terminal output for confirmation**, do not put it inside code blocks (use plain text)

### Rule #25 — Acknowledge and fix Avshi's environment recovery cycles

Avshi reports Claude's web UI clears the conversation multiple times per day, has done so for months. Causes are unclear (browser cache, extension conflict, context window limits, tab discarding). State recovery currently relies on:
- Git commits (durable, never lost — the most important state)
- IDEAS_PARKING.md (durable in repo)
- SKILL.md (durable in repo)
- `recent_chats` tool (recovers conversation context within the current Claude UI session)

**Rule:** ship commits early and often. Each step in a multi-step phase should commit independently when verified. If the conversation evaporates mid-feature, the last commit is the recovery point — and IDEAS_PARKING.md (updated at end of session) provides the strategic context. Never push 4+ hours of code as one commit at end of session.

### Rule #26 — Diagnose schema before proposing migrations

Session 22 morning: about to propose renaming `customer_communications.audio_url` to `media_url` based on the assumption that photo/video URLs were missing. A 90-min "schema fix" plan was on the table.

Real diagnostic (Supabase SQL queries) revealed: `media_analyses` table exists with `cloudinary_url` populated for all 15 photo/video/call rows, joined to `customer_communications` by `comm_id`. The "audio_url is misnamed" framing was wrong. The two-table architecture is correct; only the display layer needed updating to JOIN.

**Lesson:** before any schema migration or rename, run diagnostic queries:
- `SELECT count(*) FROM <table>` for all related tables
- `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = X`
- Sample 5-10 rows joining the suspected related tables
- Verify the data is genuinely missing, not just unrendered

The cost of an unnecessary migration is way higher than 10 minutes of SQL diagnostic queries.

### Rule #27 — Session 22 final scoreboard (Phase 19 Stage A + Stage B)

For continuity if the conversation evaporates: Phase 19 SHIPPED in full across two sessions.

**Stage A (Sunday 10/05/2026, commit `d1b4936`):**
- Renders media inline on customer page via `media_analyses` join
- 3 files: `types.ts` (added MediaAnalysisRow), `fetchCustomerPage.ts` (4th parallel query), `CommsTimeline.tsx` (renders `<img>`/`<video>`/`<audio>` per type)
- Verified live on production

**Stage B (Monday 11/05/2026, 5 commits):**
1. `b3e8d57` — Step 1: `/customers` index page (killed prod 404)
2. `5a7ffa1` — Step 2: CallBackButton in CustomerHeader (tap-to-dial + clipboard fallback)
3. `44244e7` — Step 3: Filter tabs on comms timeline (URL-driven `?type=`)
4. `c3fa7e4` — Step 4: AddNoteInlineForm (inline textarea + Server Action + revalidatePath)
5. `ebeeba0` — Step 5: Inline ProjectStatusBadge (clickable dropdown + Server Action + stamps workflow date columns)

**Files added/modified in Phase 19:**
- NEW: `src/lib/customers/fetchCustomersList.ts`, `commMutations.ts`, `projectMutations.ts`
- NEW: `src/components/customers/CustomersTable.tsx`, `CallBackButton.tsx`, `CommsFilterTabs.tsx`, `AddNoteInlineForm.tsx`, `ProjectStatusBadge.tsx`
- NEW: `src/app/(internal)/customers/page.tsx`
- MODIFIED: `src/app/(internal)/customers/[id]/page.tsx`, `CustomerHeader.tsx`, `CommsTimeline.tsx`, `ProjectsList.tsx`, `types.ts`, `fetchCustomerPage.ts`

**Next priority items (queued for next session):**
- Phase 27a Stage 2: Quote Engine server actions + UI (`/quotes/[id]`, print preview, WhatsApp send)
- Phase 17.5: wire `cancelTask` to UI ("ביטול" link on each task row — already coded, just not mounted)
- Phase 19.5: Dedup call audio between `customer_communications.audio_url` and `media_analyses.cloudinary_url` (or accept and document)
- Phase 21: Activate sinks gallery (blocked by Phase 27b Nano Banana approval flow)
- Phase 22: Cost components + sample data (prerequisite for Phase 23 quote calculation + Phase 27f.2 public form)
