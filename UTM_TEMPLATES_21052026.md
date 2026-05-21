# Marble Art Sinks — UTM Tracking Templates

A reference guide for tagging every link that points to **marble-art.co.il** from outside the site. Every external link you share should use these templates so Google Analytics 4 can tell you which channel, campaign, and ad actually brought customers.

**Last updated:** 21 May 2026 (Session 28 cont.)
**GA4 Measurement ID:** `G-0VV9NZFRXP`
**Property name:** Marble Art Sinks

---

## What is UTM and why it matters

UTM parameters are extra bits added to the end of a URL that tell GA4 where each visitor came from. They are invisible to the customer — the page loads exactly the same — but GA4 sees them and groups visitors accordingly.

Example without UTM:
`https://www.marble-art.co.il`
→ GA4 sees this as "direct traffic" with no idea where it came from.

Example with UTM:
`https://www.marble-art.co.il?utm_source=whatsapp&utm_medium=direct&utm_campaign=cold_outreach`
→ GA4 sees this as "from WhatsApp, direct medium, cold outreach campaign" and you can measure exactly how many leads each channel produces.

---

## The five UTM parameters

You only need to remember three. The other two are optional.

**utm_source** *(required)* — WHERE the link is published.
Examples: `google`, `facebook`, `instagram`, `whatsapp`, `newsletter`

**utm_medium** *(required)* — HOW it reached the customer.
Examples: `cpc` (cost-per-click ads), `social`, `email`, `direct`, `referral`

**utm_campaign** *(required)* — WHICH campaign or batch.
Examples: `launch_2026`, `passover_promo`, `summer_specials`, `cold_outreach`

**utm_content** *(optional)* — WHICH AD or VARIANT.
Use when running 2+ versions of the same campaign to compare them. Example: `madagascar_image` vs `calacatta_image`.

**utm_term** *(optional, Google Ads only)* — WHICH KEYWORD.
Google Ads fills this in automatically — you do not type it yourself.

---

## Template 1 — Google Ads

Google Ads can auto-fill UTMs via a feature called "auto-tagging" — but it's worth setting them manually too because auto-tagging only works inside Google Ads' own ecosystem.

**Template URL:**
```
https://www.marble-art.co.il?utm_source=google&utm_medium=cpc&utm_campaign={campaign_name}&utm_content={ad_variant}
```

**Real example for a Passover campaign:**
```
https://www.marble-art.co.il?utm_source=google&utm_medium=cpc&utm_campaign=passover_2026&utm_content=madagascar_hero
```

**Setup steps when creating a Google Ads campaign:**
1. In Google Ads, when you set up a new ad campaign, paste this template into the "Final URL" field
2. Replace `{campaign_name}` with your campaign name (use lowercase, underscores, no spaces — e.g. `passover_2026`)
3. Replace `{ad_variant}` with the ad version label (e.g. `madagascar_hero`, `white_marble_close_up`)
4. Also turn ON Google Ads' auto-tagging in Account Settings → Auto-tagging → ON (this adds a `gclid` parameter that links Google Ads spend data to your GA4 conversions)

**What you will see in GA4:**
- Reports → Acquisition → Traffic acquisition → filter by `Source = google` and `Medium = cpc`
- You'll see how many visitors each campaign brought, how many became leads (WhatsApp clicks), and conversion rate per campaign

---

## Template 2 — Facebook / Instagram Ads (Meta)

Meta does NOT have auto-tagging like Google. You MUST add UTMs manually or you'll have no idea which Meta ad is working.

**Template URL for Facebook:**
```
https://www.marble-art.co.il?utm_source=facebook&utm_medium=paid_social&utm_campaign={campaign_name}&utm_content={ad_variant}
```

**Template URL for Instagram:**
```
https://www.marble-art.co.il?utm_source=instagram&utm_medium=paid_social&utm_campaign={campaign_name}&utm_content={ad_variant}
```

**Real example for a launch campaign on Instagram:**
```
https://www.marble-art.co.il?utm_source=instagram&utm_medium=paid_social&utm_campaign=launch_summer_2026&utm_content=video_marble_pour
```

