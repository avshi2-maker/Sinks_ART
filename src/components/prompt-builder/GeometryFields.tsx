// src/components/prompt-builder/GeometryFields.tsx
'use client';

import type { FaucetType, SinkShape, MountType, PitchType, DrainType, PromptBuilderInputs } from '@/lib/promptTemplates';

interface GeometryFieldsProps {
  value: PromptBuilderInputs;
  onChange: (next: PromptBuilderInputs) => void;
}

const SHAPE_OPTIONS: { value: SinkShape; labelHe: string }[] = [
  { value: 'rectangle', labelHe: 'מלבן' },
  { value: 'square', labelHe: 'ריבוע' },
  { value: 'triangle', labelHe: 'משולש ישר זווית' },
  { value: 'trapezoid', labelHe: 'טרפז' },
  { value: 'pentagon', labelHe: 'מחומש' },
  { value: 'custom', labelHe: 'צורה מותאמת אישית' },
];

const MOUNT_OPTIONS: { value: MountType; labelHe: string }[] = [
  { value: 'countertop', labelHe: 'משולב במשטח (קאונטרטופ)' },
  { value: 'wall-mounted', labelHe: 'תלוי על הקיר (ללא משטח)' },
];

const FAUCET_OPTIONS: { value: FaucetType; labelHe: string }[] = [
  { value: 'wall-tap', labelHe: 'ברז קיר (מהקיר האחורי)' },
  { value: 'on-sink', labelHe: 'ברז על הכיור/משטח' },
  { value: 'none', labelHe: 'ללא ברז' },
];

const PITCH_OPTIONS: { value: PitchType; labelHe: string }[] = [
  { value: 'middle', labelHe: 'שיפוע למרכז' },
  { value: 'back', labelHe: 'שיפוע לאחור (לכיוון הקיר)' },
  { value: 'side', labelHe: 'שיפוע לצד' },
];

const DRAIN_OPTIONS: { value: DrainType; labelHe: string }[] = [
  { value: 'round', labelHe: 'ניקוז עגול' },
  { value: 'linear', labelHe: 'ניקוז לינארי מלבני (נירוסטה)' },
];

const labelClass = 'block text-sm font-semibold text-slate-700 mb-1';
const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';

export default function GeometryFields({ value, onChange }: GeometryFieldsProps) {
  const setField = (patch: Partial<PromptBuilderInputs>) => onChange({ ...value, ...patch });

  const onModelChange = (e: React.ChangeEvent<HTMLInputElement>) => setField({ modelName: e.target.value });
  const onShapeChange = (e: React.ChangeEvent<HTMLSelectElement>) => setField({ shape: e.target.value as SinkShape });
  const onDimensionsChange = (e: React.ChangeEvent<HTMLInputElement>) => setField({ dimensions: e.target.value });
  const onSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => setField({ setting: e.target.value });
  const onPitchChange = (e: React.ChangeEvent<HTMLSelectElement>) => setField({ pitch: e.target.value as PitchType });
  const onDrainChange = (e: React.ChangeEvent<HTMLSelectElement>) => setField({ drain: e.target.value as DrainType });

  return (
    <div dir="rtl" className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="pb-model">שם הדגם</label>
        <input id="pb-model" type="text" className={inputClass} placeholder="לדוגמה: CTS-T35" value={value.modelName} onChange={onModelChange} />
      </div>

      <div>
        <label className={labelClass} htmlFor="pb-shape">צורה</label>
        <select id="pb-shape" className={inputClass} value={value.shape} onChange={onShapeChange}>
          {SHAPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.labelHe}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>סוג התקנה</span>
        <div className="space-y-2">
          {MOUNT_OPTIONS.map((opt) => {
            const checked = value.mount === opt.value;
            const onPick = () => setField({ mount: opt.value });
            return (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-slate-800">
                <input type="radio" name="pb-mount" value={opt.value} checked={checked} onChange={onPick} className="accent-amber-600" />
                <span>{opt.labelHe}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="pb-dims">מידות</label>
        <input id="pb-dims" type="text" className={inputClass} placeholder="לדוגמה: אגן 50 ס״מ, משטח 27+27 ס״מ, עומק 25 ס״מ" value={value.dimensions} onChange={onDimensionsChange} />
      </div>

      <div>
        <label className={labelClass} htmlFor="pb-setting">מיקום ההתקנה</label>
        <input id="pb-setting" type="text" className={inputClass} placeholder="לדוגמה: חדר רחצה מודרני" value={value.setting} onChange={onSettingChange} />
      </div>

      <div>
        <label className={labelClass} htmlFor="pb-drain">סוג ניקוז</label>
        <select id="pb-drain" className={inputClass} value={value.drain} onChange={onDrainChange}>
          {DRAIN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.labelHe}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="pb-pitch">שיפוע לניקוז</label>
        <select id="pb-pitch" className={inputClass} value={value.pitch} onChange={onPitchChange}>
          {PITCH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.labelHe}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>סוג ברז</span>
        <div className="space-y-2">
          {FAUCET_OPTIONS.map((opt) => {
            const checked = value.faucetType === opt.value;
            const onPick = () => setField({ faucetType: opt.value });
            return (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-slate-800">
                <input type="radio" name="pb-faucet" value={opt.value} checked={checked} onChange={onPick} className="accent-amber-600" />
                <span>{opt.labelHe}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}