---
name: marble-art-sinks
description: Project context for Avshi Sapir's Marble Art Sinks website — an artisan portfolio promoting two Israeli marble sink artists, built as a Next.js + Supabase + Cloudinary + Vercel application with Hebrew RTL UI. Use this skill whenever Avshi mentions marble sinks, the marble project, the sinks site, the artist portfolio, AI sink concepts, Nano Banana sink prompts, the RFQ form for sinks, the marble Supabase database, or any feature work on this Hebrew RTL site. Use this skill even for small requests (one component, a CSS tweak, one new sink record, debugging) — project context (stack, conventions, schema, AI image policy, artist-approval gate) is needed to respond correctly. Also use when Avshi shares a reference image and wants a Nano Banana prompt + JSON record, or reviews AI concept images. Do NOT apply Avshi's other-project conventions (var-only JS, sbQ wrapper, single-file HTML) here — this project uses modern TypeScript and proper folder structure.
---

# Marble Art Sinks

## What this project is

A bilingual artisan portfolio website promoting two Israeli marble sink artists. Visitors browse a catalog of handmade sinks, pick one (or several), and submit an RFQ (Request for Quote) which lands in Avshi's WhatsApp with all attached media — drawings, photos of the install space, voice notes, MP4 walkthroughs.

Built properly: real Git workflow, terminal-driven, multi-file Next.js, deployed on Vercel. **Not** another single-file HTML build like Avshi's other projects.

## Who's involved

- **Avshi Sapir** — the developer building it (copy-paste workflow, architects in chat, runs commands in terminal)
- **Two marble sink artists** — produce the actual handmade sinks; provide phone photos and approve AI concept images
- **Hebrew-speaking customers in Israel** — the audience; browse the gallery, send RFQs from their phones

## Tech stack — locked in

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | TypeScript strict mode |
| Styling | Tailwind CSS + RTL plugin | Hebrew-first |
| UI primitives | shadcn/ui | Copy-into-project components |
| Database | Supabase | Postgres + RLS + Storage if needed |
| Media uploads | Cloudinary | Unsigned upload preset, browser → Cloudinary direct |
| RFQ delivery | `wa.me` deep-link | Pre-filled summary + Cloudinary URLs |
| Hosting | Vercel | Free tier to start, Vercel subdomain |
| Repo | GitHub | New account dedicated to this client |
| AI image generation | Nano Banana (Gemini 2.5 Flash Image) | Avshi runs the model, Claude writes the prompts |

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
- Filenames include `DDMMYYYY-vN` where it makes sense (deliverable docs, schema files, exported reports)
- A `VERSION` constant lives in `lib/version.ts` and renders in the site footer
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
4. **Always provide complete files**, not snippets that require Avshi to splice into existing code.
5. **One concern per response** — don't pile six features into a single message.
6. **Avshi works copy-paste** — give him the whole file or the whole SQL block, not "add this line here."
7. **NEVER default to single-file HTML for new features in this project.** This project is multi-file Next.js + TypeScript with code organized under `src/`. Each file should stay roughly 100–200 lines. Single-file HTML is allowed ONLY for: (a) the existing SinC-ART demos at `demos/sinc_art_call_intake_*.html`, or (b) a one-off prototype that Avshi explicitly names as such. If a new feature would push any single file beyond ~1,500 lines, STOP and propose a multi-file split BEFORE writing code. Avshi has demanded this rule explicitly and repeatedly — do not exploit his non-coder status by defaulting to "fastest" single-file builds.
8. **During debugging, send DevTools console commands one at a time** so Avshi can paste, run, and report back the output. He uses them to diagnose — they are useful, not overwhelming. Pace them: one command, wait for result, then the next. Never dump multiple commands in one message.

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

## Project structure (target)

```
marble-sinks/
├─ app/
│  ├─ page.tsx                    homepage (hero + featured)
│  ├─ gallery/page.tsx            full catalog with filters
│  ├─ sink/[slug]/page.tsx        single product page
│  ├─ rfq/page.tsx                multi-step RFQ form
│  ├─ artists/page.tsx            artist bios
│  └─ layout.tsx                  RTL, fonts, header/footer
├─ components/
│  ├─ Header.tsx
│  ├─ SinkCard.tsx
│  ├─ SinkGallery.tsx
│  ├─ RfqWizard.tsx               4 steps
│  ├─ MediaUploader.tsx           Cloudinary widget wrapper
│  └─ SourceTypeBadge.tsx         Renders סקיצה / יצירה מקורית / השראה
├─ lib/
│  ├─ supabase.ts
│  ├─ cloudinary.ts
│  ├─ whatsapp.ts                 Builds the wa.me link + summary
│  └─ version.ts                  VERSION constant, DDMMYYYY-vN
├─ public/
├─ supabase/
│  └─ schema_DDMMYYYY-vN.sql      Versioned schema dumps
├─ .env.local                     Gitignored
├─ tailwind.config.ts
├─ next.config.ts
└─ package.json
```

