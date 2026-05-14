# Nano Banana — Sketch + Marble Test
**Date:** 14/05/2026  
**Goal:** Validate whether Nano Banana (Gemini 2.5 Flash Image) can take a pencil sketch + a marble texture and produce a photorealistic sink preview that a paying customer would accept. **One test. Decision today.**

---

## Why this test matters

If this passes → Phase 23 (customer-facing sketch-to-preview tool) is real and worth building.  
If this fails → we pivot to ControlNet on Replicate, OR drop the sketch-to-preview idea and focus on the style catalog instead.

We are NOT building anything into the app yet. This is a one-shot manual experiment on the Nano Banana web interface.

---

## Inputs to prepare (5 minutes, before opening Nano Banana)

### Input 1 — The sketch
- One pencil sketch on plain white A4 paper
- A sink you already know — basin shape, pitch direction, side walls, proportions
- Single viewpoint — **front 3/4 angle** is best for sinks
- Line art only — **do NOT shade, do NOT add texture, do NOT color**
- Photograph the paper under natural window light, framed tight, no shadows across the page

### Input 2 — The marble sample
- Use **Photo #6 from Thursday** — the dramatic black marble with white veining. Reason: its pattern is so distinctive that pass/fail will be obvious at a glance.
- OR a clean photo of a raw marble slab if you have one in the workshop
- The marble should fill ≥80% of the frame, no clutter, no other objects

Save both images to your desktop. You'll upload them to Nano Banana as two reference images for a single generation.

---

## The prompt — paste into Nano Banana EXACTLY as written

```
Using the hand-drawn sketch as the exact structural blueprint for the sink — preserve its outline, proportions, pitch angles, basin shape, and overall geometry precisely — render a photorealistic preview of the same sink fabricated from the marble shown in the second reference image. Apply the marble's color, veining pattern, and surface character to all sink surfaces: basin, pitched work area, side walls, and edges.

The sink sits freestanding on a clean light-toned wooden vanity in a modern minimalist bathroom. Soft natural daylight from a side window. A simple brushed-brass wall-mounted faucet above the basin. A thin film of water rests in the basin with subtle reflection. No splashing, no people, no text, no watermarks, no signage.

Style: photorealistic product photography, 50mm lens equivalent, shallow depth of field, natural shadows. Match the sketch's camera angle and orientation. Keep proportions faithful to the sketch.
```

---

## Pass / fail criteria

| Criterion | PASS looks like | FAIL looks like |
|---|---|---|
| **Sink shape** | Clearly follows YOUR sketch's geometry | Generic AI sink, sketch was ignored |
| **Marble pattern** | Recognizably the sample you uploaded | Invented colors, wrong veining |
| **Photorealism** | Could pass as a product photo | Painterly, cartoonish, plastic-looking |
| **Artifacts** | Clean output | Extra taps, melted edges, weird text, two basins |

**Scoring:**  
- 4/4 or 3/4 PASS → **green light Phase 23**  
- 2/4 → borderline, we run one more test with prompt tweaks  
- 1/4 or 0/4 → **pivot to ControlNet on Replicate** (different tech, more control over structure)

---

## What to send back to me

1. The sketch you photographed (the input)
2. The marble sample photo (the input)
3. Nano Banana's output (screenshot)
4. Your gut feeling in one sentence: "I'd show this to a customer" or "No way"

**That's the whole test.** Send the 3 images + your verdict. I'll score it with you and we'll know within 20 minutes whether Phase 23 is real.

---

## If Nano Banana asks you to log in or hits a quota

- Free tier through Google AI Studio (https://aistudio.google.com) works for this test
- If quota is hit, we postpone the test by a day — not worth paying for a one-shot experiment
- Do NOT use your Anthropic API for this test — Nano Banana is Google, not Anthropic

---

*Test recipe v1 — keep this file. If we run a v2 with different inputs or prompt tweaks, the filename version increments.*
