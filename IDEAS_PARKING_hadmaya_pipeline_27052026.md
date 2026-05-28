# IDEAS_PARKING.md — Update (27/05/2026)

Paste this into the main `IDEAS_PARKING.md`, REPLACING/AUGMENTING the "🔗 BIG IDEA — Lead-to-Quote Pipeline" entry. This records the architecture decisions resolved on 27/05/2026 and scopes the immediate next build (the AI הדמיה prompt-builder).

**Captured:** 27/05/2026 (Session 30 — Google Ads launch-ready + Designer SEO + Video gallery)

---

## 🔗 LEAD-TO-QUOTE PIPELINE — DECISIONS RESOLVED + NEXT BUILD SCOPED

### Blocking question RESOLVED
- **One Supabase, shared** by the public site (marble-art.co.il) AND the back-office CRM. Confirmed by Avshi 27/05/2026.
- Consequence: NO sync job needed. The back office can read public intake (leads/customers + Cloudinary media) directly. Bridge 1 (sync) from the 22/05 plan is effectively already satisfied by shared DB — the work becomes "surface intake in the back office," not "copy between databases."

### Flow CONFIRMED (Avshi's chosen operating model — manual, reviewed)
```
Customer intake (WhatsApp/form) → shared Supabase  [already happening]
        ▼
Back-office CRM: open customer record (sketch + marble sample + dimensions + notes)
        ▼
App BUILDS optimized Nano Banana prompt   ← THE PIECE WE BUILD FIRST
        ▼
Avshi pastes prompt into Nano Banana → downloads render
        ▼
Avshi APPROVES (artist-approval gate intact — סקיצה badge rules still apply)
        ▼
Avshi sends render to customer WITH a price offer
        ▼
Price offer generated in CRM from xls (labor costs + marble per-m² costs)  ← SEPARATE LATER PHASE
```

Key decisions:
- **Manual, Avshi-reviewed** — NOT auto-generate, NOT auto-send. App's job is to produce a perfect ready-to-paste prompt + gather the inputs in one screen. Human runs the model and approves. (Protects artist-approval gate + brand quality.)
- **Price engine is a later, separate phase** — driven by an Excel of labor costs + marble per-square-meter costs. Do NOT bundle it into the prompt-builder build.
- The customer's uploaded sketch/bathroom photo SHOULD feed the prompt context (image-to-image is a stretch goal; start with text prompt that references the sketch dimensions + chosen marble).

### NEXT SESSION (Session 31) — BUILD PHASE 1: AI הדמיה Prompt-Builder
Scope (one focused session):
1. A back-office screen (on the customer/intake record) that pulls the intake data: dimensions (e.g. 98.5cm counter / 64cm cutout / drainage framework from the sketch), chosen marble sample, sink style picks, project notes.
2. Surfaces the **sketch image + marble sample image** side by side so Avshi has everything in one view.
3. Generates a **ready-to-paste Nano Banana prompt** from those fields, following the project's existing prompt conventions (references/ai_image_pipeline.md).
4. (Stretch) a "copy prompt" button + a place to paste back the Cloudinary URL of the approved render, linked to the customer record under marble-art/customer-renders/[customer_id]/.

BRING TO THE SESSION (needed before any code — lives in Sinks_ART repo, not the skill bundle):
- The Supabase **schema** (references/schema.sql) — exact intake/customer/media fields.
- One **example intake/customer record** (so the builder maps real field names).
- **references/ai_image_pipeline.md** — existing Nano Banana prompt-writing guide + JSON record schema.

Build rules reminder: lives in C:\SinkS\Sinks_ART (back office), multi-file TS/React, Hebrew RTL UI, complete files only, follow Rule #11 (ApiCostMeter + ExportFooter) if it becomes an analyzer-style report screen.

### Note on NotebookLM as a cross-session bridge (evaluated 27/05/2026)
- NotebookLM has **no public API**; there is no supported way to programmatically connect Claude (this chat) to a NotebookLM notebook, nor to have Claude read a private notebook via a shared link (auth-gated).
- Third-party "notebooklm-py"-style repos are unofficial browser-automation/reverse-engineered tools — fragile, may break on Google changes, possible ToS/account risk. Not recommended as project infrastructure.
- RELIABLE cross-session method stays: keep STATUS.md + IDEAS_PARKING.md as single source of truth in the repo; paste/attach them at the start of each new chat. NotebookLM remains useful as Avshi's own Q&A tool over these same docs — just not as a Claude bridge.