**Setup steps in Meta Ads Manager:**
1. Create your ad as normal
2. In the "Website URL" field (the destination URL), paste this template
3. Replace `{campaign_name}` and `{ad_variant}` per the example above
4. Meta has a built-in UTM builder under "URL parameters" — you can use that instead of pasting the full URL, it's the same result

**Tip:** For organic posts (NOT paid ads) on Facebook/Instagram, change `utm_medium` from `paid_social` to `organic_social`. This separates your free posts from paid ads in GA4 reports.

---

## Template 3 — WhatsApp & Direct Outreach

For every link you send personally — WhatsApp messages to potential customers, email signatures, business cards (use a QR code generator), etc.

**Template URL:**
```
https://www.marble-art.co.il?utm_source=whatsapp&utm_medium=direct&utm_campaign={purpose}
```

**Real examples for different situations:**

| Situation | URL to send |
|---|---|
| Cold outreach to a potential customer | `https://www.marble-art.co.il?utm_source=whatsapp&utm_medium=direct&utm_campaign=cold_outreach` |
| Following up after meeting someone at a fair | `https://www.marble-art.co.il?utm_source=whatsapp&utm_medium=direct&utm_campaign=fair_followup` |
| Sending to existing customer who asked about a new project | `https://www.marble-art.co.il?utm_source=whatsapp&utm_medium=direct&utm_campaign=customer_referral` |
| Email signature link | `https://www.marble-art.co.il?utm_source=email&utm_medium=direct&utm_campaign=signature` |
| QR code on business card | `https://www.marble-art.co.il?utm_source=businesscard&utm_medium=offline&utm_campaign=card_v1` |

**Why use UTMs even for personal sharing:**
After a month of using these, GA4 can tell you "5 visitors came from your WhatsApp messages, 2 became WhatsApp button clicks on the site." That's a measurable conversion rate of your personal outreach.

---

## UTM Naming Rules

To keep GA4 reports clean and not split data across "Facebook" vs "facebook" vs "FaceBook" by accident:

1. **Always lowercase.** `utm_source=google`, NOT `utm_source=Google`.
2. **No spaces.** Use underscores instead: `passover_2026`, NOT `passover 2026`.
3. **No special characters except underscore.** No `?`, `&`, `#`, accents, Hebrew.
4. **Be consistent.** Decide once that the source is `instagram` (not `ig`, not `insta`) and stick to it forever. Inconsistency = split reports.
5. **Use English only for parameter values.** GA4 displays them in reports — English keeps things readable.

---

## Quick UTM Builder Tool

Don't want to memorize the format? Google has a free builder:

`https://ga-dev-tools.google/campaign-url-builder/`

Fill in the form fields (Website URL, Campaign Source, Medium, Name, Content), it spits out the final URL ready to copy.

For Marble Art, the Website URL field always = `https://www.marble-art.co.il`.

---

## Where to see UTM data in GA4

1. Open `https://analytics.google.com/` and select **Marble Art Sinks** property
2. Left sidebar → **Reports** → **Acquisition** → **Traffic acquisition**
3. The first column "Session source / medium" shows your UTMs
4. To break down by campaign, change the dimension at the top from "Session source / medium" to "Session campaign"

You'll see live data within 1-5 minutes of someone clicking a UTM-tagged link.

---

## Future Session 29+ items

These tasks build on this UTM foundation. Don't do them yet — they need actual ad spend first.

- **Set up GA4 Conversions** for `WhatsApp click` event (so you can see leads as a conversion metric, not just page views)
- **Link Google Ads ↔ GA4** (so Ads can use GA4 conversion data to optimize bids)
- **Install Meta Pixel** on the site (if running Facebook/Instagram ads — separate tracking layer on top of GA4)
- **Build a UTM campaign tracker spreadsheet** (a single Google Sheet listing every campaign you've run, with date, channel, budget spent, leads generated, cost per lead — gives you a single source of truth)

---

**End of UTM templates document.** Keep this file for reference. Update it whenever you add a new traffic channel or run a new campaign.
