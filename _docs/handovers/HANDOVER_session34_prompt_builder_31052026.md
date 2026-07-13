# HANDOVER — Session 34: Prompt Builder Build (Sinks_ART CRM)

**Generated:** 31/05/2026 — end of Session 33 chat (100-message limit reached)
**Next chat:** start by pasting this file + the current `STATUS.md` from Sinks_ART repo.
**Project:** `C:\SinkS\Sinks_ART` (back-office CRM, separate from marketing site).

---

## 1. WHERE WE LEFT OFF (one-paragraph context)

Saturday + Sunday morning we explored AI video generation: Veo failed (porcelain placeholder hallucination), Kling subscribed at ₪20/mo and partially failed (text-to-video produced abstract sculpture, not a triangle sink). Conclusion: **image-to-video is mandatory** — text alone can't hold custom slab-built geometry. The CTS-T35 right-triangle corner sink design (Saturday) is the test product. Sunday morning we audited the Sinks_ART CRM and confirmed Phase 19 is alive, with live Supabase data, 6 real customers, a working dashboard, and — critically — the `media_analysis` table already has all the fields the prompt-builder needs. We agreed on the build, Avshi went to the gym, we're starting fresh.

---

## 2. WHAT'S BEING BUILT (the spec)

A **Prompt Builder** inside the existing Sinks_ART CRM at `C:\SinkS\Sinks_ART` that:

- Takes 3 inputs: **sketch image + marble sample A (exterior) + marble sample B (interior basin)** + geometry fields (model name, shape, dimensions, setting, faucet type)
- Outputs TWO copy-paste-ready prompts: one for **Nano Banana** (Gemini 2.5 Flash Image — static still), one for **Kling 3.0** (image-to-video)
- Both prompts have the **validated construction-rule language** baked in (flat slabs, no curves, invisible seams, anti-porcelain guards, wall-mount logic)
- **Two modes:**
  - **Standalone:** `/prompt-builder` route, ad-hoc Instagram content generation, no DB save
  - **Per-customer:** `/customers/[id]/prompt-builder` route, pre-fills from that customer's existing `media_analysis` rows, saves generated prompts back to `media_analysis.ai_full_report.prompts` (JSONB, versioned)

**Why both modes:** standalone for high-volume Instagram fuel without customer context; per-customer for proper customer-record-linked deliverable preview.

---

## 3. THE BUILD — 10 FILES (8 NEW, 2 SURGICALLY MODIFIED)

### NEW FILES (in order to write)

