# IDEAS_PARKING.md — Today's Additions (21/05/2026)

This document captures everything from Session 28 cont. (afternoon + evening) that needs to land in the main `IDEAS_PARKING.md`. Paste each section into the indicated location in the main file.

**Captured:** 21/05/2026 (end of Session 28 cont. evening)

---

## 💡 PASTE NEAR TOP — NEW BIG IDEA (After the "🎯 NEXT SESSION PRIORITY" section)

```markdown
## 💡 BIG IDEA — Free AI הדמיות as Customer Hookup (captured 21/05/2026)

**The hook:** When a customer fills the intake form on marble-art.co.il, the system automatically generates 1-2 free AI-rendered הדמיות (simulations) of their requested sink — delivered to them within minutes, no payment required. The customer sees "their" sink before they spend a shekel.

**Why this is a sales weapon, not a feature:**
- Competitors show stock photos and renders of OTHER customers' sinks
- We show a render that visualizes THEIR description — their stone choice, their bathroom style, their sink shape
- Emotional attachment forms BEFORE the sales conversation starts
- Customer is now psychologically invested → much harder to ghost or comparison-shop
- Differentiator no competitor can copy quickly (requires AI pipeline + intake form integration)

**Cost analysis (back-of-envelope):**
- Nano Banana / Gemini 2.5 Flash Image: ~$0.03-0.05 per image
- 2 images per customer = ~$0.10 cost
- For every 100 form submissions: $10 total in AI costs
- ROI: if even 1 in 100 of those leads converts (at ₪5000 sink value), that's ₪5000 revenue on ₪35 cost (massively positive)

**Required to ship (rough scope, not committed):**
1. Expand intake form fields: marble color preference, sink shape (round/oval/rectangular/asymmetric), bathroom style (modern/classical/rustic/luxury), dimensions (rough size)
2. Server-side prompt builder: takes form data → constructs a high-quality Nano Banana prompt (similar pattern to the marble sample swatch prompts that worked beautifully today)
3. Server-side image generation route: calls Gemini API, saves result to Cloudinary `marble-art/customer-renders/[customer_id]/`
4. Delivery mechanism: either (a) generate immediately + show on confirmation page, (b) async + WhatsApp/email customer when ready, or (c) hybrid — show placeholder + reveal when ready
5. Quality control: every הדמיה stamped with "הדמיה" badge (same legal/trust framing as marble samples)
6. Cap/rate-limiting: max 2 הדמיות per form submission; per-IP daily cap to prevent abuse

**Open strategic questions (decide before building):**
- Should Ales personally review every הדמיה before customer sees it? (Pro: brand quality control. Con: kills the "instant magic" effect that makes it powerful.)
- Should we generate immediately or async? Instant = magic moment; async = better quality (more compute time, model retries).
- Should we let the customer regenerate if they don't like it? (Pro: customer satisfaction. Con: cost creep, could spiral.)
- Should the customer's bathroom photo (from Session 30's intake upload feature) feed INTO the prompt? Massive value if it works ("here's YOUR bathroom with this sink"), but huge privacy + technical complexity. Worth testing separately.
- Is this V1 worth building before basic Google Ads campaign learnings come in? OR is it the post-first-campaign upgrade that turns "we get clicks" into "we close customers"?

**Risk:**
- Quality of AI render = brand impression. If Nano Banana produces a mediocre render and we email it to a customer, that's brand damage on day one.
- Mitigation: pre-tested prompt templates (we proved today these work), Ales-approved style guidelines, automated retry on low-quality detection.

**Strategic fit with North Star:**
- Fits the "AI-controlled command center" vision — this is what the marble sink vertical's intake should look like
- Pattern replicates to other verticals: flooring art could offer "AI render of your floor design" before quoting
- Reinforces the "all media through Cloudinary" architectural rule

**Recommended decision flow:**
1. Don't build now (post-break) — Session 30+ has higher-priority items (email forwarder, GA4 conversion star, intake upload V2)
2. After those land: build a minimal V1 — 1 הדמיה per submission, async with 5-min delivery target, Ales reviews via dashboard before customer notification
3. Measure conversion lift over 30 days vs baseline (compare leads who got הדמיה vs leads who didn't)
4. If conversion lift > 2x: invest in instant generation + 2 images + regenerate option
5. If conversion lift < 1.5x: kill the feature, save the cost
```

---

## 📋 PASTE INTO "marble-art.co.il backlog" (Create new section if not exists)

