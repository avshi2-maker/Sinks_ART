/**
 * claudeVision.test.ts
 *
 * Tests for claudeVision.ts. Mocks global fetch so NO real API calls happen.
 * Run via: npx tsx src/lib/intake/claudeVision.test.ts
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 03/05/2026
 */

import { analyzeImage, isAnthropicConfigured, VISION_MODEL, MAX_OUTPUT_TOKENS } from './claudeVision';

// Tiny test framework
let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log('PASS  ' + label);
  } else {
    failed++;
    console.log('FAIL  ' + label + (detail ? '  -> ' + detail : ''));
  }
}

async function assertThrows(label: string, fn: () => Promise<unknown>, mustContain: string) {
  try {
    await fn();
    failed++;
    console.log('FAIL  ' + label + '  -> expected to throw, did not');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes(mustContain)) {
      passed++;
      console.log('PASS  ' + label);
    } else {
      failed++;
      console.log('FAIL  ' + label + '  -> threw, but wrong message: ' + msg);
    }
  }
}

// Save the real fetch + env so we can restore them
const originalFetch  = global.fetch;
const originalApiKey = process.env.ANTHROPIC_API_KEY;

// Helper to mock fetch with a canned response shape
function mockFetch(responseBody: unknown, status = 200) {
  global.fetch = (async () => {
    return {
      ok:     status >= 200 && status < 300,
      status,
      json:   async () => responseBody,
      text:   async () => JSON.stringify(responseBody),
    } as unknown as Response;
  }) as typeof fetch;
}

async function runTests() {
  console.log('\n== claudeVision.ts test run (no real API calls) ==\n');

  // ── Test 1: VISION_MODEL constant ─────────────────────────────────
  assert(
    'VISION_MODEL is claude-sonnet-4-6',
    VISION_MODEL === 'claude-sonnet-4-6'
  );

  // ── Test 2: MAX_OUTPUT_TOKENS guardrail in place ──────────────────
  assert(
    'MAX_OUTPUT_TOKENS is 1500',
    MAX_OUTPUT_TOKENS === 1500
  );

  // ── Test 3: missing API key throws clear error ────────────────────
  delete process.env.ANTHROPIC_API_KEY;
  await assertThrows(
    'missing API key throws clear error',
    () => analyzeImage({ imageUrl: 'https://x.com/a.jpg', prompt: 'p' }),
    'ANTHROPIC_API_KEY is not set'
  );

  // Restore key for the rest of the tests
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-fake-key';

  // ── Test 4: missing imageUrl throws ───────────────────────────────
  await assertThrows(
    'missing imageUrl throws',
    () => analyzeImage({ imageUrl: '', prompt: 'p' }),
    'imageUrl is required'
  );

  // ── Test 5: missing prompt throws ─────────────────────────────────
  await assertThrows(
    'missing prompt throws',
    () => analyzeImage({ imageUrl: 'https://x/y.jpg', prompt: '' }),
    'prompt is required'
  );

  // ── Test 6: successful response is parsed correctly ───────────────
  mockFetch({
    content: [{ type: 'text', text: '{"extracted_dimensions": "60×40 ס\\"מ", "extracted_stone_type": "קרארה"}' }],
    usage:   { input_tokens: 1200, output_tokens: 80 },
    model:   'claude-sonnet-4-6',
  });
  const result = await analyzeImage({
    imageUrl: 'https://res.cloudinary.com/x/image/upload/photo.jpg',
    prompt:   'Test prompt',
  });
  assert('successful response: rawText present',  result.rawText.includes('extracted_dimensions'));
  assert('successful response: parsedJson is object', result.parsedJson !== null);
  assert('successful response: input tokens captured', result.inputTokens === 1200);
  assert('successful response: output tokens captured', result.outputTokens === 80);
  assert('successful response: model echoed', result.model === 'claude-sonnet-4-6');

  // ── Test 7: API cost is computed correctly ────────────────────────
  // 1200 input × $3/1M = $0.0036; 80 output × $15/1M = $0.0012; total = $0.0048
  const expectedCost = 0.0036 + 0.0012;
  const costClose = Math.abs(result.apiCostUsd - expectedCost) < 0.000001;
  assert('API cost computed correctly (~$0.0048)', costClose, `got ${result.apiCostUsd}, expected ${expectedCost}`);

  // ── Test 8: Markdown JSON fence is stripped before parse ──────────
  mockFetch({
    content: [{ type: 'text', text: '```json\n{"extracted_shape": "אובלי"}\n```' }],
    usage:   { input_tokens: 100, output_tokens: 20 },
  });
  const fenced = await analyzeImage({
    imageUrl: 'https://x/y.jpg',
    prompt:   'p',
  });
  assert('markdown json fence is stripped',
    fenced.parsedJson !== null && (fenced.parsedJson as Record<string, string>).extracted_shape === 'אובלי');

  // ── Test 9: non-JSON response → parsedJson is null but rawText survives ──
  mockFetch({
    content: [{ type: 'text', text: 'sorry I cannot analyze this' }],
    usage:   { input_tokens: 50, output_tokens: 10 },
  });
  const nonJson = await analyzeImage({
    imageUrl: 'https://x/y.jpg',
    prompt:   'p',
  });
  assert('non-JSON response: rawText preserved', nonJson.rawText === 'sorry I cannot analyze this');
  assert('non-JSON response: parsedJson is null', nonJson.parsedJson === null);

  // ── Test 10: API error response throws with status code ───────────
  mockFetch({ error: { type: 'authentication_error', message: 'invalid key' } }, 401);
  await assertThrows(
    'API 401 throws with status code',
    () => analyzeImage({ imageUrl: 'https://x/y.jpg', prompt: 'p' }),
    '401'
  );

  // ── Test 11: maxTokens override is bounded by MAX_OUTPUT_TOKENS ───
  mockFetch({
    content: [{ type: 'text', text: '{}' }],
    usage:   { input_tokens: 10, output_tokens: 5 },
  });
  let capturedMaxTokens = 0;
  global.fetch = (async (_url: string, init: RequestInit) => {
    const sent = JSON.parse(init.body as string);
    capturedMaxTokens = sent.max_tokens;
    return {
      ok:    true,
      status: 200,
      json:  async () => ({ content: [{ type: 'text', text: '{}' }], usage: { input_tokens: 10, output_tokens: 5 } }),
      text:  async () => '',
    } as unknown as Response;
  }) as typeof fetch;
  await analyzeImage({
    imageUrl:  'https://x/y.jpg',
    prompt:    'p',
    maxTokens: 999999,                    // user tries to override with huge value
  });
  assert(
    'maxTokens override is capped at MAX_OUTPUT_TOKENS',
    capturedMaxTokens === MAX_OUTPUT_TOKENS,
    `expected ${MAX_OUTPUT_TOKENS}, got ${capturedMaxTokens}`
  );

  // ── Test 12: isAnthropicConfigured() reflects env state ───────────
  assert('isAnthropicConfigured() returns true when key present', isAnthropicConfigured() === true);
  delete process.env.ANTHROPIC_API_KEY;
  assert('isAnthropicConfigured() returns false when key absent', isAnthropicConfigured() === false);

  // ── Cleanup ───────────────────────────────────────────────────────
  global.fetch = originalFetch;
  if (originalApiKey) process.env.ANTHROPIC_API_KEY = originalApiKey;

  // Summary
  const total = passed + failed;
  console.log('\nResult: ' + passed + ' passed, ' + failed + ' failed (' + total + ' total)\n');

  if (failed > 0 && typeof process !== 'undefined') {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Unhandled test failure:', e);
  process.exit(1);
});