| # | Path | Purpose | ~LOC |
|---|---|---|---|
| 1 | `src/lib/promptTemplates.ts` | Pure functions: `buildNanoBananaPrompt(inputs)` + `buildKlingPrompt(inputs)` + `buildKlingNegativePrompt()`. All construction-rule + invisible-seam + anti-porcelain language baked in. NO React, NO Supabase. Pure functions for testability. | ~150 |
| 2 | `src/lib/promptBuilderActions.ts` | Server Actions (`'use server'`). One function: `savePromptsToAnalysis(analysisId, prompts)` — writes to `media_analysis.ai_full_report.prompts` JSONB. Must export async functions only (Rule #22). | ~60 |
| 3 | `src/components/prompt-builder/MediaInputPanel.tsx` | Drag-drop UI for sketch + sample A + sample B. Also supports preloaded mode: takes `MediaAnalysis[]` and renders a picker UI to select 1 sketch + 2 samples from existing customer analyses. | ~200 |
| 4 | `src/components/prompt-builder/GeometryFields.tsx` | Hebrew RTL form: model name (text), shape selector (triangle/trapezoid/pentagon/custom), dimensions (text), setting (text), faucet type (radio: wall-tap / on-sink / none). Controlled component with `onChange` callback. | ~120 |
| 5 | `src/components/prompt-builder/PromptOutputCard.tsx` | Renders Nano Banana prompt + Kling prompt + Kling negative-prompt as 3 read-only textareas with **📋 Copy** buttons each. Also a **💾 Save to analysis** button (per-customer mode only). | ~140 |
| 6 | `src/components/prompt-builder/PromptBuilderShell.tsx` | Top-level orchestrator. Manages state (selected media + geometry fields). Calls `buildNanoBananaPrompt` / `buildKlingPrompt` on each state change (live preview). Wraps inputs + output in a 2-column desktop layout. Hebrew RTL. Includes `<ApiCostMeter />` and `<ExportFooter />` per Rule #11. | ~180 |
| 7 | `src/app/(internal)/prompt-builder/page.tsx` | Standalone route. Renders `<PromptBuilderShell mode="standalone" />`. Server component. | ~30 |
| 8 | `src/app/(internal)/customers/[id]/prompt-builder/page.tsx` | Per-customer route. Server component fetches the customer's `media_analysis` rows from Supabase server-side, passes them to `<PromptBuilderShell mode="per-customer" customerId={id} mediaAnalyses={rows} />`. | ~60 |

### MODIFIED FILES (surgical edits only)

| # | Path | What to change |
|---|---|---|
| 9 | `src/components/shared/TopNav.tsx` | Add 5th nav tab `הדמיה → /prompt-builder` after `לקוחות`. Match existing icon + style. |
| 10 | `src/app/(internal)/customers/[id]/page.tsx` | Add one launcher button **"📷 פתח Prompt Builder"** linking to `/customers/[id]/prompt-builder`. Place in the customer header section near other actions. |

---

## 4. PROMPT TEMPLATE LOGIC (THE HEART OF THE BUILD)

The two prompts use ALL of these validated rules (collected across Sessions 32–33):

### Universal construction rules (both prompts)
- Built ENTIRELY from FLAT polished stone slabs
- Joined at INVISIBLE seams using color-matched stone adhesive
- Hairline-thin (sub-millimeter), tinted to match surrounding veining
- NO curves, NO carved bowls, NO rounded edges
- Every visible face is a flat polygon

### Color mapping
- Sample A → exterior surfaces (outer panels, front face, top rim)
- Sample B → interior basin (basin walls + tilted floor)
- Materials meet cleanly at the rim

### Wall-mount logic (when applicable)
- WALL-MOUNTED, no vanity, no cabinet, no pedestal, no support beneath
- Two wall legs flush against corner walls (hidden from view)
- Faucet type:
  - `wall-tap`: tap projects from back wall, NEVER on sink
  - `on-sink`: faucet hole in rim
  - `none`: no faucet shown

### Anti-porcelain guards (Kling-specific, from Session 33 fail)
- Opening frame: EMPTY corner, NO existing sink, NO placeholder
- First objects to appear: FLAT POLISHED STONE SLAB PANELS
- Consolidated ABSOLUTE FORBIDS block at end

### Negative prompt (Kling separate field)
Should output as comma-separated single string:
`white porcelain, ceramic, round sink, oval sink, bowl-shaped, carved bowl, curved basin, rounded edges, vanity, cabinet, pedestal, support structure, faucet hole on sink (when wall-tap), multiple sinks, white grout, white sealant, white caulk, visible joints, tile grout, contrasting seams, people, hands, text, captions, watermark, audio, music, sound`

### Kling prompt length rule
Kling sweet spot is ~50-80 words. Keep the Kling prompt SHORT and visual — push detailed construction rules to the negative-prompt field.

### Nano Banana prompt length rule
Nano Banana handles long prompts fine (~150-200 words). Include full construction detail in the main prompt body.

---

## 5. DATA MODEL (already exists in `src/lib/supabase.ts`)

```typescript
interface MediaAnalysis {
  id: string;
  customer_id: string;
  project_id: string | null;
  media_type: 'photo' | 'sketch' | 'mp4' | 'pdf' | 'youtube' | 'instagram' | 'url';
  cloudinary_url: string | null;
  extracted_dimensions: string | null;
  extracted_stone_type: string | null;
  extracted_shape: string | null;
  design_intent_he: string | null;
  ai_full_report: Record<string, unknown> | null;  // ← target field
  api_cost_usd: number | null;
  status: 'uploaded' | 'analyzed' | 'approved' | 'rejected';
  // ... other fields
}
```

**Save format for prompts** (Server Action writes to `ai_full_report.prompts`):
```json
{
  "prompts": {
    "version": 1,
    "generated_at": "2026-05-31T12:34:56Z",
    "nano_banana_prompt": "You are given three reference images...",
    "kling_prompt": "Photorealistic cinematic shot of...",
    "kling_negative_prompt": "white porcelain, ceramic, round sink...",
    "inputs": {
      "model_name": "CTS-T35",
      "shape": "right-triangle",
      "dimensions": "35 × 35 cm legs, ~49.5 cm hypotenuse",
      "setting": "small toilet-room corner",
      "faucet_type": "wall-tap"
    }
  }
}
```

This preserves prior versions if regenerated (increment `version`, store array).

---

## 6. ENVIRONMENT (already verified working)

- **Stack:** Next 16.2.4 + React 19.2.4
- **Node:** v24.11.1, npm 11.6.2
- **Working dir:** `C:\SinkS\Sinks_ART`
- **Branch:** `main`, clean (after deleting `30051103files.zip` — that was the last housekeeping item)
- **Dev:** `npm run dev` → boots in ~10s on `localhost:3000`
- **`.env.local` keys present:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_PRESET_CALLS`, `NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL_ID`, `NEXT_PUBLIC_WA_NUMBER`

---

## 7. EXISTING REUSABLE COMPONENTS (DO NOT REBUILD — IMPORT THESE)

Located in `src/components/shared/`:
- `ApiCostMeter.tsx` (5.1KB) — Rule #11 component, live API token+cost meter. Import and place at top of `PromptBuilderShell`.
- `ExportFooter.tsx` (5.0KB) — Rule #11 component, Print / Outlook / Gmail / WhatsApp / Save action bar. Import and place at bottom of `PromptBuilderShell`.
- `TopNav.tsx` (2.5KB) — top navigation. Modify to add 5th tab.
- `TopNavLink.tsx` (1.1KB) — used by TopNav.

---

## 8. STEP-BY-STEP TASK LIST FOR NEXT CHAT

### Phase 1: Confirm clean start (2 min)
```powershell
cd C:\SinkS\Sinks_ART
git status --short        # should be empty (clean tree)
git log --oneline -5      # confirm latest commit is "STATUS: Session 33 addendum..."
```

### Phase 2: Write files in this order (each as complete file, per Rule #2)
Write file by file, asking Avshi to confirm each one is dropped in before delivering the next. Order matters because of dependencies:

1. **`src/lib/promptTemplates.ts`** (pure functions, no React) — Avshi drops in, can test by importing in browser console if needed
2. **`src/lib/promptBuilderActions.ts`** (Server Action, isolated)
3. **`src/components/prompt-builder/GeometryFields.tsx`** (simple controlled form, no deps on other new files)
4. **`src/components/prompt-builder/MediaInputPanel.tsx`** (handles both modes — drag-drop + preloaded picker)
5. **`src/components/prompt-builder/PromptOutputCard.tsx`** (imports nothing from new files — receives prompts as props)
6. **`src/components/prompt-builder/PromptBuilderShell.tsx`** (orchestrator — imports #1, #3, #4, #5 + shared)
7. **`src/app/(internal)/prompt-builder/page.tsx`** (standalone route — imports #6)
8. **`src/app/(internal)/customers/[id]/prompt-builder/page.tsx`** (per-customer route — imports #6 + Supabase server fetch)
9. **Surgical edit to `src/components/shared/TopNav.tsx`** — `Select-String -Path` first to find the existing nav-tabs array, then surgical replace to add 5th tab
10. **Surgical edit to `src/app/(internal)/customers/[id]/page.tsx`** — `Select-String -Path` first to find a good insertion point near other action buttons, surgical insert

After each file: Avshi confirms it dropped cleanly, dev server hot-reloads, no console errors. Then proceed to next.

### Phase 3: Smoke test on localhost (10 min)
- Open `localhost:3000/prompt-builder` (top-nav button) — drag in CTS-T35 sketch + 2 marble samples → verify prompts generate live
- Open a customer detail → click "פתח Prompt Builder" → verify per-customer route loads with that customer's `media_analysis` rows pre-loaded
- Copy a generated Nano Banana prompt → paste in Gemini → verify it generates a valid sink still
- Copy generated Kling prompt + negative → paste in Kling → use the generated still as start frame → verify image-to-video works
- If Kling still hallucinates: tweak `promptTemplates.ts` (single file, easy iteration)

### Phase 4: Vercel deployment (15 min)
1. Avshi opens `vercel.com` (already logged in via GitHub from sinks-bathroom-design)
2. **Add New → Project → Import `Sinks_ART`** from `avshi2-maker` repos
3. Framework: Next.js (auto-detected)
4. **Environment Variables — copy ALL keys from `.env.local`:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, no NEXT_PUBLIC_ prefix)
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_PRESET_CALLS`
   - `NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE`
   - `ANTHROPIC_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_MODEL_ID`
   - `NEXT_PUBLIC_WA_NUMBER`
5. Deploy. First build takes 2-3 min.
6. Vercel URL: `sinks-art-xyz.vercel.app` (or similar)
7. **Optional:** custom subdomain `crm.marble-art.co.il` via LiveDNS A record (same pattern as main site)

### Phase 5: Commit + STATUS update (10 min)
```powershell
cd C:\SinkS\Sinks_ART
git status --short        # should show: 8 A (new), 2 M (modified)
git add -A
git commit -m "CRM: prompt-builder route (standalone + per-customer) with Nano Banana + Kling generators"
git push
```

Then update `STATUS.md` with a new Session 34 entry covering: files shipped, smoke test results, Vercel deployment URL, any prompt template tweaks made during testing.

---

## 9. CRITICAL CONSTRAINTS (NEVER VIOLATE)

- **Rule #2:** Complete files only via PowerShell `[System.IO.File]::WriteAllText` with UTF8Encoding(false). NO browser downloads (last sessions confirmed this is unreliable). NO partial edits except via documented surgical `-replace` pattern.
- **Rule #11:** Every AI report page MUST include `<ApiCostMeter />` + `<ExportFooter />`. Both already exist in `src/components/shared/`. Import them.
- **Rule #22:** Server Action files (`'use server'`) MUST export async functions only.
- **Rule #25 (NEW from Session 33):** Before ANY text-replace on an existing file, run `Select-String -Path ".\src\**\*.tsx" -Pattern "EXACT_PHRASE" -List` to confirm WHICH file actually renders the visible text on the screen being tested. Saves multiple iterations.
- **Hebrew RTL UI everywhere.** Match existing Sinks_ART styling (visible in current `/dashboard` + `/customers` screens — clean white cards, Hebrew text, simple icons).
- **NO new Supabase tables.** `media_analysis.ai_full_report` JSONB is the home for generated prompts.
- **Multi-file React/TS under `src/`.** ~100-200 lines per file. NO single-file HTML for this build — it lives inside Sinks_ART CRM properly.
- **One terminal command at a time during debugging.**
- **Single-line commit messages.**
- **File naming for dated docs:** `filename_DDMMYYYY.ext`.

---

## 10. OPEN ITEMS CARRIED FORWARD (NOT BLOCKING TODAY)

- **Designer-page prose paragraph** in marketing site: still names "אלס ורוסלן". Avshi waiting for Ales OK on Option A (strengthen credentials with "מעל 20 שנות ניסיון..." rather than remove names). Apply when Ales approves. NOT today's project.
- **Veo v2 anti-porcelain prompt** — pending re-test (probably never, since Kling won). Document as deprecated in `ai_prompts_corner_sink.md` if confirmed abandoned.
- **Gallery limits change to 50** — already committed Saturday (`sinks-bathroom-design` repo). Avshi to keep monitoring as Cloudinary fills up.
- **ARVO icon** in Google Ads Asset Library — still not ASSIGNED as Business logo. Tiny manual step in Google Ads UI, not code.
- **`lead_form_click`** still not a GA4 key event. Low priority — `whatsapp_click` is the live conversion path.
- **Bidding switch** from Maximize clicks → Maximize conversions on Contacts: pending ~15-30 `whatsapp_click` conversions accumulated. Multi-week timeline.

---

## 11. SUCCESS CRITERIA FOR SESSION 34

✅ All 10 files written and dropped cleanly into the repo
✅ Dev server boots clean, no console errors
✅ Both routes (`/prompt-builder` standalone + `/customers/[id]/prompt-builder` per-customer) render correctly
✅ Prompt generation works live (typing in fields updates output preview)
✅ Copy-to-clipboard works
✅ Save-to-Supabase works (per-customer mode writes `ai_full_report.prompts`)
✅ One real end-to-end test: CTS-T35 sketch + 2 samples → Nano Banana → still → Kling (image-to-video) → finished video
✅ Vercel project #2 (`Sinks_ART`) live with proper env vars
✅ Commit pushed, STATUS.md updated with Session 34 entry

---

## 12. FILES TO ATTACH WHEN STARTING NEXT CHAT

1. This handover: `HANDOVER_session34_prompt_builder_31052026.md`
2. Current STATUS.md (from Sinks_ART repo)
3. Current `src/lib/supabase.ts` (so types are visible without re-running audit)
4. `references/ai_prompts_corner_sink.md` if Avshi wants the validated prompt language as reference (technically the new chat will rebuild this logic in `promptTemplates.ts` from scratch using this handover as spec, but having the ref doc nearby helps cross-check)

---

## 13. ANTICIPATED QUESTIONS / GOTCHAS

**Q: Why save to `ai_full_report` instead of a new `generated_prompts` table?**
A: The existing `media_analysis` row already represents "this customer's sketch/sample/photo and its analysis." Generated prompts are PART of that analysis — they're how the analysis becomes actionable. Keeping them in the same row avoids a JOIN, keeps the data model clean, and the JSONB structure is flexible enough to evolve without migrations.

**Q: What if the user wants to regenerate prompts later?**
A: Increment `version` in the saved JSON. Optionally store an array of versions. Display "Last generated: [timestamp]" in UI.

**Q: Do we need authentication?**
A: NOT for Session 34. The CRM has no auth wrapper today (it's local-network back-office). If Vercel deployment exposes it publicly, that's a separate problem for a future session. Note in STATUS as a security followup item.

**Q: Standalone mode — where do uploaded images go?**
A: In-memory only. They're displayed via `URL.createObjectURL()` in the browser, never uploaded anywhere. The user copy-pastes the prompt and uploads images directly to Gemini/Kling themselves. This is by design — standalone mode is for fast ad-hoc work, not asset management.

**Q: Per-customer mode — do we need to handle the case where customer has zero media_analyses?**
A: Yes. UI should show "No media uploaded yet for this customer. Use the intake flow first, or switch to standalone mode" with a link to standalone.

---

End of handover. Next chat: paste this + STATUS.md, start by saying "Ready to build Session 34 — confirmed all 10 files per handover, starting with promptTemplates.ts." 🎯
