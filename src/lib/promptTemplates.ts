// src/lib/promptTemplates.ts
// Pure prompt-builder functions. NO React, NO Supabase, NO side effects.
// All validated construction-rule language (Sessions 32-33) is baked in here.
// Session 34: rectangle/square shapes + countertop/wall mount + pitch + drain.

export type SinkShape = 'triangle' | 'trapezoid' | 'pentagon' | 'rectangle' | 'square' | 'custom';
export type FaucetType = 'wall-tap' | 'on-sink' | 'none';
export type MountType = 'wall-mounted' | 'countertop';
export type PitchType = 'middle' | 'back' | 'side';
export type DrainType = 'round' | 'linear';
export type RenderMode = 'accurate' | 'instagram';
export type MoodType = 'golden' | 'dark-spa' | 'gallery' | 'penthouse' | 'organic';

export interface PromptBuilderInputs {
  modelName: string;
  shape: SinkShape;
  mount: MountType;
  dimensions: string;
  setting: string;
  faucetType: FaucetType;
  pitch: PitchType;
  drain: DrainType;
  renderMode?: RenderMode;
  mood?: MoodType;
}

function shapePhrase(shape: SinkShape): string {
  switch (shape) {
    case 'triangle':
      return 'a true right-triangle (THREE sides only — never a pentagon or trapezoid)';
    case 'trapezoid':
      return 'a trapezoid (FOUR or FIVE straight sides, no curves)';
    case 'pentagon':
      return 'a pentagon (FIVE straight sides, no curves)';
    case 'rectangle':
      return 'a clean rectangle (FOUR straight sides, flat faces, no curves)';
    case 'square':
      return 'a clean square (FOUR equal straight sides, flat faces, no curves)';
    case 'custom':
    default:
      return 'a custom flat-faceted polygon (only straight edges and flat faces)';
  }
}

function drainPhrase(drain: DrainType): string {
  return drain === 'linear'
    ? 'a slim rectangular stainless-steel linear channel drain (a straight slot, NOT a round hole)'
    : 'a single small round drain';
}

function pitchPhrase(pitch: PitchType): string {
  switch (pitch) {
    case 'back':
      return 'positioned along the BACK edge of the basin (against the wall); the flat basin floor slopes gently down toward it';
    case 'side':
      return 'positioned along ONE SIDE edge of the basin; the flat basin floor slopes gently down toward it';
    case 'middle':
    default:
      return 'positioned at the CENTER of the basin; the flat basin floor slopes gently down toward it from all sides';
  }
}

function mountAndFaucetClause(mount: MountType, faucet: FaucetType): string {
  const faucetClause =
    faucet === 'wall-tap'
      ? ' The tap is WALL-MOUNTED on the back wall and projects horizontally over the basin; there is NO faucet hole on the sink itself.'
      : faucet === 'on-sink'
        ? ' A single faucet hole sits just behind the basin; show a simple deck-mounted tap there.'
        : ' No faucet is shown at all.';

  if (mount === 'countertop') {
    return (
      'The sink is INTEGRATED INTO a flat stone countertop / vanity top — the basin is recessed into the ' +
      'surrounding counter surface, which extends to either side as a flat polished slab. It rests on the ' +
      'counter, NOT floating.' +
      faucetClause
    );
  }
  return (
    'WALL-MOUNTED with NO vanity, NO cabinet, NO pedestal and NO visible support beneath it. ' +
    'It is held by hidden wall fixings flush against the wall (not visible in the shot).' +
    faucetClause
  );
}

function constructionRules(inputs: PromptBuilderInputs): string {
  return [
    'CONSTRUCTION RULES (follow exactly, override any tendency toward bowls or curves):',
    `- The sink is ${shapePhrase(inputs.shape)}.`,
    '- It is built ENTIRELY from FLAT polished stone slabs. Every visible face is a flat polygon.',
    '- NO curves, NO carved bowls, NO rounded edges, NO sculpted shapes of any kind.',
    '- Slabs are joined at INVISIBLE seams using color-matched stone adhesive.',
    '- Seams are hairline-thin (sub-millimeter), tinted to match the surrounding veining — virtually invisible.',
    '- NO white grout, NO white sealant, NO white caulk between slabs. NO contrasting joint lines.',
    '- COLOR MAPPING: use reference image 2 (marble sample A) for ALL EXTERIOR surfaces ' +
      '(outer panels, front face, top rim, and the surrounding countertop if present). Use reference image 3 ' +
      '(marble sample B) for the INTERIOR basin (basin walls and the sloped basin floor). The two ' +
      'materials meet cleanly at the rim.',
    `- DRAIN: ${drainPhrase(inputs.drain)}, ${pitchPhrase(inputs.pitch)}.`,
    `- ${mountAndFaucetClause(inputs.mount, inputs.faucetType)}`,
  ].join('\n');
}

