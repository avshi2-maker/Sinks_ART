# IDEAS_PARKING.md — Update (28/05/2026)

Paste into the main `IDEAS_PARKING.md`. AUGMENTS the "🔗 LEAD-TO-QUOTE PIPELINE" entry —
adds VIDEO previews to the AI הדמיה pipeline.

**Captured:** 28/05/2026 (Session 31 — ARVO logo + copy revisions + Google Ads go-live + conversion tracking)

---

## 🎬 הדמיה PIPELINE — now IMAGE *and* VIDEO (Veo added)

Context: the site's promise is that we show AI previews to customers. Static image previews
were already planned (Session 31/32 build). Today we added a working VIDEO preview path (Veo),
and video previews are ALREADY LIVE in the site gallery (Cloudinary `marble-art/videos`).
This is how we deliver on the "imaging to customers" claim end-to-end.

### Decisions resolved (28/05/2026)
- **Two models, two jobs:** static = Nano Banana (Gemini 2.5 Flash Image); video = Veo 3.1 (Gemini app / Google Flow). Nano Banana CANNOT do video.
- **Chain, always: still first → feed the finished still into Veo as the anchor frame.** Text-only video does NOT hold the two marble colors; the image locks shape + colors. (Root cause of the earlier Veo struggle.)
- **Color logic locked for every sink:** marble sample A = exterior panels; sample B = inner basin; clean meet at the rim.
- **Video must be SILENT** (no audio) — matches the no-audio site gallery. Veo adds audio by default → strip/mute on export.
- **"Build from scratch → finished sink"** = stylized formation/timelapse; generate several, pick the best.
- **Reusable prompt templates saved** to `references/ai_video_prompts.md` (both image + video, with workflow + tips).

### Storage convention (binds to the Architectural Rule)
- Approved customer renders (image + video): `marble-art/customer-renders/[customer_id]/`
- Public gallery videos: `marble-art/videos` (already live, dynamic — upload to add, no code change)

### Impact on the planned prompt-builder (Session 32)
- The back-office הדמיה prompt-builder should output BOTH a static (Nano Banana) prompt AND a video (Veo) prompt from the same intake fields + chosen samples — not just the image prompt.
- Manual / Avshi-reviewed flow + artist-approval gate stay intact (unchanged).
- Price-offer engine remains a separate later phase (unchanged).

### Open / stretch
- Image-to-image (feed the customer's real sketch/bathroom photo into Nano Banana) still a stretch goal — start with the 3-image upload flow proven today.
- Consider a short "before block → finished sink" video as a hero loop on the homepage once a few good ones exist.
