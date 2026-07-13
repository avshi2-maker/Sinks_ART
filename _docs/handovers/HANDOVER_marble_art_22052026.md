# HANDOVER — Marble Art Sinks (for new chat, 22/05/2026)

Paste this at the start of your new chat, and ALSO attach STATUS.md. Together they give the new session full context.

---

## WHO I AM (operating rules — apply every message)
- I'm Avshi Sapir, 72, self-taught COPY-PASTE developer (not a coder). I architect + paste; I don't write code.
- ALL our correspondence in English. ALL the app UI in Hebrew.
- Ship COMPLETE files via PowerShell here-string (`@'...'@ | Set-Content -Path "..." -Encoding UTF8`). NEVER line-edits, never "find this line."
- ONE terminal command per message during debugging. First command always `cd C:\SinkS\sinks-bathroom-design`.
- Don't ask me technical-decision questions — pick the best+safe option, explain in 1-2 sentences, proceed. Only ask me BUSINESS decisions (features, UX, wording).
- Filenames with date: `name_DDMMYYYY.ext`.
- Sometimes I accidentally paste your chat text into the terminal → harmless "not recognized" errors, just ignore.
- My browser saves downloads to `C:\SinkS\` (not a Downloads folder).
- CRITICAL JSX RULE (Turbopack, Next.js 16+): always put each element's opening tag (attributes + `>`) on ONE line. Keep `<a ...>text</a>` on one line. Extract long handlers/classNames to const vars ABOVE the JSX. This bit us 3x before we codified it — zero errors since.

## THE PROJECT
- **Public marketing site** `marble-art.co.il` — promotes custom handmade Italian-marble sinks by Ales (the artist). Built Next.js + Cloudinary + Supabase + Vercel, Hebrew RTL.
- **Code repo:** `C:\SinkS\sinks-bathroom-design` (GitHub `avshi2-maker/sinks-bathroom-design`). Auto-deploys to Vercel on push to `main`.
- **Docs repo:** `C:\SinkS\Sinks_ART` (GitHub `avshi2-maker/Sinks_ART`) — holds STATUS.md, IDEAS_PARKING.md, UTM templates.
- Separate back-office Sink CRM exists (different project) — NOT what we work on here unless I say so.

## KEY IDENTIFIERS
- Cloudinary cloud name: `dqdku88vv`. Folders under `marble-art/`: sinks, samples, concepts, sketches, leads.
- Cloudinary unsigned upload preset: `marble_lead_uploads` (uploads → `marble-art/leads`).
- GA4 Measurement ID: `G-0VV9NZFRXP` (property "Marble Art Sinks" in "Avshi Back Office" account).
- Business WhatsApp: Avshi `972505231042`, Ales `972504029723`.
- Env vars (Vercel + .env.local): NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY (15 digits), CLOUDINARY_API_SECRET (~27 chars), NEXT_PUBLIC_CLOUDINARY_LEAD_PRESET=marble_lead_uploads, NEXT_PUBLIC_BUSINESS_WHATSAPP.

## WHAT'S LIVE NOW (all shipped + verified)
- V8 dynamic gallery: 4 sections (sinks/samples/concepts/sketches) reading from Cloudinary, 5-min cache.
- Samples = 12 AI-generated marble swatches (replaced ugly screenshots) + "הדמיה" badge + honest disclaimer.
- GA4 installed + `whatsapp_click` STARRED as Key Event (conversion). Once-per-session, ILS 5000 value.
- Lead form: full file upload (images/video/PDF, max 5, 10MB, → Cloudinary leads folder).
- Post-submit green WhatsApp button: opens WA pre-filled with all lead details + gallery picks + file links → to Avshi.
- FULL gallery selection system: all 4 sections have "+" pick buttons → sticky bottom cart bar → picks flow into form (thumbnails+names) → into WhatsApp message + Supabase notes.
- Intake form: mount-type picker (5 SVG-iconed: wall-hung/on-cabinet/side-counters/corner/not-sure) + rough size buckets + photo scale hint. (Folded into notes_he, no DB migration.)
- Header: live clock (center), WhatsApp button removed.
- Hero CTA button removed. Messaging updated across Hero/WhyUs/form/concepts re: AI הדמיה with form details.
- Google Search Console verified + sitemap submitted.

## KEY FILES (in src/)
- `app/page.tsx` — wrapped in SelectionProvider, gallery before form, SelectionCart at end
- `app/actions.ts` — submitLead server action → Supabase `leads` table, handles inspiration_urls_json
- `app/layout.tsx` — Google verification + GA4 + SEO meta + JSON-LD
- `components/Gallery.tsx` — 4 pickable sections, server component
- `components/GalleryCard.tsx` — client card w/ "+" pick button (NEW)
- `components/SelectionCart.tsx` — sticky bottom cart bar (NEW)
- `context/SelectionContext.tsx` — React Context cart (NEW)
- `components/LeadForm.tsx` — form: picks + file upload + mount/size pickers + WhatsApp button
- `components/LiveClock.tsx` — header clock (NEW)
- `components/Header.tsx`, `Hero.tsx`, `WhyUs.tsx`, `HowItWorks.tsx`, `Footer.tsx`, `PhoneInput.tsx`
- `lib/cloudinaryGallery.ts` — Cloudinary Search API fetcher + filenameToDisplay()

## WHERE WE STOPPED (the one unfinished thing)
**Google Ads campaign — BUILD ONLY (do NOT launch), to be ready for next weekend.**
- Decided: ad campaign POSTPONED to next weekend (waiting on Ales's new pics/data + giving Google time to index the URL).
- Got stuck on the Google Ads account picker + Smart-mode trap. I have 4 Google Ads accounts under avshi2@gmail.com:
  - 766-603-3557 (cancelled), 889-028-5142 "artfloor" (cancelled), 859-073-3472 (setup in progress), 213-209-3631 (half-created today, stuck in Smart mode).
- PLAN for next time: use the EXISTING "setup in progress" account 859-073-3472 (clicking into an existing account skips the Smart-mode onboarding wizard that kept trapping us). Switch language to English via Settings→Preferences→Display language, or URL `?hl=en` once INSIDE an account.
- Campaign spec to build (then PAUSE before it spends): Search campaign, goal=Leads optimizing for whatsapp_click conversion, all-Israel, Hebrew, modest daily budget. Keywords: כיור שיש, כיור שיש בהזמנה אישית, כיור אמבטיה שיש, כיור מעוצב. Need 2-3 Hebrew ad headline/description variations. MUST add payment method to finish (no charge while paused). A first campaign can't be saved as pure draft — build fully then PAUSE.

## NEXT SESSION (Session 30) PRIORITY ORDER
1. Finish building the Google Ads campaign (paused) per spec above — use account 859-073-3472.
2. Fix broken email forwarder: MX record points to apex→Vercel (no mail server) so ALL inbound email dropped. Fix MX + the mail.marble-art.co.il CNAME loop in cPanel/LiveDNS. Re-test with nslookup -type=MX + cPanel Track Delivery.
3. Star lead_form_click in GA4 once it appears (nobody clicked footer form link yet).
4. Verify whatsapp_click conversions showing in GA4 Conversions column.
5. When Ales sends new pics/data + Google finishes indexing → ENABLE (un-pause) the ad campaign.

## PARKED BIG IDEAS (in IDEAS_PARKING files, post-launch builds)
- **Free AI הדמיות as customer hookup** — auto-generate 1-2 AI renders from intake form data, deliver free. Sales weapon. (Doc: IDEAS_PARKING_additions_21052026.md)
- **Lead-to-quote pipeline** — public lead → Sink CRM → AI הדמיה → price offer. BLOCKER: public site & Sink CRM are likely TWO separate Supabase DBs; must decide one-DB-vs-sync first. (Doc: IDEAS_PARKING_lead_to_quote_22052026.md)
- Also: FB+IG Business Pages (from Ales's existing personal FB, NOT 2nd personal acct), UTM tracker spreadsheet, cleanup ~29 stray Cloudinary test uploads, add Trabelsi showroom link (informal partnership, no co-branding yet), swap logo "M" placeholder when Ales sends real logo, npm audit fix (NOT --force) for 2 moderate vulns.

## HOW TO START THE NEW CHAT
Paste this handover + attach STATUS.md. First real task: resume building the Google Ads campaign (paused) using existing account 859-073-3472, OR whatever I say I want to do that day.
