// src/lib/promptTemplates.ts
// Pure prompt-builder functions. NO React, NO Supabase, NO side effects.
// All validated construction-rule language (Sessions 32-33) is baked in here.
// Session 34: rectangle/square shapes + countertop/wall mount + pitch + drain.

export type SinkShape = 'triangle' | 'trapezoid' | 'pentagon' | 'rectangle' | 'square' | 'custom';
export type FaucetType = 'wall-tap' | 'on-sink' | 'none';
export type MountType = 'wall-mounted' | 'countertop';
export type PitchType = 'middle' | 'back' | 'side';
export type DrainType = 'round' | 'linear';

export interface PromptBuilderInputs {
  modelName: string;
  shape: SinkShape;
  mount: MountType;
  dimensions: string;
  setting: string;
  faucetType: FaucetType;
  pitch: PitchType;
  drain: DrainType;
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

export function buildNanoBananaPrompt(inputs: PromptBuilderInputs): string {
  const model = inputs.modelName.trim() || 'custom marble sink';
  const dims = inputs.dimensions.trim() || 'as drawn in the sketch';
  const setting = inputs.setting.trim() || 'a clean modern bathroom';

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
    'RENDER STYLE:',
    '- Photorealistic, premium artisan finish, soft natural daylight, gentle reflections on polished stone.',
    '- Veining flows naturally across each slab; the stone looks expensive and hand-finished.',
    '- Clean composition, the sink is the clear subject, neutral uncluttered background.',
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