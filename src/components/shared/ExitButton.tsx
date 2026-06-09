'use client';

// src/components/shared/ExitButton.tsx
// Phase 33 — logout: clears crm_auth via /api/logout, returns to /login.

import { useState } from 'react';

export default function ExitButton() {
  const [busy, setBusy] = useState(false);

  async function handleExit() {
    if (!window.confirm('לצאת מהמערכת?')) return;
    setBusy(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // even if the call fails, send them to login
    }
    window.location.href = '/login';
  }

  return (
    <button onClick={handleExit} disabled={busy} title="יציאה" className="text-xs px-2 py-1 rounded-md text-stone-500 hover:text-red-600 hover:bg-stone-100 disabled:opacity-40">
      {busy ? '...' : '🚪 יציאה'}
    </button>
  );
}
