'use client';
/**
 * src/components/shared/TopNavLink.tsx
 * Single nav link with active-state highlighting. Optional badge (red count pill).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  href:  string;
  label: string;
  icon:  string;
  badge?: number;
}

export default function TopNavLink({ href, label, icon, badge }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  const baseClass = 'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors no-underline';
  const activeClass   = 'bg-blue-100 text-blue-900';
  const inactiveClass = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  return (
    <Link href={href} className={baseClass + ' ' + (isActive ? activeClass : inactiveClass)}>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-semibold text-white bg-red-500 rounded-full">{badge}</span>
      ) : null}
    </Link>
  );
}
