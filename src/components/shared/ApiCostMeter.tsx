/**
 * src/components/shared/ApiCostMeter.tsx
 *
 * Generic API call cost meter. Used by:
 *   - /intake analyzers (mode="single") — replaces ApiCallStatus.tsx
 *   - /sinc page (mode="pipeline") — multi-stage Cloudinary → ElevenLabs → Anthropic
 *
 * Always shown to the right of the report (desktop) or above (mobile).
 * Per skill rule: every API-driven report MUST include this component.
 *
 * Phase B — Data Layer (Session 17, 06/05/2026)
 */

'use client';

import { formatUsd, formatElapsedSec } from '@/lib/sinc/apiMeter';
import type { ApiMeterReading, ApiMeterStage } from '@/lib/sinc/types';

interface SingleStageProps {
  mode:    'single';
  status:  ApiMeterReading;
}

interface PipelineProps {
  mode:    'pipeline';
  stages:  ApiMeterReading[];
}

type Props = SingleStageProps | PipelineProps;

const STAGE_ICON: Record<ApiMeterStage, string> = {
  idle:         '⚪',
  uploading:    '⬆️',
  transcribing: '🎙️',
  analyzing:    '🔍',
  done:         '✅',
  error:        '⚠️',
};

const PULSE_STAGES: ApiMeterStage[] = ['uploading', 'transcribing', 'analyzing'];

export default function ApiCostMeter(props: Props) {
  if (props.mode === 'single') {
    return <SingleMeter status={props.status} />;
  }
  return <PipelineMeter stages={props.stages} />;
}

// ── Single-stage (used by /intake) ───────────────────────────

function SingleMeter({ status }: { status: ApiMeterReading }) {
  if (status.stage === 'idle') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-500">
        מד עלות API · ממתין
      </div>
    );
  }

  const isPulsing = PULSE_STAGES.includes(status.stage);
  const isError   = status.stage === 'error';
  const isDone    = status.stage === 'done';

  let frameClass = 'bg-blue-50 border-blue-200';
  if (isDone)  frameClass = 'bg-green-50 border-green-200';
  if (isError) frameClass = 'bg-red-50 border-red-200';

  return (
    <div className={`${frameClass} border rounded p-3 text-xs space-y-1`} dir="rtl">
      <div className="flex items-center gap-2 font-medium">
        {isPulsing ? (
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        ) : (
          <span>{STAGE_ICON[status.stage]}</span>
        )}
        <span>{status.moduleLabel || stageHebrewLabel(status.stage)}</span>
        {isDone && <span className="text-green-700 mr-auto">הסתיים</span>}
        {isError && <span className="text-red-700 mr-auto">שגיאה</span>}
      </div>
      <MeterStats reading={status} />
      {isError && status.errorMsg && (
        <div className="text-red-600 text-xs pt-1 border-t border-red-200">
          {status.errorMsg}
        </div>
      )}
    </div>
  );
}

// ── Pipeline (used by /sinc) ─────────────────────────────────

function PipelineMeter({ stages }: { stages: ApiMeterReading[] }) {
  const totalCost = stages.reduce((acc, s) => acc + (s.costUsd || 0), 0);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2 text-xs" dir="rtl">
      <div className="font-medium text-gray-700 pb-1 border-b border-gray-200">
        מד עלות API · צינור עיבוד
      </div>
      {stages.length === 0 ? (
        <div className="text-gray-400">ממתין להתחלה</div>
      ) : (
        stages.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="shrink-0">{STAGE_ICON[s.stage]}</span>
            <div className="flex-1 space-y-0.5">
              <div className="font-medium">{s.moduleLabel || stageHebrewLabel(s.stage)}</div>
              <MeterStats reading={s} />
            </div>
          </div>
        ))
      )}
      {totalCost > 0 && (
        <div className="pt-2 border-t border-gray-200 font-medium">
          סך הכל: {formatUsd(totalCost)}
        </div>
      )}
    </div>
  );
}

// ── Stats line shown for any stage ───────────────────────────

function MeterStats({ reading }: { reading: ApiMeterReading }) {
  if (reading.stage === 'idle') return null;
  return (
    <div className="text-gray-600 text-xs space-x-2 space-x-reverse" style={{ direction: 'rtl' }}>
      <span>זמן: {formatElapsedSec(reading)}</span>
      {typeof reading.inputTokens === 'number' && (
        <span>· קלט: {reading.inputTokens.toLocaleString('he-IL')}</span>
      )}
      {typeof reading.outputTokens === 'number' && (
        <span>· פלט: {reading.outputTokens.toLocaleString('he-IL')}</span>
      )}
      {typeof reading.costUsd === 'number' && (
        <span>· עלות: {formatUsd(reading.costUsd)}</span>
      )}
    </div>
  );
}

function stageHebrewLabel(stage: ApiMeterStage): string {
  switch (stage) {
    case 'idle':         return 'ממתין';
    case 'uploading':    return 'מעלה ל-Cloudinary';
    case 'transcribing': return 'תמלול ElevenLabs';
    case 'analyzing':    return 'ניתוח Claude';
    case 'done':         return 'הסתיים';
    case 'error':        return 'שגיאה';
  }
}