## Database

Full schema lives in `references/schema.sql`. Run that file in the Supabase SQL Editor when initializing or when adding columns. Always version the schema file with `DDMMYYYY-vN` and commit it to the repo.

Key tables:
- `artists` — the two makers (id, name_he, bio_he, portrait_url, instagram, whatsapp)
- `sinks` — catalog rows (id, slug, artist_id, name_he, description_he, shape, stone_type, dimensions, price_band, source_type, ai_prompt, ai_model, source_reference, approved_by_artist, is_published)
- `sink_images` — multiple images per sink (id, sink_id, cloudinary_url, alt_he, sort_order, is_primary)
- `rfq_requests` — incoming leads (id, customer_name, phone, city, sink_id, requested_dimensions, drawings_jsonb, audio_url, video_url, photo_urls, notes, status, created_at)
- `customers` — CRM customer master (id, name_he, phone, email, source, is_active, ...) — added Session 13
- `projects` — per-customer project pipeline (id, customer_id, artist_id, title_he, status, notes, dates, prices, ...) — added Session 13. `status` is Hebrew text, default `'ליד'`, CHECK constraint whitelists 8 values: `ליד`, `שיחת בירור`, `הצעת מחיר נשלחה`, `אושר`, `שולמה מקדמה`, `תשלום מלא`, `הסתיים`, `אבוד`
- `customer_communications` — every inbound/outbound interaction with a customer (id, customer_id, project_id, comm_type, audio_url, transcript, duration_seconds, ai_analysis jsonb, subject, body, api_cost_usd, occurred_at, created_at) — added Session 13. Holds calls, and will hold emails/WhatsApp/photos/PDFs/YouTube as Phase 15 brings more `comm_type` values

RLS policies: anyone can `SELECT` from `sinks` where `is_published = true AND approved_by_artist = true`. Anyone can `INSERT` into `rfq_requests`. Currently anon can also `SELECT`/`INSERT` on `customers`/`projects`/`customer_communications` (added Session 13 to enable SinC-ART demo). Real Supabase Auth migration is parked for Session 16+. Only authenticated users (Avshi) can write to `sinks` / `sink_images` / `artists`.

## Project identifiers (live)

These are the real, live identifiers for this project. Reference them when generating connection strings, env files, or URLs.

| Service | Identifier | Notes |
|---|---|---|
| GitHub repo | `avshi2-maker/Sinks_ART` | https://github.com/avshi2-maker/Sinks_ART |
| Vercel project | `Sinks_Art` | Under org "Avshi Sapir -Projects 2025-2026" (PRO plan) |
| Vercel branch | `main` | PRODUCTION environment |
| Production URL | `https://sinks-art.vercel.app` | Auto-deploys on every push to `main`. Public site only — SinC-ART is local-only. |
| Supabase project ref | `givcxgzhfoetujhrjgvc` | URL: https://givcxgzhfoetujhrjgvc.supabase.co |
| Supabase region | (set at project creation) | Verify in Supabase dashboard |
| Cloudinary cloud_name | TBD | Pending — not yet provided |
| WhatsApp number | TBD | Pending — needed for `wa.me` deep link |

When generating env files (`.env.local`), use:

```
NEXT_PUBLIC_SUPABASE_URL=https://givcxgzhfoetujhrjgvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # from Supabase dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY=...            # server-side only, NEVER commit
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=TBD
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=marble_rfq
NEXT_PUBLIC_WA_NUMBER=TBD
```

## Account setup checklist (historical reference)

These were created during setup. Kept here for reference and for restoring/recreating accounts if needed.

1. **GitHub** — used existing `avshi2-maker` account (not a new client-dedicated one)
2. **Vercel** — signed in with GitHub, created `Sinks_Art` project
3. **Supabase** — project created, ref `givcxgzhfoetujhrjgvc`
4. **Cloudinary** — pending: create free account + unsigned upload preset named `marble_rfq`

## Decision log

Append-only. Update with date + brief note when major calls are made.

