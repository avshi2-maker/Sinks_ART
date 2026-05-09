/**
 * src/app/(internal)/layout.tsx
 *
 * Shared layout for all internal work-app pages: /sinc, /intake, /customers/[id].
 * Wraps them with the TopNav. The /dashboard route has its own layout.tsx that
 * also mounts TopNav (Phase 18 step 4) and stays unchanged here.
 *
 * The parens in "(internal)" are a Next.js route group — folder is URL-invisible,
 * so /sinc still serves at /sinc, not /(internal)/sinc.
 *
 * Phase 18 — Top navigation bar (Session 21, 09/05/2026)
 */

import type { ReactNode } from 'react';
import TopNav from '@/components/shared/TopNav';

export default function InternalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <TopNav />
      {children}
    </div>
  );
}
