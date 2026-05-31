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


---

## UPDATE 31/05/2026 (Session 34) — pipeline BUILT + deployed; key corrections to the above

The הדמיה prompt-builder described above as "planned" is now **BUILT and LIVE** in the Sinks_ART CRM at `sinks-art.vercel.app/prompt-builder` (standalone) and `/customers/[id]/prompt-builder` (per-customer). Several assumptions in the 28/05 notes were corrected by real testing — read these before acting on the older text.

### CORRECTIONS to the 28/05 decisions
- **Video model is KLING, not Veo.** Veo hallucinated a white-porcelain placeholder; Kling Standard (~₪20/mo) is the production video tool. Veo demoted to "only if free credits."
- **"Build from scratch → finished sink" (stylized formation/timelapse) does NOT work with AI video.** This is the biggest correction. Text-to-video produces abstract sculpture; image-to-video only animates camera moves on a FINISHED still and cannot un-build into slabs; start-frame + end-frame just morphs/melts between two images. **A real build sequence must come from REAL Ales phone footage or a stills slideshow — not AI video.** Do not spend more Kling credits chasing it.
- **Kling's validated use = beauty orbit + DETAIL REVEAL.** A slow orbit that pushes INTO the basin to reveal pitch, drain, and slab seams (8s) works well and is sellable. That is the real value, not a fabrication story.
- **Image-to-video is mandatory** for custom slab geometry (text-to-video can't hold the shape) — the still anchors shape + colors. Confirmed.
- **Marble samples must be uploaded to Gemini WITH the prompt** (3 images: sketch + sample A + sample B). The prompt only references them by number; it cannot send them. No samples → default white Calacatta.

### What the prompt-builder now does
- Outputs BOTH a Nano Banana (still) prompt AND a Kling (image-to-video) prompt + a separate Kling negative-prompt, from the same fields. (Kept dual-output intent from 28/05; swapped Veo→Kling.)
- **Sketch-first analysis:** reuses `/api/analyze-photo` (Claude vision) to read the architect's sketch and auto-fill shape + dimensions; user reviews/corrects, then generates. (Realizes the "image-to-image / read the sketch" stretch goal noted on 28/05.)
- **Real sink controls baked in:** shape (rectangle/square/triangle/trapezoid/pentagon/custom), mount (countertop vs wall-mounted), **drain (round / rectangular stainless linear)**, **pitch (middle / back / side)**, faucet. Drain + pitch are the core artistic-sink questions.
- Construction rules unchanged in spirit: flat slabs, invisible color-matched seams, sample A = exterior, sample B = basin, anti-porcelain forbids.

### Still open / next (carried to STATUS Session 35 list)
- **/intake Part 2:** extract pitch + drain FROM the sketch so the builder auto-fills them.
- **Finished-still LIBRARY** for Kling start-frames (Cloudinary `marble-art/customer-renders/[customer_id]/` per the storage convention above) + a picker.
- **Ales build-footage shot-list (Hebrew)** — the real way to get a "build process" video.
- Silent-video rule from 28/05 still stands for any clip that goes on the site gallery.