```markdown
## 🌐 marble-art.co.il backlog (captured 21/05/2026 end of Session 28 cont.)

These items came out of Session 28's two long working sessions. None are blocking the live site — it's fully operational. Listed in rough priority order for whenever the next Marble Art-focused session happens.

### Priority 1 — Quick wins (15 min total)
- `[ ]` (21/05/2026) **Star `whatsapp_click` event in GA4 Events list.** Event fired live today, proven in Realtime. GA4 needs 6-24h to index it into the Recent Events list. Once visible, one click on the star icon marks it as Key Event. Without this, Google Ads can't optimize toward this conversion.
- `[ ]` (21/05/2026) **Verify `lead_form_click` event also fires.** Code shipped today (commit `3ebde0a` Footer GA4 events). Click "מלאו טופס" link on live site → check GA4 Realtime. Should appear within seconds.

### Priority 2 — Email infrastructure (30-90 min, MUST be done before any email-dependent marketing)
- `[ ]` (21/05/2026) **Fix the broken MX record.** Currently `marble-art.co.il` MX points to apex domain `marble-art.co.il` which resolves to Vercel (`76.76.21.21`). Vercel doesn't run a mail server, so ALL inbound email is silently dropped. Diagnostic trail fully documented in STATUS.md Session 28 cont. afternoon entry.
- `[ ]` (21/05/2026) **Fix `mail.marble-art.co.il` CNAME loop.** Currently points back to apex (CNAME loop). Should point to LiveDNS cPanel mail server (IP `185.60.168.165`, hostname TBD from hosting provider welcome email).
- `[ ]` (21/05/2026) **Re-test forwarder end-to-end.** After DNS changes, use `nslookup -type=MX marble-art.co.il 8.8.8.8` to verify MX is correct, then send test email from external Gmail to `avshi@marble-art.co.il` → confirm arrives at `avshi2@gmail.com` via cPanel Track Delivery.
- `[ ]` (21/05/2026) **OPTIONAL after forwarder works:** Create proper `avshi@marble-art.co.il` Google account, transfer Search Console + GA4 ownership from `avshi2@gmail.com`. Current ownership works fine — only do this if branded email is important.

### Priority 3 — Google Ads campaign (60-90 min, ONLY after Priority 1 & 2 done)
- `[ ]` (21/05/2026) **Create Google Ads account under `avshi2@gmail.com`.** Keep auth simple — same account that owns GA4.
- `[ ]` (21/05/2026) **Link Google Ads ↔ GA4** so Ads can read Key Events for conversion-optimized bidding.
- `[ ]` (21/05/2026) **Launch first campaign — small budget.** Recommended: ₪150-300 total over 3 days for the algorithm's learning phase. Geographic: all Israel for V1, refine later. Conversion goal: `whatsapp_click`. Use UTM templates from `UTM_TEMPLATES_21052026.md`.
- `[?]` (21/05/2026) **Decide:** is the 3-day Shavuot holiday window the right launch moment, or wait for post-holiday baseline?

### Priority 4 — Site features
- `[ ]` (20/05/2026) **Intake form file upload (V2).** Allow customers to upload reference images / videos / PDFs of the sink they want. Tech: Cloudinary upload widget integration on the form, Supabase column on `customer_communications` or `media_analyses` for asset URLs, Hebrew RTL upload UX with file type/size validation. ~2-4 hours.
- `[ ]` (21/05/2026) **🌟 NEW — Free AI הדמיות as customer hookup** (see "💡 BIG IDEA" section above for full detail).
- `[ ]` (20/05/2026) **Logo "M" placeholder.** Currently the footer logo is a plain "M" placeholder. Ales is sending real logo soon. Drop-in swap when received.

### Priority 5 — Marketing setup (no code, 30 min)
- `[ ]` (21/05/2026) **Create Marble Art Facebook Business Page** from Ales's existing personal Facebook account. NOT a second personal account (Meta will suspend duplicate personals on same phone/device). Use Meta Business Suite.
- `[ ]` (21/05/2026) **Create Instagram Business account** linked to the new Facebook Page via Meta Business Suite.
- `[ ]` (20/05/2026) **Add Trabelsi link** to direct customers to their showroom for marble purchase. Per Session 28 decision: simple text-only link to `trc.co.il`, no Trabelsi branding/co-marketing until partnership formalizes. Likely lives on the marble samples section or a dedicated "how it works" page.

### Priority 6 — Polish / cleanup
- `[ ]` (21/05/2026) **Build UTM campaign tracker spreadsheet.** Single Google Sheet, one row per campaign: date, channel, source, medium, campaign name, budget spent, leads generated, cost per lead. Pattern referenced in `UTM_TEMPLATES_21052026.md`.
- `[ ]` (21/05/2026) **Cleanup 29 stray test uploads in Cloudinary.** Account has 64 image assets but only ~35 are "production" curated items. The other 29 are test uploads from Session 28 morning debugging. Sort Cloudinary Media Library by upload date, identify pre-V8 strays, delete.
- `[ ]` (21/05/2026) **`npm audit fix` cleanup.** `@next/third-parties` install today flagged "2 moderate severity vulnerabilities" in transitive dependencies. Harmless but should be cleaned in a future polish session. Use `npm audit fix` (NOT `--force` — `--force` breaks things).

### Priority 7 — Skill / process improvements
- `[ ]` (21/05/2026) **Update Avshi's skill file with Rule #21** — Turbopack JSX strictness. Memory rule #18 already captures it in chat memory but the formal skill file should also have it. "When shipping JSX via PowerShell here-string, ALWAYS put each anchor/span/element's opening tag (all attributes + closing `>`) on a SINGLE line. Keep `<a ...>text</a>` on one line. Extract handlers/classes to const variables ABOVE the JSX if attributes get long."
- `[ ]` (21/05/2026) **Update Avshi's skill file with Rule #22** — Pre-check MX records when domain migrates to Vercel/Netlify/Cloudflare Pages. The pattern of "MX record forgotten and pointing at the new web host" is common and silently breaks all inbound email. Run `nslookup -type=MX [domain]` as a checklist item on every new domain wire-up.

---

### Latent visual / content items (lower priority, captured for completeness)
- `[ ]` (21/05/2026) **Replace all remaining Trabelsi screenshot samples with AI-generated swatches.** Today we replaced 9-10 of them (jade_green, ghost_ivory, ghost_oasis, ghost_grey, ghost_rope, interno_rust, blend_concrete_grey, blend_concrete_iron, atlantis_sand, atlantis_taupe). Audit the gallery to ensure every sample is now AI-generated consistent style; if any old ones remain, generate replacements.
- `[ ]` (21/05/2026) **Consider regenerating samples library at higher resolution.** Current AI samples are 1024×1024 from Nano Banana. If you ever do a print catalog or magazine ad, you'll want 4096×4096+ versions of each. Re-run the same prompts with high-res setting when needed.
- `[ ]` (21/05/2026) **Build the "how the partnership works" page.** A dedicated page explaining: Marble Art crafts custom sinks → customer picks stone at Trabelsi (linked) → Trabelsi bills for stone, Ales bills for craft → end-to-end timeline. Strengthens trust, reduces "but where does the marble come from?" questions.

---

### Lessons learned (codified)
- **Turbopack JSX is strict** about multi-line opening tags. Memory rule #18 enforced.
- **DNS Trace ≠ Track Delivery in cPanel.** Trace = simulation, Track Delivery = real log. Always check Track Delivery for the truth.
- **MX records pointing at apex on serverless hosts = silent email death.** Pre-check on every domain migration.
- **GA4's "48 hours" message is misleading.** Realtime data appears within 1-5 minutes; only the indexed Events list takes 6-24h.
- **Search Console verification via Next.js `metadata.verification.google` is the fastest path.** No HTML file upload needed.
- **Cloudinary credential format check matters.** API Key = 15 digits all numeric. API Secret = ~27 chars mixed alphanumeric + `-_`. A 5-second length check catches swap errors at the source.
```

---

## 🎯 PASTE INTO "Quick add zone" near the bottom of the file

```markdown
- (21/05/2026) Free AI הדמיות as customer hookup — see "💡 BIG IDEA" full entry above. Sales weapon, not feature. Build after Session 30 priorities land.
- (21/05/2026) Vercel build cache trap struck again today (commit 1612958, 1377a2b). Both fixed but the pattern needs codification. Consider adding to skill rules.
- (21/05/2026) When the email forwarder is fixed, the formal `avshi@marble-art.co.il` account creation flow becomes possible. Consider whether to migrate Search Console + GA4 ownership or leave on `avshi2@gmail.com`.
- (21/05/2026) Today's AI marble sample generation pattern (consistent prompt template, only color/texture varies) is reusable for future verticals. Flooring art tiles, industrial concrete samples — same approach. Worth documenting as a reusable "AI material library" pattern.
```
