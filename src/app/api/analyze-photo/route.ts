/**
 * src/app/api/analyze-photo/route.ts
 *
 * Next.js API route — the bridge between the React UI (browser) and
 * Anthropic's API (server-only). The React side POSTs to /api/analyze-photo
 * with a JSON body { imageUrl, mediaType }, and gets back the structured
 * analysis as JSON.
 *
 * Why this layer exists:
 *   - ANTHROPIC_API_KEY must NEVER reach the browser
 *   - Cost guardrails (token caps, request validation) live here
 *   - Future: rate limiting + audit logging will plug in here too
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 03/05/2026
 */

import { NextResponse } from 'next/server';
import { analyzeImage, isAnthropicConfigured, VISION_MODEL } from '@/lib/intake/claudeVision';
import { getPromptForMediaType, SYSTEM_PROMPT_HE } from '@/lib/intake/prompts';

interface RequestBody {
  imageUrl?:  string;
  mediaType?: 'photo' | 'sketch' | 'mp4' | 'pdf';
}

export async function POST(req: Request) {
  // Fail fast if env not configured
  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { error: 'Server is missing ANTHROPIC_API_KEY' },
      { status: 500 }
    );
  }

  // Parse + validate the JSON body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { imageUrl, mediaType } = body;
  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'imageUrl is required (string)' }, { status: 400 });
  }
  if (!mediaType || !['photo', 'sketch', 'mp4', 'pdf'].includes(mediaType)) {
    return NextResponse.json(
      { error: 'mediaType must be one of: photo, sketch, mp4, pdf' },
      { status: 400 }
    );
  }

  // Sanity-check the URL — must be HTTPS to be fetchable by Anthropic
  if (!imageUrl.startsWith('https://')) {
    return NextResponse.json(
      { error: 'imageUrl must be HTTPS (Anthropic cannot fetch local or HTTP URLs)' },
      { status: 400 }
    );
  }

  // Pick the right Hebrew prompt for this media type
  const prompt = getPromptForMediaType(mediaType);

  try {
    const result = await analyzeImage({
      imageUrl,
      prompt,
      systemText: SYSTEM_PROMPT_HE,
    });

    return NextResponse.json({
      success:       true,
      mediaType,
      model:         result.model,
      visionModel:   VISION_MODEL,
      rawText:       result.rawText,
      parsed:        result.parsedJson,
      inputTokens:   result.inputTokens,
      outputTokens:  result.outputTokens,
      apiCostUsd:    result.apiCostUsd,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown analysis error';
    console.error('[analyze-photo] error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Block all non-POST methods explicitly
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. POST only.' },
    { status: 405 }
  );
}