
---
## ADDED 08/06/2026 — OPTIONS CATALOG / PRICE BOOK (scope builder)

The public-site "build full stone room" catalog (5 chapters: אבזור ומתקנים,
ברזים, תאורה, הרחבות אבן, גימור) becomes a two-sided CRM tool:
  → Customer: send the option menu in correspondence, they pick (scope lock, no web form needed)
  → Ales (parallel): each pick = "same price or new price?" question

DECIDED: FIXED catalog with SET prices = reusable PRICE BOOK.
Table: options_catalog (chapter, name_he, ales_cost, customer_price, active).
Shared source of truth with the public marketing site.

Snaps into existing spine:
  - picked option -> quote_lines (cost + price already known)
  - "ask Ales" -> 🔨 אלס correspondence ; "customer picks" -> 💬 לקוח correspondence
  - margin per option visible automatically -> feeds ROI dashboard

DEPENDENCY ORDER:
  1. mini calculator (in flight)
  2. sent-tracking (in flight)
  3. options catalog / price book  <-- THIS (build before/with the sorter)
  4. correspondence sorter
  5. site model (hotel)
  6. ROI dashboard

---
## SESSION END 08/06/2026 — where we are

SHIPPED TODAY (all committed + deployed):
- Customer add/archive, dashboard archived-customer filter, add-project form
- Quick Quote engine: Ales cost + margin, mini calculator, sent-tracking
- Correspondence: party-tagged notes (לקוח/אלס), multi-batch WhatsApp capture, note delete
- Options catalog / PRICE BOOK (/options) + nav link — 12 items, cost/price/margin/remark, editable
- Options picker in Quick Quote + transparent upsell MENU WhatsApp message
- AI Correspondence SORTER (paste blob → bucket+party → review&approve → timeline)
- AI Draft Offer BUILDER (pull saved 💰/🎨 + paste → extract item/price/remark → save draft quote)
- Quotes VIEWER: /quotes list (filter by status) + /quotes/[id] view (friendly⇄itemized toggle, copy, WhatsApp)

NEXT SESSION — DECIDE: quote editor for completing drafts
  Option A: "➕ add options from price book" button on a draft (safer, daily-useful)
  Option B: full editor on /quotes/[id] (edit/delete lines, re-save) — needed for hotel
  Leaning A first, B when hotel needs it.

STILL PARKED (big builds):
- SITE model (hotel = parent holding projects, contacts, visit report, tasks) — do with real site-visit notes
- ROI dashboard (win rate, margin, avg markup, ₪ in pipeline)

Prices to fill: /options items still mostly ₪0 — get Ales''s numbers in.

---
## STANDING RULE (added 09/06/2026)
ALWAYS add a delete option (🗑️ with confirm) to every report/list line across
all pages — quotes, sites, customers, contacts, tasks, etc. Every list row the
user sees should be deletable. Use the established pattern: a small client
DeleteButton component + a server action that removes the row (and children if
any) + anon DELETE policy confirmed before building.

---
## STANDING RULE (added 09/06/2026) — INTAKE ⇒ REPORT
Every intake form MUST ship with a matching report: a list/report screen that
lets the user VIEW, EDIT, and DELETE each record. Never build a form whose data
can only be entered but not reviewed/edited/removed. Pairs with the delete-on-
every-line rule. Applies to: contacts, projects, sites, visits, quotes, etc.

---
## SESSION END 09/06/2026 — where we are
SHIPPED (all committed + deployed):
- Site model: sites/contacts/tasks/visits tables + list + detail page (roll-up, stats)
- Unified ContactForm + IL phone validation (green-on-valid) + profession column
- Customer: create + EDIT (editable header) via shared form
- Site-contacts: create + edit + delete via shared form
- Richer project form: stone/dimensions/description + SITE LINK (proven: project rolls up under hotel)

NEXT SESSION — FERRARI FINAL PIECE: media-attach
  - media_analyses already has project_id column (no schema change)
  - build: list a customer's media assets (sketches/photos) + attach/detach to a project (set project_id)
  - pairs with AI הדמיה builder (plan item 3)

