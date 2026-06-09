'use client';

// src/components/shared/LiveClock.tsx
// Phase 33 — live ticking clock for the dashboard header.

import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="text-sm font-mono font-medium text-gray-900" dir="ltr">{time || '--:--:--'}</span>;
}
