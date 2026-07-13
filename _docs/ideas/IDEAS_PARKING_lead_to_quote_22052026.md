# IDEAS_PARKING.md — Big Idea Addition (22/05/2026)

Paste this into the main `IDEAS_PARKING.md` near the top, after the existing "💡 BIG IDEA — Free AI הדמיות" entry. This is the architectural plan for connecting the public marketing site's lead flow into the existing Sink CRM, then generating AI הדמיות and price offers from there.

**Captured:** 22/05/2026 (Session 28 cont. — gallery picker build session)

---

## 🔗 BIG IDEA — Lead-to-Quote Pipeline: Public Site → CRM → AI הדמיה → Price Offer

**The vision (Avshi's words):** "Collect all these data to the CRM to be indexed with customer details + intake form & allow me to generate AI הדמיה & price offer. Many elements already exist in the Sink CRM module built."

This is the connective tissue that turns the public marketing site (`marble-art.co.il`) and the back-office Sink CRM into ONE pipeline. It's a North Star milestone — the marble vertical's complete customer journey from "first click" to "signed quote."

### The full pipeline (end state)

```
PUBLIC SITE (marble-art.co.il)
  Customer browses gallery → picks marble/sinks/concepts → uploads reference files → fills form
        │
        ▼  (lead submitted)
SUPABASE `leads` table  ←── ALREADY EXISTS, already saving picks + file URLs as of 22/05/2026
        │
        ▼  (NEW: bridge step)
SINK CRM `/customers` + `/dashboard`  ←── ALREADY BUILT (back-office module)
  Lead appears as a customer record with: contact details, gallery picks, uploaded files,
  all indexed and searchable, media stored per the Architectural Rule (Cloudinary + Supabase)
        │
        ├─────────────▼  (NEW: AI הדמיה generation)
        │      Generate custom AI הדמיה from the customer's picks + uploaded bathroom photos
        │      using Nano Banana / Gemini 2.5 Flash Image. Store render in Cloudinary,
        │      link to customer record. Deliver via WhatsApp/email.
        │
        └─────────────▼  (NEW: price offer)
               Generate Hebrew price quote from picks + project type + dimensions
               using the existing Quote Engine (Phase 27a). Store quote PDF in Cloudinary,
               send to customer, track status.
```

### What ALREADY EXISTS (Avshi is right — much is built)

From IDEAS_PARKING.md history and the Sink CRM module:
- ✅ **`leads` table** on the public site's Supabase — now captures full_name, phone, city, project_type, budget_tier, notes, inspiration_image_urls (gallery picks + uploaded files) — as of 22/05/2026
- ✅ **Sink CRM `/customers/[id]`** customer detail pages with communication timeline, media library tab (Phase 19)
- ✅ **`media_analyses` table** (21 columns: thumbnail, dimensions, stone type, shape, ai_full_report, status, approved_by, used_for_quote) — the AI analysis infrastructure
- ✅ **`/dashboard`** back-office hub (Phase 17) showing leads, comms, projects
- ✅ **Quote Engine schema** (Phase 27a Stage 1) — ready for the price-offer generation
- ✅ **Cloudinary + Supabase architecture** with customer_id / project_id foreign keys (Architectural Rule)
- ✅ **AI הדמיה prompt patterns** — proven this session (the marble swatch prompts + the jade render that came out beautifully)
- ✅ **Claude API integration** for AI analysis (used elsewhere in the CRM)

### What's NEW (the work to build)

**Bridge 1 — Public `leads` → CRM `customers`.** The two systems currently use SEPARATE Supabase projects:
- Public site: `dqdku88vv` Cloudinary + its own Supabase (the `leads` table)
- Sink CRM: separate Supabase (`iqfglrwjemogoycbzltt` per memory, or the marble-sinks back-office project)
- DECISION NEEDED: Do they share one Supabase, or does a sync job copy leads from public → CRM? Recommend: investigate whether the public site can write directly to the CRM's Supabase `customers`/`leads` table (cleanest), vs a scheduled sync. This is the #1 architectural decision to resolve first.

**Bridge 2 — AI הדמיה generation from CRM.** A button on the customer detail page: "צור הדמיה". Takes the customer's gallery picks + uploaded bathroom photo → builds a Nano Banana prompt (combining their chosen marble + sink style + their actual bathroom if uploaded) → generates → saves to Cloudinary `marble-art/customer-renders/[customer_id]/` → links to customer record → optionally auto-sends via WhatsApp. This is the "free הדמיה hookup" idea made real, but operated from the CRM (Ales reviews before sending = brand quality control).

**Bridge 3 — Price offer from CRM.** Uses the existing Quote Engine. The customer's picks + project_type + dimensions feed the quote line items. Generate Hebrew PDF, store in Cloudinary, send, track status. Mostly leverages Phase 27a work already done.

### Recommended build sequence (multi-session)

1. **Session A — Resolve the Supabase architecture question.** One Supabase or two + sync? This blocks everything. ~1 session of investigation + decision + migration plan.
2. **Session B — Bridge 1: leads flow into CRM.** Public site leads appear as customer records in the CRM, with picks + files visible. ~1-2 sessions.
3. **Session C — Bridge 2: AI הדמיה generation button in CRM.** ~2 sessions (prompt engineering + Cloudinary save + delivery flow + Ales review UI).
4. **Session D — Bridge 3: price offer from picks.** ~1-2 sessions, leverages existing Quote Engine.

### Open strategic questions
- **One Supabase or two?** (the blocking decision)
- **AI הדמיה: auto-generate on lead arrival, or Ales-triggered from CRM?** Recommend Ales-triggered for V1 (quality control), auto later.
- **Price offer: fully automated or Ales-reviewed before send?** Recommend Ales-reviewed always — pricing is too important to fully automate.
- **Does the customer's uploaded bathroom photo feed into the הדמיה prompt?** Huge value ("here's a sink in YOUR bathroom") but technically harder (image-to-image vs text-to-image). Test separately as a stretch goal.

### Why this matters (North Star fit)
This is the marble vertical's complete pipeline — the proof-of-concept for the entire "business operating system." Once it works for marble sinks, the same pattern (lead → CRM → AI render → quote) replicates to flooring art, industrial flooring, and the other verticals. Get this one right and it's the template for everything.

### Dependency note
Do NOT start this until the immediate Session 30 items are done (email forwarder fix, Google Ads launch). This is a post-launch, multi-session investment — the kind of thing to build once the site is proven to generate leads worth processing.