STILL ON THE PLAN (order 2>4>3>1):
  2. ✅ Site model (DONE) + intake forms (DONE) — media-attach is the last sub-piece
  4. Public intake → CRM lead flow (RFQ + Instagram DMs → customers/projects)
  3. AI הדמיה prompt-builder (uses media assets)
  1. ROI dashboard (last)

STANDING RULES now active: delete on every list line; every intake gets view/edit/delete report.
TODO: reconcile project status vocabulary (updateProjectStatus vs createProject lists differ).

---
## SESSION REPORT 09/06/2026 (afternoon) — CUSTOMER 360 COMPLETE
SHIPPED THIS SESSION (all committed + deployed):
- Unified ContactForm + IL phone validation (green-on-valid) + profession column
- Customer create + EDIT (editable header); site-contacts create + edit + delete
- Richer project form (stone/dimensions/description + SITE LINK) — proven roll-up under hotel
- Media board: attach/detach media_analyses assets to projects (proven: "ales sink 0706.ogg")
- CALLS FIX: saveCallFull now writes transcript to customer_communications.transcript column
  (was only saving ai_analysis + audio; transcript was lost). New calls now persist full text.

CUSTOMER-360 STATUS = essentially COMPLETE. Clicking a customer shows:
  GREEN (done): details (view/edit/delete), projects (+site link), quotes (build/edit/send),
    correspondence (log + AI sorter), CALLS (audio + transcript + AI analysis), MEDIA (attach to project)
  GRAY (nice-to-have, not built): unified activity log/history timeline

NEXT SESSION — pick one:
  A. BACKFILL: 14 old calls have transcript=null but text survives in
     media_analyses.ai_full_report.raw_transcript_text (jsonb). One SQL UPDATE to copy it across.
  B. PLAN ITEM 4: Public intake -> CRM lead flow (RFQ form + Instagram DMs -> customers/projects)
  C. PLAN ITEM 3: AI הדמיה prompt-builder (uses media assets)
  D. PLAN ITEM 1 (last): ROI dashboard

KEY FACTS LEARNED:
  - customer_communications cols: transcript, ai_analysis(jsonb), body, subject, audio_url, duration_seconds, project_id
  - SinC save path = src/lib/sinc/supabaseSinc.ts (saveCallFull). media_analyses gets parallel row.
  - media_analyses already has project_id (attach = set it). .ogg/.mp3 thumbnails show broken (audio, expected).
  - SinC "link to customer/project" button: shows "next update" alert but DOES save + offers פתח עמוד לקוח.

STANDING RULES active: delete on every list line; every intake gets view/edit/delete report.
TODO: reconcile project status vocab (updateProjectStatus vs createProject lists differ).

---
## PARKED 09/06/2026 — Instagram -> CRM paste flow (design approved, not built)
Pattern: same as WhatsApp sorter + SinC. NOT automatic (Meta API needs business
verification/app review — not worth it for solo). Realistic flow:
  1. Paste IG DM conversation into a textarea
  2. Claude (claude-sonnet-4-6, existing API pattern) extracts: name, phone, city,
     project_type, budget, style, notes_he
  3. Pre-filled editable review card -> "צור ליד ב-CRM" inserts into leads table
     with source='instagram' (note: leads_source has no check constraint? verify)
  4. Flows through existing /leads inbox + convert->customer+project
Reuses: leads table, LeadsInbox, convertLead, Claude API. ~1 session to build.
NOTE: leads.budget_tier has CHECK (tier_1_8k_15k etc) — IG free-text budget must
  map to a tier OR store in notes_he instead. Same for project_type CHECK.

---
## SESSION REPORT 09/06/2026 (evening) — LEADS PIPELINE + הדמיה FERRARI
SHIPPED (all committed + deployed):
- Backfilled 16 old call transcripts (jsonb -> transcript column). All calls complete.
- LEADS INBOX (/leads): reads website leads table (shared Supabase), one-click convert
  -> customer+project, archive, red badge on nav showing unconverted count.
  FIXED: convertLead wrote status='converted' which violated leads_status_check
  (allowed: new/contacted/qualified/quoted/won/lost/spam) -> now uses 'won'. Was failing
  silently + creating duplicate customers. Added leads_anon_select + leads_anon_update RLS.
