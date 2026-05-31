// src/lib/promptBuilderActions.ts
'use server';

// Server Action: persist generated prompts onto an existing media_analyses row's
// ai_full_report JSONB. Uses the service-role key server-side so the UPDATE is not
// blocked by the anon RLS write policy (anon is INSERT-only on media_analyses).
// Per Rule #22 this file exports async functions ONLY.

import { createClient } from '@supabase/supabase-js';
import type { PromptBuilderInputs } from './promptTemplates';

export interface GeneratedPrompts {
  nanoBananaPrompt: string;
  klingPrompt: string;
  klingNegativePrompt: string;
  inputs: PromptBuilderInputs;
}

export interface SavePromptsResult {
  ok: boolean;
  version?: number;
  error?: string;
}

// One server-side client per invocation. Prefer the service-role key (server-only);
// fall back to the anon key if the service-role key is not configured.
function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function savePromptsToAnalysis(
  analysisId: string,
  prompts: GeneratedPrompts,
): Promise<SavePromptsResult> {
  if (!analysisId) {
    return { ok: false, error: 'missing analysisId' };
  }

  const supabase = getServerClient();
  if (!supabase) {
    return { ok: false, error: 'Supabase env vars not configured on the server' };
  }

  // Read the existing report so we never clobber other keys (analysis, transcript, etc.).
  const { data: row, error: readErr } = await supabase
    .from('media_analyses')
    .select('ai_full_report')
    .eq('id', analysisId)
    .single();

  if (readErr) {
    return { ok: false, error: `read failed: ${readErr.message}` };
  }

  const report: Record<string, unknown> = (row?.ai_full_report as Record<string, unknown>) || {};
  const previous = report.prompts as Record<string, unknown> | undefined;
  const previousVersion = typeof previous?.version === 'number' ? (previous.version as number) : 0;
  const nextVersion = previousVersion + 1;

  // Push any prior prompts block into history, then store the new one as `prompts`
  // (keeps the documented ai_full_report.prompts read path pointing at the latest).
  const history = Array.isArray(report.prompt_history) ? (report.prompt_history as unknown[]) : [];
  if (previous) {
    history.push(previous);
  }

  const promptsBlock = {
    version: nextVersion,
    generated_at: new Date().toISOString(),
    nano_banana_prompt: prompts.nanoBananaPrompt,
    kling_prompt: prompts.klingPrompt,
    kling_negative_prompt: prompts.klingNegativePrompt,
    inputs: {
      model_name: prompts.inputs.modelName,
      shape: prompts.inputs.shape,
      mount: prompts.inputs.mount,
      dimensions: prompts.inputs.dimensions,
      setting: prompts.inputs.setting,
      faucet_type: prompts.inputs.faucetType,
      pitch: prompts.inputs.pitch,
      drain: prompts.inputs.drain,
    },
  };

  const nextReport = { ...report, prompts: promptsBlock, prompt_history: history };

  const { error: writeErr } = await supabase
    .from('media_analyses')
    .update({ ai_full_report: nextReport, updated_at: new Date().toISOString() })
    .eq('id', analysisId);

  if (writeErr) {
    return { ok: false, error: `write failed: ${writeErr.message}` };
  }

  return { ok: true, version: nextVersion };
}