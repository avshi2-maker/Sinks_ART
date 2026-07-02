'use client';

// src/components/pricing/AlesCostSettingsForm.tsx
// Editable form for the Ales cost settings. Live-computes overhead/day (₪133) as you type.
// Master record — full transparency, can be shown to Ales.

import { useState } from 'react';
import { updateAlesCostSettings } from '@/lib/pricing/alesCostData';
import { overheadPerDay } from '@/lib/pricing/alesCostCalc';
import type { AlesCostSettings } from '@/lib/pricing/alesCostTypes';

function ils(n: number): string { return '₪' + (Math.round(Number(n) || 0)).toLocaleString('he-IL'); }

export default function AlesCostSettingsForm({ initial }: { initial: AlesCostSettings }) {
  const [s, setS] = useState<AlesCostSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(k: keyof AlesCostSettings, v: string) {
    setS((p) => ({ ...p, [k]: Number(v) || 0 }));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    const res = await updateAlesCostSettings(s);
    setBusy(false);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    setSaved(true);
  }

  const oh = overheadPerDay(s);
  const inp = 'w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md text-left';
  const field = (label: string, k: keyof AlesCostSettings, suffix = '₪') => (
    <label className="text-xs text-stone-600">{label}
      <div className="flex items-center gap-1 mt-0.5">
        <input type="number" value={s[k]} onChange={(e) => set(k, e.target.value)} className={inp} dir="ltr" />
        <span className="text-stone-400 text-xs">{suffix}</span>
      </div>
    </label>
  );

  const card = 'bg-white border border-stone-200 rounded-lg p-4';

  return (
    <div dir="rtl" className="space-y-3">
      <div className={card}>
        <div className="text-sm font-medium text-blue-700 mb-3">הוצאות קבועות חודשיות</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {field('שכר דירה למחסן', 'rentIls')}
          {field('חשמל ומים', 'electricWaterIls')}
          {field('אחזקת רכב', 'vehicleIls')}
          {field('ביטוח תאונות', 'insuranceIls')}
          {field('מנהל חשבונות', 'accountantIls')}
          {field('כלכלה יומית', 'foodDailyIls')}
          {field('שונות', 'miscIls')}
          {field('ימי עבודה בחודש', 'workdaysPerMonth', 'ימים')}
        </div>
        <div className="mt-3 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <span className="text-sm text-amber-800">תקורה יומית מחושבת · overhead/day</span>
          <span className="text-base font-semibold text-amber-800">{ils(oh.perDayIls)} <span className="text-xs font-normal">({ils(oh.monthlyFixedIls)} ÷ {s.workdaysPerMonth})</span></span>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-blue-700 mb-3">שכר עבודה יומי</div>
        <div className="grid grid-cols-2 gap-3">
          {field('שכר יומי אלס', 'alesDayRateIls')}
          {field('שכר יומי רוסלן', 'yaroslavDayRateIls')}
        </div>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-blue-700 mb-3">מתכלים לכיור</div>
        <div className="grid grid-cols-3 gap-3">
          {field('דבקים', 'adhesivesIls')}
          {field('ליטוש', 'polishingIls')}
          {field('צבע', 'paintIls')}
        </div>
      </div>

      <div className={card}>
        <div className="text-sm font-medium text-blue-700 mb-3">תמחור</div>
        <div className="grid grid-cols-2 gap-3">
          {field('עמלה קבועה', 'commissionPct', '%')}
          {field('פיצול פרמיה (חלק אבשי)', 'premiumSplitPct', '%')}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="text-sm px-5 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50">{busy ? 'שומר…' : '💾 שמור הגדרות'}</button>
        {saved && (<span className="text-sm text-emerald-600">✓ נשמר</span>)}
      </div>
    </div>
  );
}