- DEMO-TRIALS LIBRARY (/demos): demo_trials table, gallery, upload image+mp4 to Cloudinary
  Demo-Trials folder (added optional folder param to uploadToCloudinary), edit/delete/
  download/whatsapp-to-Ales per card, video poster-frame + play overlay.
- INSTAGRAM HERO MODE (prompt-builder): מדויק/אינסטגרם toggle + 5 mood presets
  (golden/dark-spa/gallery/penthouse/organic). heroRenderStyle() swaps render-style+setting
  for cinematic drama. CONSTRUCTION RULES stay sacred in both modes (geometry never changes).
- SAVE-AS-DEMO BRIDGE: prompt-builder "💾 שמור כהדמיה" saves prompt+settings into gallery.

KEY FACTS:
  - prompt-builder does NOT call Gemini. It only BUILDS the prompt text. User copies prompt
    -> pastes into Nano Banana (Gemini Pro) manually. 4-month proven workflow. "Nano/banana"
    in code = labels only, no API call exists.
  - leads table: full_name/phone/email/city_he/project_type/budget_tier(CHECK)/
    preferred_marble_family/notes_he/utm_*/converted_to_customer_id/converted_to_project_id
  - demo_trials: title_he/cloudinary_url/nano_banana_prompt/kling_prompt/inputs_jsonb/
    marble_family/customer_id(optional). is_video detected from /video/upload/ in URL.

PARKED / OPEN:
  - Final link: upload Nano render ONTO an existing prompt-only demo (currently add new demo).
  - Instagram->CRM paste flow (design approved, not built — see earlier parked note).
  - ROI dashboard (LAST plan item, not started).
  - Prompt template polish beyond hero mode (optional).

STANDING RULES active: delete on every list line; every intake gets view/edit/delete report.

---
## SESSION REPORT 10/06/2026 (morning) — render loop + ROI dashboard
SHIPPED (all committed + deployed):
- #1 RENDER-UPLOAD LOOP: setDemoImage() + ⬆️ upload zone on prompt-only demo cards.
  Save prompt as demo -> generate in Nano Banana -> upload render onto SAME demo. Loop closed.
  Also fixed dead 🔗 פרויקט button in prompt-builder -> now opens /demos gallery (standalone).
- #2 ROI DASHBOARD (/roi): READ-ONLY metrics. Revenue/margin/cost from quotes.total_grand/
  total_cost/total_margin, lead conversion (leads), project pipeline bars (projects.status),
  activity counts, as-of timestamp, nav link 📊 ROI.

KEY DATA FACTS:
  - quotes money lives in: total_grand (customer price), total_cost, total_margin. NOT in projects.
  - projects.quoted_price_ils is EMPTY (0) — pipeline shows COUNTS not ₪. Future: stamp quote
    total onto project when quote built, to get pipeline ₪ value.
  - quote status values seen: 'draft', 'sent'.

STILL OPEN / PARKED:
  - Dead "coming soon" alert still in intake/page.tsx + CallProcessingFlow.tsx (2 more stubs).
  - Instagram->CRM paste flow (design approved, not built).
  - Final demo->customer link (share a demo to existing customer/project) — decided to use
    /demos gallery as the "DEMOs space" instead; customer-link still possible later.
  - middleware deprecation warning (rename to proxy) — cosmetic, deferred.
  - Prompt template polish beyond hero mode (optional).

ALL MAIN PLAN ITEMS NOW DONE: Customer-360, leads pipeline, Demo-Trials, הדמיה Ferrari, ROI.

---
## DECISION 10/06/2026 — middleware->proxy rename DEFERRED
src/middleware.ts is the CRM password gate (crm_auth cookie). Next.js 16 shows a
deprecation warning suggesting rename to proxy.ts. DELIBERATELY NOT DONE: renaming
an auth gate for a cosmetic warning is high-risk/low-reward (wrong signature = lockout
or open CRM). middleware.ts works fine in 16.2.4. Revisit only if/when Next.js hard-removes it.
