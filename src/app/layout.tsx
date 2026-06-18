import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import TopNav from "@/components/shared/TopNav";

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
});
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "שיש אמנותי | Marble Art Sinks",
  description: "כיורי שיש בעבודת יד מאת אמנים ישראלים",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Determine the current path. Public Ales RFQ pages (/rfq/...) render WITHOUT
  // the CRM nav (TopNav also fetches private cost/lead data we must not run for Ales).
  const h = await headers();
  const pathname =
    h.get("x-pathname") ||
    h.get("x-invoke-path") ||
    h.get("next-url") ||
    "";
  const isPublicRfq = pathname.startsWith("/rfq/") || pathname === "/rfq";

  return (
    <html lang="he" dir="rtl">
      <body
        className={`${frankRuhl.variable} ${heebo.variable} antialiased`}
        style={{ fontFamily: "var(--font-heebo), system-ui, sans-serif" }}
      >
        {isPublicRfq ? (
          <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden" dir="rtl">
            {children}
          </div>
        ) : (
          <div className="min-h-screen bg-gray-50" dir="rtl">
            <TopNav />
            {children}
          </div>
        )}
      </body>
    </html>
  );
}
