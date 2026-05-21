# Marble Art Sinks — Daily Status Log

A running log of development sessions. **Newest at the top.** Append, never rewrite past entries.

## How to use this file

- Each session gets a `## YYYY-MM-DD — Session Title` heading.
- If multiple sessions happen the same day, separate them under the same date header.
- Standard subsections per session: **Goals**, **Done**, **Decisions**, **Open questions / blockers**, **Next session**.
- Keep it short — bullet points, not prose. This is a log, not a journal.

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
- **Vercel build error caught and fixed.** First Footer commit (`1612958`) failed Vercel build with Turbopack JSX parse error on line 29:8 (`Unexpected token. Did you mean '{'>'}' or '&gt;'?`). Root cause: PowerShell here-string write produced JSX with the closing `>` of an anchor tag on its own line, separated from the Hebrew text content — Turbopack's stricter Next.js 16.2.6 JSX parser tripped on it. Fix shipped as commit `8691d86`: rewrote Footer with each anchor tag's content on a single line, no awkward line breaks. Built clean.
- **UTM tracking templates document created** — `UTM_TEMPLATES_21052026.md` saved to repo root. Three templates: Google Ads (`utm_source=google&utm_medium=cpc`), Meta paid social (`utm_source=facebook|instagram&utm_medium=paid_social`), WhatsApp/direct outreach (`utm_source=whatsapp&utm_medium=direct`). Includes naming rules (lowercase, no spaces, English only), real-world examples per channel, and a Session 29+ roadmap (GA4 conversion setup, Google Ads ↔ GA4 linking, Meta Pixel, campaign tracker spreadsheet).
- **Strategic decision documented — Facebook/Instagram for Marble Art.** Ales already has a personal Facebook account tied to his flooring business. Conclusion: create a new **Facebook Business Page** for Marble Art from the existing personal account (NOT a second personal Facebook — Meta will suspend duplicate personal accounts on the same phone/device). Same approach for Instagram via Meta Business Suite. This avoids account suspension risk and is exactly the architecture Meta wants.

### Major discovery — broken email infrastructure (parked for Session 30)

While trying to verify a Google account for `avshi@marble-art.co.il`, discovered the email forwarder is silently dropping ALL inbound mail. Diagnostic trail in order:

- Google verification code sent to `avshi@marble-art.co.il` → never arrived at forwarder destination `avshi2@gmail.com`.
- cPanel Trace simulation showed forwarder correctly configured: `avshi@marble-art.co.il` → `avshi2@gmail.com` via DNS MX lookup of Gmail's mail servers. Looked healthy.
- cPanel Track Delivery (the actual delivery log, not simulation) showed **0 records in the last 10 days** — server never received any mail.
- Sent fresh test email from working Gmail to `avshi@marble-art.co.il` → never logged, never delivered.
- `nslookup -type=MX marble-art.co.il 8.8.8.8` confirmed DNS: `MX preference=0, mail exchanger = marble-art.co.il`. **The MX record points the apex domain at itself.**
- `nslookup mail.marble-art.co.il 8.8.8.8` confirmed: resolves via CNAME alias back to `marble-art.co.il` → `76.76.21.21` (Vercel's IP).

**Root cause:** the apex A record `marble-art.co.il` points to Vercel (`76.76.21.21`) for web hosting (correct), but the MX record also points to `marble-art.co.il`, so all email gets sent to Vercel's web servers instead of cPanel's mail server (`185.60.168.165`). Vercel doesn't run a mail server, so it silently drops everything. The `mail.marble-art.co.il` CNAME is also broken (loops back to apex instead of resolving to the cPanel mail server hostname).

**The fix (Session 30):** Get the correct LiveDNS mail server hostname from the hosting welcome email or hosting account dashboard. Update MX record to point at that hostname. Fix the `mail.marble-art.co.il` CNAME. Re-test forwarder with `nslookup` and Track Delivery. Until then, no inbound email works at any `@marble-art.co.il` address.

**Mitigation today:** removed all email links from the site footer, replaced with WhatsApp direct links. Customers can still reach Avshi/Ales instantly. No lost leads as long as ads point at WhatsApp, not email.

### Decisions
- **Skip the email fix today.** It would take 1-2 more hours with mandatory DNS propagation wait. Site is brand new with zero customer inquiries yet — no inbound mail is being lost today. By contrast, Google indexing should happen ASAP because every day of delay compounds. Email fix scheduled as Session 30.
- **GA4 ownership stays on `avshi2@gmail.com` for now.** Once the email forwarder is fixed in Session 30, we can create the `avshi@marble-art.co.il` Google account properly and transfer GA4 + Search Console ownership if desired. Until then, `avshi2@gmail.com` works fine.
- **Use `@next/third-parties/google` package for GA4, not raw `<script>` tags.** Official Next.js integration, performance-tuned, single line of JSX. Adds `<GoogleAnalytics gaId="..." />` inside `<html>`.
- **WhatsApp pre-filled message is permanent feature, not a phase 1 hack.** Every WhatsApp link on the site (footer, CTA buttons, anywhere) should use the same pre-filled Hebrew message format. Reduces customer friction, signals source for routing.
- **Two-WhatsApp-buttons pattern (not one).** Customers should see "וואטסאפ - אבשי 050-5231042" and "וואטסאפ - אלס 050-4029723" as separate links so they can choose who to contact. Don't merge into a single "contact us" button.

### Lessons learned
- **Turbopack JSX is stricter than Next.js's old SWC compiler.** A `>` on its own line, separated from JSX text content, used to be tolerated. Turbopack 16.x rejects it. Lesson: keep JSX anchor/span content on the same line as the opening/closing tag when shipping via PowerShell here-string, OR run a local `npm run build` before pushing to catch syntax errors before Vercel.
- **DNS Trace ≠ Track Delivery in cPanel.** Trace shows the simulated routing logic (what cPanel WOULD do). Track Delivery shows the actual logs (what cPanel DID do). A Trace that looks healthy alongside a Track Delivery that's empty proves the mail server never received the message. Always check Track Delivery, not just Trace, when diagnosing forwarder issues.
- **MX records pointing at apex domains hosted on Vercel/Netlify/Cloudflare Pages = silent email death.** This pattern is common when migrating from a traditional host to a serverless platform — the MX record gets forgotten because nobody is testing email until weeks later. Pre-check MX on any domain that moves to Vercel.
- **GA4's "Data collection is pending — may take 48 hours" message is misleading.** In practice, Realtime data appears within 1-5 minutes. Don't wait 48 hours to test — visit the site, then check Realtime overview directly.
- **Google Search Console verification by HTML tag method is fastest with Next.js.** No need for the HTML file method (which requires `public/` folder placement). Next.js 13+ has built-in `metadata.verification.google` field in `layout.tsx` — single line, picked up by Google automatically.

### Files shipped today (afternoon)
- `src/app/layout.tsx` — added Google verification meta tag, then GA4 tag via `@next/third-parties/google`
- `src/components/Footer.tsx` — replaced email links with two WhatsApp buttons (Avshi + Ales)
- `package.json` + `package-lock.json` — added `@next/third-parties` dependency
- `STATUS.md` (Sinks_ART repo) — this entry
- `UTM_TEMPLATES_21052026.md` — UTM tracking reference document

### Open questions / blockers
- **None blocking.** Site is live, indexed, analyzed, and customer-reachable via WhatsApp.
- **Vercel "moderate severity vulnerabilities" warning** from `npm install @next/third-parties` output — harmless transitive dependency warnings, can be cleaned up with `npm audit fix` (NOT `--force`) in a future polish session.

### Next session (Session 30)
- **PRIORITY 1: Fix the email forwarder.** MX record + CNAME loop. ~30-90 min depending on DNS propagation. Once fixed, customer inquiries from any future email-based marketing channel will actually reach the team.
- **PRIORITY 2: Intake form file upload (V2 feature).** Allow customers to upload reference images / videos / PDFs of the sink they want. Requires Cloudinary upload widget integration, Supabase column for asset URLs, Hebrew RTL upload UX. ~2-4 hours.
- **PRIORITY 3: Create the Marble Art Facebook Business Page + Instagram Business account** from Ales's existing personal Facebook (via Meta Business Suite). No new accounts — just new business pages on existing personal login.
- **PRIORITY 4: Set up GA4 Conversions** for the `WhatsApp click` event so leads count as conversions, not just page views. Requires modifying the Footer (or wrapping the WhatsApp links) to fire a `gtag('event', 'whatsapp_click', ...)` call.
- **PRIORITY 5: Link Google Ads ↔ GA4** so future ad spend is attributable to actual lead conversions on-site.
- **Skill v17 update** — add Rule #21 (Turbopack JSX strictness: keep anchor/span content on single line); add Rule #22 (always pre-check MX records when domain migrates to Vercel/serverless host).

---

## 2026-05-21 — Session 28 cont. (morning) — V8 Gallery LIVE — root cause: swapped Cloudinary credentials

### Goals
- Diagnose and fix V8 gallery empty-on-live-site blocker from Session 28
- Restore the four gallery sections (sinks → samples → concepts → sketches) on marble-art.co.il

### Done
- **V8 gallery LIVE on production** — all four sections render real images from Cloudinary as designed.
- **Root cause identified — swapped credentials, not a folder issue.** Cloudinary `CLOUDINARY_API_KEY` slot in `.env.local` and Vercel held a 27-character value (format of an API **secret**), while `CLOUDINARY_API_SECRET` held the wrong value too. Cloudinary returned silent 401 Unauthorized on every Admin/Search API call. The original `by_asset_folder` endpoint code's `if (!res.ok) return []` swallowed the 401 with no visible error — gallery appeared "empty" with no diagnostic signal.
- **`src/lib/cloudinaryGallery.ts` rewritten** — switched from `/resources/by_asset_folder` to the Search API (`POST /resources/search`) with expression `folder="x" OR asset_folder="x"`. Works for both folder modes; future-proof against this category of bug. Added structured `[Gallery]` console logging visible in Vercel Function Logs (folder, total_count, first asset's folder/asset_folder fields).
- **Local `.env.local` corrected** — re-pasted the 15-digit API Key and 27-char API Secret from Cloudinary Console → Settings → API Keys, into the correct slots. Length verification confirmed 15 / 27.
- **Vercel env vars corrected** — both `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` updated via project Settings → Environment Variables. All three environments (Production / Preview / Development) checked.
- **Redeploy WITHOUT build cache** executed — same Rule #20 trap as Session 18. New deployment went Ready, gallery populated within seconds.
- **Cloudinary folder structure confirmed** — dynamic folder mode. Assets store `folder=''` (empty) and `asset_folder='marble-art/<section>'`. Total 64 image assets in account (includes earlier session test uploads beyond the 35 from Session 28).
- **Diagnostic methodology captured** — PowerShell direct API call to Cloudinary `/usage` endpoint with `.env.local` values is the fastest auth-vs-data-vs-config triage. Bypasses all Next.js / Vercel / build-cache layers and reads the truth directly from the API. Worth recording for future credential debugging.

### Decisions
- **Search API over by_asset_folder going forward.** Single endpoint, two folder modes covered, sub-folders supported. Trade-off is one extra API call per page render (counted against Cloudinary credits) vs eliminating an entire category of "empty array, silent 401" failures. Worth it.
- **Diagnostic logging stays on in production.** The `[Gallery]` console.info lines in `cloudinaryGallery.ts` are kept enabled — they are cheap, server-only, and give us instant root-cause data the next time a folder query returns empty.
- **Credentials policy reinforced.** When re-pasting API keys from a vendor console: always verify the format before saving. Cloudinary API Key is exactly 15 digits (all numeric). API Secret is ~27 chars (mixed alphanumeric + `-_`). A length mismatch immediately flags a paste error.

### Lessons learned
- **Silent 401 is the worst error.** A handler that returns `[]` on any non-2xx response hides the most important debugging signal of all — that the API itself rejected the call. Future fetcher utilities in this project should log the status code and body before returning empty.
- **"It works locally" lies if local and Vercel env vars are both wrong the same way.** Always test against the live API endpoint directly with the actual env values, not just the framework's wrapped behavior.
- **Verify the shape of an API value before assuming it's the right one.** 15 digits vs 27 chars is a 5-second check that would have caught Session 28's swap at upload time.

### Open questions / blockers
- **None blocking.** Production is live and verified by Avshi.

### Next session
- **PRIORITY 1: Google Search Console submission** + verify domain + submit sitemap.
- **PRIORITY 2: Google Analytics 4 setup** with UTM tracking before any ad campaign.
- **Re-add inspiration file upload** (V2 feature deferred earlier, customer reference image uploads).
- **FTP architecture discussion** — folder convention, who has credentials, auto-tagger from FTP, review UI, Cloudinary upload step.
- **Quiz/wizard intake flow (Phase 24)** — 8-step conversion engine (4-6 hours, Session 29+).
- **Cleanup**: 29 stray test uploads in Cloudinary (64 total vs 35 expected). Decide which to delete vs keep.

---

## 2026-05-20 — Session 28 (in progress) — Dynamic Cloudinary Gallery V8 + asset upload pipeline

### Goals
- Upload curated assets (sinks, samples, concepts, sketches) to Cloudinary organized folder structure
- Build dynamic Gallery component that reads from Cloudinary by folder (no manual URL hardcoding)
- Add Cloudinary API credentials to Vercel + .env.local for server-side resource listing
- Strategic decision on Trabelsi partnership for marble samples sourcing

### Done
- **Cloudinary folder structure created** under `marble-art/`: sinks/, samples/, concepts/, sketches/, plus reserved full-bathroom/, process/, leads/
- **35 total assets uploaded + organized** with naming convention.
- **Cloudinary API credentials added** to .env.local + Vercel (cloud name, API key, API secret).
- **V8 Gallery component shipped** — commit `3f8f03d`. 3 files. 4 themed sections, server-component, 5-min revalidate cache, AI concepts labeled with "הדמיה" badge.
- **Marble samples strategy locked in** — Trabelsi direct billing model, no Ales inventory risk.

### Decisions
- Trabelsi partnership = informal/operational only for V1.
- Pricing = direct billing (customer pays Trabelsi for stone, Ales for craft).
- No Italy/China imports — Trabelsi is the supply chain.
- AI concepts MUST be labeled "הדמיה".
- Cloudinary folder structure is the gallery contract — auto-updates within 5 min.
- API credentials server-only (no NEXT_PUBLIC_ prefix).

### Open questions / blockers (at end of session)
- **🚨 V8 GALLERY EMPTY ON LIVE SITE** — root cause unknown at time of writing. (RESOLVED next morning — see Session 28 cont. morning entry above. Was swapped credentials, not folder query issue.)

### Next session
- Fix gallery empty issue, then Google Search Console + GA4.

---

(... older session entries preserved below — see git history if file gets truncated ...)
