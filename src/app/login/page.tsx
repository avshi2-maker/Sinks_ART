// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        // Read the original target from the query string without useSearchParams
        // (avoids the Next build-time Suspense requirement).
        const from = new URLSearchParams(window.location.search).get('from') || '/dashboard';
        router.replace(from);
        router.refresh();
      } else {
        setError(data.error || 'סיסמה שגויה');
      }
    } catch {
      setError('שגיאת רשת');
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSubmit();
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-center">
          <div className="text-3xl">💎</div>
          <h1 className="mt-2 text-xl font-bold text-slate-900">Marble Art · מערכת ניהול</h1>
          <p className="text-sm text-slate-500">הזינו סיסמה כדי להיכנס</p>
        </div>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKey} placeholder="סיסמה" autoFocus className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        <button type="button" disabled={busy || !password} onClick={onSubmit} className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? 'בודק…' : 'כניסה'}
        </button>
      </div>
    </div>
  );
}