| Date | Decision |
|---|---|
| 29/04/2026 | Tech stack locked: Next.js + Supabase + Cloudinary + Vercel + wa.me handoff |
| 29/04/2026 | New GitHub account for client, Vercel subdomain to start (no custom domain yet) |
| 29/04/2026 | AI concept images allowed, ALWAYS labeled `סקיצה`, gated by `approved_by_artist` flag |
| 29/04/2026 | Pinterest images forbidden in production; usable only as concept-prompt inspiration |
| 29/04/2026 | Photo brief delivered to the two artists in Hebrew (`assets/ARTIST_PHOTO_BRIEF.md`) |
| 30/04/2026 | Call intake demo built (`marble_call_intake_30042026-v1.html`) — sink-artist context, speaker editing, design brief extraction, render-session handoff button |
| 30/04/2026 | Working docs added: `IDEAS_PARKING.md` (future ideas), `STATUS.md` (daily session log) |
| 30/04/2026 | **Amendment to 29/04 decision**: GitHub repo created at existing `avshi2-maker` account (not a new dedicated one). Repo: `Sinks_ART` |
| 30/04/2026 | Vercel project `Sinks_Art` provisioned under "Avshi Sapir -Projects 2025-2026" org, PRO plan, deployed from `main` branch |
| 30/04/2026 | Supabase project ref locked: `givcxgzhfoetujhrjgvc` |
| 03/05/2026 | Customer CRM live: `customers`, `projects`, `customer_communications` tables added. SinC-ART (call intake) wired end-to-end through v11 — auto-create project, 8-stage Hebrew status pipeline, project notes, editable speaker bubbles, ElevenLabs hallucination auto-strip |
| 03/05/2026 | **Architecture rule locked**: Phase 15+ media-intake features build as multi-file React components inside `src/`, NOT as more single-file HTML demos. SinC-ART v11 (~2,329 lines) is at the upper limit of what a single file should ever hold |

## Reference files

Read these when relevant — don't load all of them up front.

- **`references/schema.sql`** — Full Supabase schema, ready to paste into the SQL Editor. Read when creating/altering the database.
- **`references/coding_conventions.md`** — TypeScript and Next.js conventions specific to this project. Read before writing or modifying any code file.
- **`references/ai_image_pipeline.md`** — Step-by-step Nano Banana prompt-writing guide and JSON record schema. Read before generating prompts from reference images.
- **`references/architecture.md`** — Component-level architecture, data flow, RFQ form copy variants. Read for feature design discussions.
- **`assets/ARTIST_PHOTO_BRIEF.md`** — Hebrew photo brief for the artists (deliverable, send as-is).
- **`assets/ai_record_template.json`** — JSON template for one sink record. Use as starting point when emitting AI image records.

## Working docs Avshi maintains in his repo

These live in the GitHub repo (`avshi2-maker/Sinks_ART`), not in the skill bundle. They evolve constantly. When Avshi mentions them, he'll usually paste the relevant content into the chat.

- **`IDEAS_PARKING.md`** — Living parking lot for future feature ideas, organized by category (Catalog, Customer Interaction, AI Image Generation, Pricing, Mobile, Artist Workflow, Backend, Marketing, Legal). Status tags: `[ ]` todo, `[~]` in progress, `[x]` done, `[-]` dropped, `[?]` needs more thought. When an idea graduates to active work, it moves into `STATUS.md`.
- **`STATUS.md`** — Daily session log, newest at the top. Each session has Goals / Done / Decisions / Open questions / Next session. After every meaningful work session, Avshi appends a new entry. When starting a session, ask Avshi if he wants to see/update `STATUS.md` so the session has a clean handoff.

## SinC-ART demo (the one tool Avshi runs locally)

- **SinC-ART** — Single-file HTML demo for capturing customer phone calls and turning them into structured CRM records. Lives at `demos/sinc_art_call_intake_DDMMYYYY-vN.html` in the `Sinks_ART` repo, but **runs only from Avshi's local hard drive** (`C:\SinkS\demos\`) — it's NOT served from the public Vercel site. The flow: ElevenLabs transcription with diarization → auto-strip hallucinated speaker prefixes → editable speaker turns with preset+custom labels → Claude Sonnet analysis → save to Supabase `customer_communications` linked to `customers`/`projects` → 8-stage Hebrew status pipeline → WhatsApp/Email/Print actions. Current version (03/05/2026): `demos/sinc_art_call_intake_03052026-v11.html` (~2,329 lines). **This is at the upper limit of what a single file should ever hold.** Phase 15+ features (multi-format media intake: YouTube, Instagram, photos, MP4, PDF, sketches) MUST be built as multi-file React components inside `src/`, NOT bolted onto SinC-ART. Bug fixes and small tweaks to SinC-ART itself stay in single-file HTML; version bumps go: `sinc_art_call_intake_DDMMYYYY-vN.html`. The eventual plan is to migrate SinC-ART into the Next.js app under `src/app/intake/` behind Supabase Auth — parked as Session 16+ work.

## What "good" looks like

- Avshi can paste your output into a terminal, SQL editor, or file in Cursor with zero edits required
- Hebrew text reads naturally to a native speaker (not Google-translated)
- Every code block is complete — no `// ... rest of file ...`
- Every SQL change comes with a versioned filename
- Concept-image rules are followed without Avshi having to remind you
- The artist-approval gate is respected — never suggest publishing a `concept` row directly
- New features default to multi-file React under `src/`, never bolted into single-file HTML