interface MoodPreset { setting: string; light: string; extras: string; }

function moodPreset(mood: MoodType): MoodPreset {
  switch (mood) {
    case 'dark-spa':
      return {
        setting: 'a moody luxury spa with dark micro-cement walls and warm shadow',
        light: 'a single dramatic shaft of warm light rakes across the polished stone so the veining glows like liquid; deep shadows fall away into near-black',
        extras: 'a thin ribbon of steam drifts past, one lit candle bokeh in the far background, a single white orchid stem',
      };
    case 'gallery':
      return {
        setting: 'a bright minimalist art-gallery bathroom, pure white plaster walls',
        light: 'clean even museum lighting, crisp soft shadows, the stone is the only subject',
        extras: 'absolute minimalism, nothing else in frame, a sense of expensive calm',
      };
    case 'penthouse':
      return {
        setting: 'a glass-walled penthouse bathroom at dusk, city skyline glittering behind',
        light: 'cool blue hour ambience mixed with warm interior glow, reflections of city lights on the polished marble',
        extras: 'floor-to-ceiling window, infinity view, ultra-luxury real-estate feel',
      };
    case 'organic':
      return {
        setting: 'a serene biophilic bathroom, travertine and living greenery, soft linen textures',
        light: 'dappled natural sunlight filtering through leaves, warm and inviting',
        extras: 'trailing plants, a smooth pebble, raw natural materials, wabi-sabi luxury',
      };
    case 'golden':
    default:
      return {
        setting: 'a high-end designer bathroom with a warm sunset glow',
        light: 'golden-hour sunlight streams in low from the side, a warm beam catching the marble veining and throwing long elegant highlights along the polished edge',
        extras: 'a faint sheet of water glides over the honed rim, subtle warm reflections, a luxurious quiet moment',
      };
  }
}

function heroRenderStyle(mood: MoodType): string {
  const m = moodPreset(mood);
  return [
    'RENDER STYLE — INSTAGRAM HERO (editorial, scroll-stopping):',
    '- Dramatic low three-quarter hero angle, 35mm lens, shallow depth of field, the sink commanding the frame.',
    '- SETTING: ' + m.setting + '.',
    '- LIGHTING: ' + m.light + '.',
    '- ATMOSPHERE: ' + m.extras + '.',
    '- The polished marble shows faint mirror reflections, subtle translucency at thin edges, veining flowing like flowing ink — looks impossibly expensive and hand-finished.',
    '- Editorial magazine quality: shot for Architectural Digest / Kinfolk, award-winning interior photography, ultra-detailed, razor-sharp focus, 8K, rich tonal depth.',
    '- Composition leaves clean negative space (room for an Instagram caption).',
  ].join('\n');
}

export function buildNanoBananaPrompt(inputs: PromptBuilderInputs): string {
  const model = inputs.modelName.trim() || 'custom marble sink';
  const dims = inputs.dimensions.trim() || 'as drawn in the sketch';
  const isInsta = inputs.renderMode === 'instagram';
  const mood = inputs.mood || 'golden';
  const setting = inputs.setting.trim() || (isInsta ? moodPreset(mood).setting : 'a clean modern bathroom');

  return [
    'You are given three reference images:',
    '  1. A technical sketch of the sink (geometry — follow it precisely).',
    '  2. Marble sample A — the EXTERIOR / countertop stone.',
    '  3. Marble sample B — the INTERIOR basin stone.',
    '',
    `Produce a single photorealistic studio-quality still of the "${model}" marble sink, ` +
      `installed in ${setting}. Dimensions: ${dims}.`,
    '',
    constructionRules(inputs),
    '',
    isInsta ? heroRenderStyle(mood) : [
      'RENDER STYLE:',
      '- Photorealistic, premium artisan finish, soft natural daylight, gentle reflections on polished stone.',
      '- Veining flows naturally across each slab; the stone looks expensive and hand-finished.',
      '- Clean composition, the sink is the clear subject, neutral uncluttered background.',
    ].join('\n'),
    '',
    'ABSOLUTE FORBIDS: white porcelain, ceramic, round or oval sink, bowl shape, carved or curved basin, ' +
      'rounded edges, pedestal, white grout, white caulk, contrasting seams, ' +
      'placeholder or starter sink, people, hands, text, captions, watermark.',
  ].join('\n');
}

