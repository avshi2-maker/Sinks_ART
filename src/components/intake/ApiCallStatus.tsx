/**
 * ApiCallStatus.tsx
 *
 * Sticky status panel showing what AI module is running, live timer, tokens,
 * and cost. Three states:
 *   - idle     → hidden
 *   - running  → live elapsed timer counting up, "running..." pulse
 *   - done     → frozen final values, "completed" badge, persists until next run
 *
 * Reset on the next API call. Owned by parent (intake/page.tsx).
 *
 * Phase 15.5 — Live Status Panel
 * Created: 05/05/2026
 */

'use client';

import { useEffect, useState } from 'react';

export type ApiCallStage = 'idle' | 'running' | 'done' | 'error';

export interface ApiCallStatusData {
  stage:        ApiCallStage;
  moduleLabel:  string;     // e.g., "Claude Sonnet 4-6 vision"
  startedAt:    number;     // epoch ms — set when stage becomes 'running'
  finishedAt?:  number;     // epoch ms — set when stage becomes 'done' or 'error'
  inputTokens?: number;
  outputTokens?: number;
  costUsd?:     number;
  errorMsg?:    string;
}

/** Convenience helper to create a fresh "running" state. */
export function makeRunningStatus(moduleLabel: string): ApiCallStatusData {
  return {
    stage:       'running',
    moduleLabel,
    startedAt:   Date.now(),
  };
}

/** Convenience helper to mark a status as done with final stats. */
export function makeDoneStatus(
  prev: ApiCallStatusData,
  inputTokens: number,
  outputTokens: number,
  costUsd: number
): ApiCallStatusData {
  return {
    ...prev,
    stage:        'done',
    finishedAt:   Date.now(),
    inputTokens,
    outputTokens,
    costUsd,
  };
}

/** Convenience helper for error state. */
export function makeErrorStatus(prev: ApiCallStatusData, errorMsg: string): ApiCallStatusData {
  return {
    ...prev,
    stage:      'error',
    finishedAt: Date.now(),
    errorMsg,
  };
}

interface Props {
  status: ApiCallStatusData;
}

export default function ApiCallStatus({ status }: Props) {
  // Live timer for the "running" stage — ticks every 200ms
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (status.stage !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [status.stage]);

  if (status.stage === 'idle') return null;

  // Compute elapsed: live if running, frozen if done/error
  const endTime = status.stage === 'running' ? now : (status.finishedAt || status.startedAt);
  const elapsedMs = Math.max(0, endTime - status.startedAt);
  const elapsedSec = (elapsedMs / 1000).toFixed(1);

  const isRunning = status.stage === 'running';
  const isDone    = status.stage === 'done';
  const isError   = status.stage === 'error';

  const borderColor =
    isRunning ? 'border-blue-300' :
    isError   ? 'border-red-300'  :
                'border-gray-300';

  const bgColor =
    isRunning ? 'bg-blue-50' :
    isError   ? 'bg-red-50'  :
                'bg-gray-50';

  return (
    <div
      className={'api-call-status sticky top-3 border ' + borderColor + ' ' + bgColor + ' rounded-md p-3 text-xs shadow-sm'}
      dir="rtl"
    >
      {/* Header row — module + status badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-900 flex items-center gap-1">
          {isRunning && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
          {isDone    && <span className="text-green-600">✓</span>}
          {isError   && <span className="text-red-600">⚠️</span>}
          <span>{status.moduleLabel}</span>
        </div>
        <span
          className={
            'text-[10px] px-2 py-0.5 rounded-full ' +
            (isRunning ? 'bg-blue-100 text-blue-700' :
             isDone    ? 'bg-green-100 text-green-700' :
                         'bg-red-100 text-red-700')
          }
        >
          {isRunning ? 'פועל...' : isDone ? 'הסתיים' : 'שגיאה'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-700">
        <div>
          <span className="text-gray-500">⏱ זמן: </span>
          <span className="font-mono">{elapsedSec}s</span>
        </div>
        {typeof status.costUsd === 'number' && (
          <div>
            <span className="text-gray-500">💰 עלות: </span>
            <span className="font-mono">${status.costUsd.toFixed(4)}</span>
          </div>
        )}
        {typeof status.inputTokens === 'number' && (
          <div>
            <span className="text-gray-500">↑ קלט: </span>
            <span className="font-mono">{status.inputTokens.toLocaleString()}</span>
          </div>
        )}
        {typeof status.outputTokens === 'number' && (
          <div>
            <span className="text-gray-500">↓ פלט: </span>
            <span className="font-mono">{status.outputTokens.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {isError && status.errorMsg && (
        <div className="mt-2 text-xs text-red-700 bg-red-100 rounded px-2 py-1">
          {status.errorMsg}
        </div>
      )}
    </div>
  );
}
