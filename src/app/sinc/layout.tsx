/**
 * src/app/sinc/layout.tsx
 *
 * Next.js layout for the /sinc route (SinC-ART call intake).
 * Loads Hebrew fonts, sets RTL direction, applies design-token scope.
 *
 * Phase A — Foundation (Session 17, 06/05/2026)
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SinC-ART | אינטייק שיחות",
  description: "מערכת קליטת שיחות לקוחות עם ניתוח AI",
};

export default function SincLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="he" dir="rtl">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700;900&family=Heebo:wght@300;400;500;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </div>
  );
}