export function buildKlingPrompt(inputs: PromptBuilderInputs): string {
  const model = inputs.modelName.trim() || 'custom marble sink';
  const setting = inputs.setting.trim() || 'a modern bathroom';
  const mountWord = inputs.mount === 'countertop' ? 'set into a stone countertop' : 'wall-mounted';
  const drainWord = inputs.drain === 'linear' ? 'a stainless linear slot drain' : 'a small round drain';

  return [
    `Photorealistic cinematic shot of the finished "${model}" flat-slab marble sink, already complete, ` +
      `${mountWord} in ${setting}.`,
    'OPENING FRAME: the sink is fully built from the first frame — flat polished stone slabs, ' +
      `sharp straight edges, invisible seams, a sloped basin floor draining to ${drainWord}.`,
    'The camera slowly pushes in and orbits a few degrees, soft daylight glinting on the polished surfaces. Premium, luxury feel.',
  ].join(' ');
}

export function buildKlingNegativePrompt(): string {
  return [
    'white porcelain', 'ceramic', 'round sink', 'oval sink', 'bowl-shaped', 'carved bowl',
    'curved basin', 'rounded edges', 'pedestal', 'support structure',
    'multiple sinks', 'white grout', 'white sealant', 'white caulk',
    'visible joints', 'tile grout', 'contrasting seams', 'gap lines', 'bright joint lines',
    'placeholder sink', 'starter sink', 'temporary fixture', 'people', 'hands', 'text',
    'captions', 'watermark', 'audio', 'music', 'sound',
  ].join(', ');
}

// Map the Hebrew/free-text shape from /intake analysis onto our enum.
// Higgsfield — image-to-video. Built from research best-practice:
// ONE slow camera move (slow = luxury), tight scene, explicit geometry/material preservation.
export interface HiggsfieldPrompt { cameraMove: string; scenePrompt: string; preserve: string; }

function higgsfieldCameraMove(mood: MoodType): string {
  switch (mood) {
    case 'dark-spa':  return 'Slow dolly-in (push-in)';
    case 'gallery':   return 'Slow orbit (left to right, ~15°)';
    case 'penthouse': return 'Slow crane-down toward the basin';
    case 'organic':   return 'Gentle parallax push-in';
    case 'golden':
    default:          return 'Slow dolly orbit, low angle';
  }
}

export function buildHiggsfieldPrompt(inputs: PromptBuilderInputs): string {
  const model = inputs.modelName.trim() || 'marble sink';
  const mood = inputs.mood || 'golden';
  const m = moodPreset(mood);
  const move = higgsfieldCameraMove(mood);

  const scene = [
    'Cinematic product hero shot of a ' + model + ', a flat-slab polished marble sink, in ' + m.setting + '.',
    m.light + '.',
    m.extras + '.',
    'Editorial luxury feel, shallow depth of field, premium and quiet.',
  ].join(' ');

  const preserve = 'Keep the sink exactly as in the uploaded image — same flat-slab geometry, straight edges, marble veining and colour. Do not reshape into a bowl or add curves. Subtle motion only.';

  return [
    'CAMERA MOVE (select this preset in Higgsfield): ' + move,
    '',
    'SCENE PROMPT (paste this):',
    scene,
    '',
    'PRESERVE (append to prompt):',
    preserve,
    '',
    'SETTINGS: 9:16 portrait · 5–8 seconds · one move only · enable prompt-enhance then review.',
  ].join('\n');
}

export function mapAnalyzedShape(raw: string | null | undefined): SinkShape {
  const s = (raw || '').trim();
  if (!s) return 'custom';
  if (/ריבוע|מרובע|square/i.test(s)) return 'square';
  if (/מלבן|מלבני|rectang/i.test(s)) return 'rectangle';
  if (/משולש|triangle/i.test(s)) return 'triangle';
  if (/טרפז|trapez/i.test(s)) return 'trapezoid';
  if (/מחומש|pentagon/i.test(s)) return 'pentagon';
  return 'custom';
}