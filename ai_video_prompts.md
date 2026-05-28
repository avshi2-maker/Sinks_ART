# AI הדמיה Prompt Templates — Image + Video (Nano Banana + Veo)

Reusable prompt templates for generating customer-facing sink previews ("הדמיה")
from a sketch + two marble samples. One static image + one short SILENT video.

Living doc — evolve as prompts improve. Companion to references/ai_image_pipeline.md.

---

## The two-model reality (important)
- **Static image → Nano Banana** = Gemini 2.5 Flash Image ("Create image"). Handles multiple reference images.
- **Video → Veo 3.1** = Gemini app (paid) or Google Flow (labs.google/flow). **Nano Banana CANNOT make video.**

## Golden rule (the fix for color drift)
ALWAYS CHAIN: make the still first  →  then feed that finished still into Veo as the image / anchor frame.
Text alone will NOT reliably hold the two specific marble colors in video. The finished image locks shape + colors.
(This was the root cause of the earlier Veo struggles.)

## Color logic — every sink
- Marble sample **A** -> EXTERIOR / outer side panels
- Marble sample **B** -> INNER basin / bowl interior
- The two materials meet cleanly at the rim.

---

## PROMPT 1 — STATIC IMAGE (Nano Banana)
Upload in THIS order: (1) sketch, (2) sample A = exterior, (3) sample B = interior. Then paste:

----------------------------------------------------------------
You are given three reference images:
- IMAGE 1: a hand-drawn sketch of a sink. Use it ONLY for the shape, silhouette, proportions and design. Reproduce its form faithfully and exactly.
- IMAGE 2: a marble/stone sample — this is the EXTERIOR material.
- IMAGE 3: a second marble/stone sample — this is the INTERIOR (basin) material.

Create ONE photorealistic product photograph of a finished, handcrafted natural-stone vessel sink that exactly follows the shape in IMAGE 1.
Apply the marble from IMAGE 2 to ALL outer/exterior surfaces and side panels, with realistic continuous veining and a polished finish.
Apply the marble from IMAGE 3 to the INNER basin/bowl interior ONLY, with realistic veining and a smooth polished surface.
The two materials meet cleanly at the rim. Include a subtle drain at the bottom of the basin.

Style: high-end product photography, photorealistic, ultra-detailed, 4K. The sink sits on a simple neutral surface against a clean seamless light-grey studio background. Soft even studio lighting with a gentle reflection beneath the sink. Slightly elevated 3/4 front camera angle so BOTH the exterior panels and the inner basin are clearly visible. Realistic scale of a real bathroom sink.
No people, no text, no logos, no watermark. Aspect ratio 4:5.
----------------------------------------------------------------

## PROMPT 2 — VIDEO BUILD (Veo 3.1)
Mode: IMAGE-TO-VIDEO. Input / anchor frame = the finished still from Prompt 1. Then paste:

----------------------------------------------------------------
A single continuous cinematic shot, photorealistic, premium and elegant: a handcrafted natural-stone vessel sink builds itself from scratch. It begins as a rough block of the exterior marble that smoothly sculpts and shapes into the sink's outer panels; then the inner basin is hollowed and revealed in the second marble; all surfaces polish to a glossy finish until the complete two-tone sink stands finished. The exterior uses the first marble sample; the inner basin uses the second marble sample. End on a slow, graceful 180-degree orbit around the finished sink.

Setting: clean seamless light-grey studio, soft cinematic studio lighting, subtle floor reflection. Camera: smooth, slow, controlled — a gentle dolly-in and orbit, no shake. Mood: luxurious, calm, artisan craftsmanship, timelapse-like formation. Photorealistic, high detail, cinematic color grade.

CRITICAL: completely SILENT — no audio, no music, no sound effects, no voiceover, no ambient sound. No people, no hands, no text, no captions, no logos, no watermark.
----------------------------------------------------------------

Suggested settings: 8 seconds; 9:16 for site/Instagram (or 16:9 landscape); image-to-video anchored on the finished still.

---

## Tips (so it doesn't fight you)
- Run IN ORDER, always: still first -> get colors/shape right -> THEN animate that exact image.
- Veo adds audio by default. Keep the SILENT line AND mute/strip the audio track on export (site videos are silent anyway).
- "Build from scratch" is stylized (Veo reads it as formation/timelapse); results vary -> generate 3-4, keep the best.
- Keep background + aspect ratio IDENTICAL across every sink so the gallery stays cohesive.
- If marble colors drift in the video, that proves text isn't enough -> always re-run as image-to-video off the still.

## Storage convention
- Approved customer renders (image + video): Cloudinary  marble-art/customer-renders/[customer_id]/
- Public gallery videos: marble-art/videos  (already live; dynamic — upload to add, no code change)

## Labeling
- The "הדמיה" label is added in the site UI — do NOT bake text into the image/video. (Nano Banana text rendering is unreliable anyway.)
