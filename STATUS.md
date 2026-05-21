# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.

---

## 2026-05-21 — Session 28 cont. (evening) — GA4 Conversion Event tracking installed

### Goals
- Add GA4 conversion event tracking so future Google Ads campaigns can optimize toward real leads (not just clicks)
- Wire `whatsapp_click` and `lead_form_click` events into the Footer's link handlers
- Mark `whatsapp_click` as a Key Event in GA4 so it counts as a conversion

### Done
- **Footer.tsx upgraded to fire GA4 events on click.** Added `"use client"` directive (Footer is now a Client Component — required for `onClick` handlers that call browser-only `window.gtag`). Added a type-safe `trackEvent()` wrapper that no-ops gracefully if `window.gtag` is not defined (won't crash if GA4 fails to load).
- **Three click events instrumented** in the footer:
  - `whatsapp_click` with params `{ contact: "avshi", location: "footer", phone: "972505231042" }` — fires when Avshi WhatsApp button is clicked
  - `whatsapp_click` with params `{ contact: "ales", location: "footer", phone: "972504029723" }` — fires when Ales WhatsApp button is clicked
  - `lead_form_click` with params `{ location: "footer" }` — fires when "מלאו טופס" link is clicked
- **End-to-end verified in GA4 Realtime.** After deploy, clicked the Avshi WhatsApp link from the live site → GA4 Realtime "Event count by Event name" card showed `whatsapp_click = 1` within seconds. Real proof, not just installed code.
- **Vercel build error caught + fixed (again, same root cause as afternoon).** First GA4-events commit (`1377a2b`) hit the same Turbopack JSX parse error from the Footer afternoon work: line 35:8 `Unexpected token. Did you mean '{'>'}' or '&gt;'?`. Multi-line anchor tags with `>` on its own line. This is the **second time** the bug bit in one day. Fix shipped as commit `3ebde0a`: rewrote Footer with EACH anchor tag on a single line, extracted all `onClick` handlers to `const` variables ABOVE the JSX, extracted className to a `const` variable too. Single-line `<a ...>text</a>` pattern. Built clean.
- **Memory rule #18 added to skill.** "TURBOPACK JSX RULE: Next.js 16+ Turbopack rejects multi-line JSX opening tags where `>` is alone on its own line followed by text. Error: 'Unexpected token. Did you mean {'>'}?'. Bit twice in one session (commits 1612958, 1377a2b). RULE: When shipping JSX via PowerShell here-string, ALWAYS put opening tag (attributes + `>`) on ONE line. Keep `<a ...>text</a>` on one line. If attrs too long, extract handlers/classes to const vars above JSX." This permanent rule will prevent a 3rd occurrence.

### Decisions
- **Once-per-session counting, NOT once-per-event.** GA4's recommendation for the counting method is "Once per event" but that inflates conversions if the same visitor clicks WhatsApp 3 times. For lead tracking, ONE visitor = ONE lead regardless of click count. Set to "Once per session" in the Key Event config.
- **Default key event value: ILS 5000.** A marble sink customer is typically worth ₪3000-8000. ₪5000 is a conservative midpoint. This value matters because Google Ads uses it to calculate ROI-based bid optimization in future campaigns.
- **No Google Ads campaign launched today.** The conversion event is firing but GA4 hasn't indexed it into the Events list yet (6-24h delay before it appears with the star icon). Without the star, Google Ads can't optimize toward this conversion. Patience saves money — running a campaign before the conversion is marked = optimizing toward clicks, not leads, which burns budget. Wait 24h then launch.
- **Footer is now a Client Component, not a Server Component.** The `onClick` handlers require browser-only JavaScript. This is a small build behavior change with no visible downside — the rest of the page (Gallery, etc.) stays as Server Components.

### Lessons learned
- **Turbopack JSX strictness — confirmed pattern.** Single-line opening tags are mandatory when writing JSX via PowerShell here-string. Multi-line works in code editors with proper indentation, but breaks when written through PowerShell's `@'...'@` string handling. Memory rule #18 codifies this permanently.
- **Real-time GA4 verification ≠ Events list visibility.** A custom event can appear in Realtime within seconds, but won't appear in the "Recent Events" list (where you star it as Key Event) for several hours. Two different indexing pipelines on Google's backend. Don't panic when the event is "missing" — Realtime is the source of truth, not the Events list.
- **GA4 UI naming changed — "Key Events" replaced "Conversions" in 2024.** Documentation written before late 2024 calls them "Conversions". They're the same thing.
- **Google's recommended GA4 settings ≠ optimal for lead tracking.** Once-per-event counting and arbitrary $1 default value are GA4's defaults for e-commerce. For lead-based businesses, override both: once-per-session counting and a realistic customer value (₪3000-8000 for marble sinks).

### Files shipped today (evening)
- `src/components/Footer.tsx` — GA4 event tracking added, single-line JSX, Client Component

### Open questions / blockers (waiting on Google's clock)
- **`whatsapp_click` event needs 6-24h to appear in GA4's Recent Events list.** Once visible, one-click action to star it as Key Event.
- **No Google Ads campaign yet** — waiting on the star above. After the star is added, the campaign can launch with conversion-optimized bidding.

### Next session (Session 30 — full priority list)
**Priority 1 — Quick close-out tasks (15 min total):**
1. Star `whatsapp_click` in GA4 Events list (one click, takes 30 seconds)
2. Verify in GA4 Realtime that `lead_form_click` event also fires correctly (click "מלאו טופס" in footer → check GA4)

**Priority 2 — Fix the broken email forwarder (30-90 min):**
3. Find correct LiveDNS mail server hostname (from hosting welcome email or hosting account dashboard)
4. Update MX record in cPanel Zone Editor to point at that hostname
5. Fix the `mail.marble-art.co.il` CNAME loop
6. Wait for DNS propagation, re-test with `nslookup` + cPanel Track Delivery
7. Once working, can optionally create `avshi@marble-art.co.il` Google account and transfer GA4 / Search Console ownership

**Priority 3 — Google Ads campaign launch (60-90 min, AFTER priorities 1 & 2):**
8. Create Google Ads account under `avshi2@gmail.com`
9. Link Google Ads ↔ GA4 (so Ads can read our Key Events)
10. Launch first campaign with conversion-optimized bidding, geographic targeting (TBD: all Israel vs Tel Aviv+Sharon), budget (TBD: ₪150-300 over 3 days for learning phase)

**Priority 4 — Intake form file upload V2 feature (2-4 hours):**
11. Allow customers to upload reference images / videos / PDFs of the sink they want
12. Cloudinary upload widget integration
13. Supabase column for asset URLs
14. Hebrew RTL upload UX with file type/size validation

**Priority 5 — Facebook + Instagram Business Pages (30 min, no code):**
15. From Ales's existing personal Facebook → create new Marble Art Business Page (NOT a second personal account — Meta will suspend)
16. Create Instagram Business account linked to the new Page via Meta Business Suite
17. No new accounts created — just new business pages on existing personal login

**Priority 6 — UTM campaign tracker spreadsheet (30 min):**
18. Build single Google Sheet listing every campaign you've run with: date, channel, budget spent, leads generated, cost per lead
19. Reference spreadsheet pattern in UTM_TEMPLATES_21052026.md

**Priority 7 — Skill v17 update (15 min):**
20. Codify Rule #21 (Turbopack JSX strictness) into skill file properly
21. Codify Rule #22 (always pre-check MX records when domain migrates to Vercel/serverless host)

---

## 2026-05-21 — Session 28 cont. (afternoon) — Priority 1 SEO + Analytics + Footer WhatsApp

### Goals
- Submit marble-art.co.il to Google Search Console + verify ownership + submit sitemap
- Set up Google Analytics 4 (GA4) with end-to-end verification
- Prepare UTM tracking templates for future ad campaigns
- Replace broken email links in footer with WhatsApp direct buttons (for ad campaign readiness)

### Done
- **Google Search Console — VERIFIED + SITEMAP SUBMITTED.** Property added at `https://www.marble-art.co.il` using URL prefix method. Verified via HTML tag method (Next.js `metadata.verification.google` field in `layout.tsx`). Google auto-detected the verification meta tag within seconds of Vercel deploy. Sitemap `sitemap.xml` submitted successfully (status: Success). First indexing data expected within 24-48 hours.
- **GA4 — INSTALLED + LIVE DATA VERIFIED.** New property "Marble Art Sinks" created inside existing "Avshi Back Office" GA4 account (account ID `375030219`). Property configured: Israel time zone, ILS currency, three business objectives (Generate leads, Understand traffic, Engagement & retention). Web data stream created for `https://www.marble-art.co.il`. Measurement ID: `G-0VV9NZFRXP`. Enhanced measurement enabled (auto-tracks page views, scrolls, outbound clicks, etc.).
- **GA4 installed via `@next/third-parties/google` package** — official Next.js GA4 integration, cleaner than raw `<script>` tags. Added to `src/app/layout.tsx` with `<GoogleAnalytics gaId={GA_MEASUREMENT_ID} />` inside the `<html>` element.
- **GA4 end-to-end verified on production** — Realtime overview showed: 1 active user (us), location pin near Tel Aviv-Yafo / Holon (IP-based geolocation, approximate but correct region), page title "Marble Art Sinks — כיורי שיש..." captured correctly. Real data, not just installed-but-untested.
- **Footer rebuilt — two direct WhatsApp buttons, email links removed.** Replaced the previous footer's `mailto:avshi@marble-art.co.il` and `mailto:ales@marble-art.co.il` links (both routing into a broken forwarder — see "Major discovery" below) with two `https://wa.me/` links: Avshi `972505231042`, Ales `972504029723`. Each opens WhatsApp with a pre-filled Hebrew customer message (`שלום, ראיתי את האתר של מרבל ארט ומעוניין/ת בכיור שיש.`) to reduce friction and signal source. Tested end-to-end — clicking opens WhatsApp with message pre-filled correctly.
- **Vercel build error caught and fixed (first occurrence).** First Footer commit (`1612958`) failed Vercel build with Turbopack JSX parse error on line 29:8. Root cause: PowerShell here-string write produced JSX with the closing `>` of an anchor tag on its own line. Fix shipped as commit `8691d86`: rewrote Footer with each anchor tag's content on a single line. Built clean.
- **UTM tracking templates document created** — `UTM_TEMPLATES_21052026.md` saved to repo root. Three templates: Google Ads, Meta paid social, WhatsApp/direct outreach. Includes naming rules, real-world examples, and Session 29+ roadmap.
- **Strategic decision documented — Facebook/Instagram for Marble Art.** Create a new Facebook Business Page from Ales's existing personal account (NOT a second personal Facebook — Meta will suspend duplicate personal accounts on the same phone/device). Same approach for Instagram via Meta Business Suite.

### Major discovery — broken email infrastructure (parked for Session 30)

While trying to verify a Google account for `avshi@marble-art.co.il`, discovered the email forwarder is silently dropping ALL inbound mail.

- Google verification code sent to `avshi@marble-art.co.il` → never arrived at forwarder destination `avshi2@gmail.com`.
- cPanel Trace simulation showed forwarder correctly configured. Looked healthy.
- cPanel Track Delivery (actual log, not simulation) showed **0 records in last 10 days** — server never received any mail.
- `nslookup -type=MX marble-art.co.il 8.8.8.8` → `MX preference=0, mail exchanger = marble-art.co.il`. **MX record points apex domain at itself.**
- `nslookup mail.marble-art.co.il 8.8.8.8` → resolves via CNAME alias back to `marble-art.co.il` → `76.76.21.21` (Vercel's IP).

**Root cause:** apex A record points to Vercel (`76.76.21.21`) for web hosting (correct), but MX record also points to `marble-art.co.il`, so all email goes to Vercel's web servers (which silently drop it). The `mail.marble-art.co.il` CNAME is also broken (loops back to apex).

**The fix (Session 30):** Get correct LiveDNS mail server hostname. Update MX record. Fix CNAME loop. Re-test.

**Mitigation today:** removed all email links from footer, replaced with WhatsApp.

### Decisions
- **Skip email fix today.** Would take 1-2 more hours with DNS propagation wait. Email fix scheduled as Session 30.
- **GA4 ownership stays on `avshi2@gmail.com` for now.** Can transfer to `avshi@marble-art.co.il` after email forwarder fix.
- **Use `@next/third-parties/google` for GA4, not raw `<script>` tags.** Official Next.js integration.
- **WhatsApp pre-filled message is a permanent pattern.** Every WhatsApp link should use the same format.
- **Two-WhatsApp-buttons (not one).** Customers choose who to contact.

### Lessons learned
- **Turbopack JSX is stricter than old SWC.** Keep JSX anchor content on single line via PowerShell here-string.
- **DNS Trace ≠ Track Delivery in cPanel.** Trace = simulation, Track Delivery = actual log. Always check Track Delivery.
- **MX records pointing at apex domains hosted on Vercel/Netlify = silent email death.** Pre-check MX on any domain migrated to serverless.
- **GA4's "48 hours" message is misleading.** Realtime data appears within 1-5 minutes.
- **Search Console HTML tag method via Next.js `metadata.verification.google` is fastest.**

### Files shipped (afternoon)
- `src/app/layout.tsx` — Google verification meta tag + GA4 tag via `@next/third-parties/google`
- `src/components/Footer.tsx` — email links replaced with two WhatsApp buttons
- `package.json` + `package-lock.json` — added `@next/third-parties` dependency
- `STATUS.md` (Sinks_ART repo) — afternoon entry
- `UTM_TEMPLATES_21052026.md` — UTM reference document

---

## 2026-05-21 — Session 28 cont. (morning) — V8 Gallery LIVE — root cause: swapped Cloudinary credentials

### Goals
- Diagnose and fix V8 gallery empty-on-live-site blocker from Session 28
- Restore the four gallery sections (sinks → samples → concepts → sketches) on marble-art.co.il

### Done
- **V8 gallery LIVE on production** — all four sections render real images from Cloudinary as designed.
- **Root cause identified — swapped credentials, not a folder issue.** `CLOUDINARY_API_KEY` slot held a 27-character value (format of an API secret), while `CLOUDINARY_API_SECRET` held the wrong value too. Cloudinary returned silent 401 on every API call. Original code's `if (!res.ok) return []` swallowed the 401 with no visible error.
- **`src/lib/cloudinaryGallery.ts` rewritten** — switched from `/resources/by_asset_folder` to Search API (`POST /resources/search`) with expression `folder="x" OR asset_folder="x"`. Works for both folder modes. Added structured `[Gallery]` logging visible in Vercel Function Logs.
- **`.env.local` corrected** — re-pasted 15-digit API Key and 27-char API Secret from Cloudinary Console into correct slots.
- **Vercel env vars corrected** — both updated via project Settings → Environment Variables.
- **Redeploy WITHOUT build cache** executed — same Rule #20 trap as Session 18.
- **Cloudinary folder structure confirmed** — dynamic folder mode. Assets store `folder=''`, `asset_folder='marble-art/<section>'`. 64 image assets in account (35 expected + 29 strays).

### Decisions
- **Search API over by_asset_folder going forward.** Single endpoint, both folder modes, sub-folders supported.
- **Diagnostic logging stays on in production.** Cheap server-only console.info lines.
- **Credentials policy reinforced.** Verify format before saving: API Key = 15 digits, API Secret = ~27 chars.

### Lessons learned
- **Silent 401 is the worst error.** Handlers returning `[]` on non-2xx hide the most important debugging signal.
- **"It works locally" lies if local and Vercel env vars are both wrong the same way.**
- **Verify the shape of an API value before assuming it's right.** 15 digits vs 27 chars = 5-second check.

---

## 2026-05-20 — Session 28 (in progress) — Dynamic Cloudinary Gallery V8 + asset upload pipeline

### Goals
- Upload curated assets to Cloudinary organized folder structure
- Build dynamic Gallery component that reads from Cloudinary by folder
- Add Cloudinary API credentials to Vercel + .env.local
- Strategic decision on Trabelsi partnership for marble samples

### Done
- **Cloudinary folder structure created** under `marble-art/`: sinks/ (9), samples/ (11), concepts/ (11), sketches/ (4), plus reserved full-bathroom/, process/, leads/
- **35 total assets uploaded + organized** with naming convention.
- **Cloudinary API credentials added** to .env.local + Vercel.
- **V8 Gallery component shipped** — commit `3f8f03d`. 3 files. 4 themed sections, server-component, 5-min revalidate cache, AI concepts labeled "הדמיה".
- **Marble samples strategy locked in** — Trabelsi direct billing model, no Ales inventory risk.

### Decisions
- Trabelsi partnership = informal/operational only for V1.
- Pricing = direct billing (customer pays Trabelsi for stone, Ales for craft).
- No imports — Trabelsi is the supply chain.
- AI concepts MUST be labeled "הדמיה".
- Cloudinary folder structure is the gallery contract.
- API credentials server-only.

### Open questions / blockers (at end of session)
- **🚨 V8 GALLERY EMPTY ON LIVE SITE** — RESOLVED next morning. Was swapped credentials.

---

(... older session entries preserved below — see git history if file gets truncated ...)
