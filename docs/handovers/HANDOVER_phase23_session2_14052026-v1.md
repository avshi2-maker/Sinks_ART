# HANDOVER — Marble Art Sinks → Phase 23 Session 2

**Date:** Thursday May 14, 2026 | End of Session 24
**Project:** Marble Art Sinks (`C:\SinkS\Sinks_ART\`)
**Last commit:** none from this session — schema work landed in Supabase, not git

---

## 🏷️ Tags for next chat (paste at start of new conversation)

> "I'm continuing the Marble Art Sinks project. Please read `SKILL.md` at `C:\SinkS\SKILL.md` and `IDEAS_PARKING.md` at `C:\SinkS\Sinks_ART\IDEAS_PARKING.md` before answering. Phase 23 Session 1 is shipped and verified. Today's session = Phase 23 Session 2 = build `/dashboard/marbles` desktop admin UI. Handover doc attached."

---

## 🎯 What was completed in Session 24 (today)

### 1. Nano Banana validation — 100/100 PASS
- Tested sketch (100×64 dual-pitch with double work surface) + 2 different marble samples (dark grey honed + dark with gold veining)
- Both renders kept sketch geometry faithfully and applied marble convincingly
- **Architectural insight unlocked:** sketch = structural primitive (stable), marble = swappable material layer. Decoupled composability is what makes everything downstream buildable.
- **Phase 23–26 plan confirmed:** 3 galleries (sketches/photos/marbles), forward flow (operator-picked sketch×marble), reverse flow (Lead Concept Analyzer with vision model)

### 2. Phase 23 Session 1 — Schema migration shipped
- File: `sql/migrations/phase23_schema_15052026-v1.sql`
- Extended `sinks.source_type` CHECK to include `'sketch'`
- Created 3 new tables: `marble_samples`, `marble_sample_photos`, `concept_renderings`
- 13 indexes live (verified)
- Triggers for `updated_at` on `marble_samples` and `concept_renderings`
- **Key pattern locked:** partial unique index `idx_marble_sample_photos_one_primary` enforces exactly-one-hero-photo per marble at the database level

### 3. Eli's Hebrew brief — shipped
- File: `assets/ELI_PHOTO_AND_MARBLE_BRIEF_15052026-v1.docx`
- 5 sections: finished sinks (gallery), **marble inventory protocol (NEW)**, workshop process, portraits, phone camera checklist
- Hebrew RTL, Arial, A4
- Avshi sends via WhatsApp as document attachment

### 4. Strategic direction locked
- Marble library is **dynamic** (admin CRUD, not static seed)
- Marble pricing in **₪/m²** (industry standard)
- Photos per marble: **0..N flexible** (junction table `marble_sample_photos`)
- Admin UI: **desktop-first** (Avshi adds marbles from WhatsApp photos at the laptop)
- Eli ships marble protocol: every new marble sourced → photo + supplier + price + slab size → WhatsApp to Avshi

---

## 📋 What was deferred (intentionally, with reasoning)

### Seed 10 sketches into `sinks` → moved to Phase 23.5

**Why deferred:** Sketch rows without images are functionless placeholders. They can't render in a gallery, can't be picked in the prompt generator, can't be sent to a lead. They need Eli's actual pencil drawings + Cloudinary uploads first.

**When to do it:** After Eli sends his first batch of sketch drawings (estimated 5–14 days). Estimated ~30 min of fresh seed SQL work once images exist.

**No parking-lot file created** — better to write fresh SQL when the actual `cloudinary_url` values exist than to leave a half-finished placeholder hanging in the repo.

### Sketch images storage table — NOT yet identified

Avshi pasted diagnostic outputs from `sinks` but never confirmed where sink images actually live (separate `sink_images` table? Cloudinary URL on `sinks` directly via column not yet inspected?). This blocker is **not relevant for Phase 23 Session 2** (marbles have their own `marble_sample_photos` table). Must be resolved before Phase 23.5 (seed sketches) or Phase 24 (Gemini API).

**Diagnostic queries to run when Phase 23.5 begins:**
```sql
-- 1. Find the sink-images table
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%sink%' OR table_name LIKE '%image%' OR table_name LIKE '%photo%' OR table_name LIKE '%media%')
ORDER BY table_name;

-- 2. Eli's artist_id
SELECT * FROM artists ORDER BY created_at;

-- 3. Sample existing 'concept' row to see real data patterns
SELECT * FROM sinks WHERE source_type = 'concept' LIMIT 1;
```

---

## 🎯 Phase 23 Session 2 scope (next chat — START HERE)

**Build the desktop-first Hebrew RTL admin UI at `/dashboard/marbles`.**

### Routes
- `/dashboard/marbles` — list view with filters
- `/dashboard/marbles/new` — add new marble form
- `/dashboard/marbles/[id]` — edit existing marble + manage photos

### List view requirements
- Hebrew RTL table
- Columns: primary photo thumb (64×64), `name_he`, `color_family` (badge), `finish`, `availability_status` (colored badge), `price_per_sqm_ils` (with ₪ symbol), `last_seen_date`, actions
- Filters: by `availability_status`, `color_family`, `finish`, archived toggle
- Search by `name_he` or `name_en`
- Sort: default by `availability_status` (in_stock first), secondary by `last_seen_date` DESC

### Add/Edit form requirements
- Hebrew labels
- All `marble_samples` columns covered
- `slug` auto-generated from `name_en` (kebab-case, validated unique)
- `availability_status` defaults to `in_stock`
- `last_seen_date` auto-set to today on create
- `price_updated_at` auto-set when `price_per_sqm_ils` changes
- Archive button (soft delete) — never hard delete

### Photo management requirements
- Inline on edit page (not modal — desktop has room)
- Drag-and-drop upload to Cloudinary using existing project pattern (preset, folder convention)
- Photo gallery shows all photos for this marble
- Per-photo: set as primary, change `photo_kind`, reorder, delete (with confirmation)
- Enforce: exactly one `is_primary=true` per marble (DB constraint already handles)

### Architecture (multi-file per Rule #7)
Estimated 6–8 TypeScript files, ~120–180 lines each. None exceed 1500 lines.

Suggested structure:
```
src/app/dashboard/marbles/
├─ page.tsx                  list view (Server Component + Client filter shell)
├─ layout.tsx                page chrome, breadcrumb
├─ new/page.tsx              add form route
├─ [id]/page.tsx             edit + photo management route
└─ fetchMarbles.ts           server-side queries (parallel pattern from /dashboard)

src/components/marbles/
├─ MarbleListTable.tsx       list view table
├─ MarbleFilters.tsx         filter bar (availability/color/finish)
├─ MarbleForm.tsx            shared add+edit form
├─ MarblePhotoUploader.tsx   Cloudinary upload + primary management
├─ MarblePhotoGrid.tsx       gallery of marble photos with controls
└─ AvailabilityBadge.tsx     colored badge component (reusable in public gallery later)

src/lib/marbles/
└─ marbleQueries.ts          all Supabase reads/writes for marbles
```

### What this UI does NOT need
- ❌ `ApiCostMeter` — no AI calls in admin CRUD
- ❌ `ExportFooter` — internal admin tool, no print/email/WhatsApp export
- ❌ Customer-facing UX polish — operator-only tool
- ❌ Mobile responsive — desktop-first per Q3 decision (Phase 23.6 can add mobile later)

### What this UI DOES need
- ✅ Full Hebrew RTL (project default)
- ✅ Hebrew labels everywhere ("שם בעברית", "ספק", "מחיר למ\"ר", "סטטוס זמינות", etc.)
- ✅ Soft delete with archive/restore (per "never delete" rule)
- ✅ Cloudinary upload using existing project pattern
- ✅ Real Supabase queries (anon RLS open for write, per current project state)
- ✅ Lead with the supplier + availability columns prominently — they're the moat

---

## 🔒 Operating rules that bit us this session — keep in mind

- **Rule #15 (no line edits):** I had to deliver complete files for everything. Held cleanly.
- **Rule #16 (cd first):** Every PowerShell block led with `cd C:\SinkS\Sinks_ART`. Hold.
- **Rule #17 (download for .md/.docx/.sql):** SQL and docx both delivered via `present_files`. Hold.
- **Rule #7 (1500-line ceiling):** Will be relevant in Session 2 — multi-file React mandatory.
- **Rule #20 (fix bugs before advancing):** No bugs surfaced this session. Clean.

---

## 🧠 Things to remember for next Claude

- **Avshi works copy-paste only** — never ask him to edit lines
- **Every PowerShell block leads with `cd C:\SinkS\Sinks_ART`**
- **Files via `present_files` download → `Move-Item`**, not here-string for .md/.docx/.sql or any file >10KB
- **Hebrew text quality bar is high** — Avshi is native, won't accept Google-translated UI strings
- **Avshi's correspondence in English, app UI in Hebrew** — strict
- **Desktop-first means desktop-first** — don't sneak in `sm:` Tailwind breakpoints "just in case"
- **The Sinks_ART Supabase project ID is still not surfaced in SKILL.md** — Avshi ran SQL successfully but never confirmed which project ID. If you need it, ask.
- **Anthropic API key + Cloudinary preset are in `.env.local`** — never ask to see them (Rule #12)
- **Multi-file React with `const`/`let`** — NOT his other-project `var`-only convention
- **Avshi is 72, triathlete, second-career developer** — sharp architect, copy-paste implementer, fatigues at end of long sessions
- **Claude Desktop app freezes daily** — short sessions, frequent commits, handover docs are the mitigation

---

## ❓ Open questions to resolve early in next session

1. **Has Eli received the WhatsApp brief?** Status check at start.
2. **Does Avshi want to seed `/dashboard/marbles` with 5 marbles he already knows about, or wait for Eli's photos?** Either works. UI must function with zero rows.
3. **Cloudinary preset name + folder convention for marble photos** — likely already exists in the project (`.env.local`), but worth confirming the folder convention (`/marbles/` vs `/marble-samples/` vs other)
4. **Existing `/dashboard` shows tasks/stats — should `/dashboard/marbles` add a tile to the dashboard summary?** Probably yes, with count of marbles by `availability_status`. Small UX win, 15 min of work.

---

## 📊 Where everything stands at end of Session 24

```
Phase 23 (Catalogs — data layer)
├─ Session 1 — Schema migration ............................. ✅ SHIPPED
│   ├─ Extend sinks.source_type ............................ ✅
│   ├─ Create marble_samples ................................ ✅
│   ├─ Create marble_sample_photos .......................... ✅
│   ├─ Create concept_renderings ............................ ✅
│   └─ Eli's Hebrew brief .................................... ✅ (in WhatsApp queue)
├─ Session 2 — /dashboard/marbles admin UI .................. ⏭️  NEXT (this handover)
└─ Session 3 (Phase 23.5) — Seed sketches .................... ⏸️  WAITING on Eli

Phase 24 (Forward flow — operator-driven rendering) .......... ⏸️  WAITING on Phase 23 complete
Phase 25 (Reverse flow — Lead Concept Analyzer) .............. ⏸️  WAITING on Phase 24
Phase 26 (Self-service customer configurator) ................ ⏸️  WAITING on Phase 25
```

**Eli's marble photos arrive → Avshi enters in `/dashboard/marbles` → marble library grows → Phase 24 ready to render.**

The critical path runs through Eli's phone now.

---

*End of handover. Next-Claude has full context. Ship the admin UI well.*
