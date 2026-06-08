
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
