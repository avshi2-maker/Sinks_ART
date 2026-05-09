'use client';

/**
 * src/components/shared/TopNavLink.tsx
 *
 * Single nav link with active-state highlighting based on current pathname.
 * Client component because usePathname() requires the client. The rest of
 * the TopNav stays server-rendered.
 *
 * Phase 18 — Top navigation bar (Session 21, 09/05/2026)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  href:  string;
  label: string;
  icon:  string;
}

export default function TopNavLink({ href, label, icon }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  const baseClass = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors no-underline';
  const activeClass   = 'bg-blue-100 text-blue-900';
  const inactiveClass = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  return (
    <Link href={href} className={baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
