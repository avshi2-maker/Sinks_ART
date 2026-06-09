'use client';

// src/components/shared/PhoneInput.tsx
// Phase 35 — phone field with live Israeli validation: green + ✓ when valid.

import { isValidIlPhone } from '@/lib/shared/phoneValidation';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  showError?: boolean;   // set true after a failed save attempt
}

export default function PhoneInput({ value, onChange, placeholder = 'טלפון', required, showError }: Props) {
  const valid = isValidIlPhone(value);
  const empty = !value.trim();
  const showGreen = valid;
  const showRed = showError && (required ? (empty || !valid) : (!empty && !valid));

  const borderColor = showGreen ? 'var(--color-border-success, #16a34a)' : showRed ? 'var(--color-border-danger, #dc2626)' : undefined;
  const bg = showGreen ? 'var(--color-background-success, #f0fdf4)' : undefined;

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="tel"
        dir="ltr"
        className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none"
        style={{ backgroundColor: bg, borderWidth: '1px', borderStyle: 'solid', borderColor: borderColor || '#d6d3d1' }}
      />
      {showGreen && (<span style={{ position: 'absolute', left: 8, top: 7, color: '#16a34a', fontSize: 16 }}>✓</span>)}
      {showRed && (<span className="text-xs" style={{ color: '#dc2626' }}>{empty ? 'שדה חובה' : 'מספר לא תקין'}</span>)}
    </div>
  );
}
