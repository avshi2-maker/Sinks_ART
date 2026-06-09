
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
