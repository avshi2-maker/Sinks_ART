import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${frankRuhl.variable} ${heebo.variable} antialiased`}
        style={{ fontFamily: "var(--font-heebo), system-ui, sans-serif" }}
      >
        <div className="min-h-screen bg-gray-50" dir="rtl">
          <TopNav />
          {children}
        </div>
      </body>
    </html>
  );
}