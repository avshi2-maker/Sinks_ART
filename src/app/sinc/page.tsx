/**
 * src/app/sinc/page.tsx
 *
 * SinC-ART — Phase A placeholder.
 * Renders a styled "loading" card to verify:
 *   - /sinc route works on Vercel
 *   - Hebrew fonts (Heebo + Frank Ruhl Libre) load correctly
 *   - Design tokens (navy, gold, cream) display correctly
 *   - RTL layout works on phone + desktop
 *
 * Phases B-F will replace this with the full migrated UI.
 *
 * Migrated from: sinc_art_call_intake_03052026-v7.html (still in demos/)
 * Phase A — Foundation (Session 17, 06/05/2026)
 */

"use client";

import styles from "@/styles/sinc.module.css";

export default function SincPage() {
  return (
    <div className={`${styles.scope} ${styles.page}`}>
      <div className={styles.container}>
        <header style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 className={styles.h1}>SinC-ART</h1>
          <p className={styles.subtitle}>
            מערכת קליטת שיחות לקוחות · Phase A · בנייה מחודשת
          </p>
        </header>

        <div className={styles.card}>
          <h2 className={styles.h2}>🚧 בנייה בעיצומה</h2>
          <p style={{ marginBottom: "16px", color: "var(--ink-muted)" }}>
            הגרסה החדשה של SinC-ART נבנית בימים אלה כמערכת מודולרית מקצועית.
            הגרסה הקיימת ממשיכה לעבוד מקומית בקובץ HTML יחיד.
          </p>

          <div
            style={{
              background: "var(--cream-2)",
              border: "1px solid var(--gold-faint)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <strong style={{ color: "var(--navy)" }}>שלבי הפיתוח:</strong>
            <ul style={{ marginTop: "8px", paddingInlineStart: "20px", lineHeight: "2" }}>
              <li>✅ <strong>Phase A</strong> — תשתית, גופנים, צבעים, פריסה</li>
              <li>⏳ <strong>Phase B</strong> — שכבת נתונים מאובטחת (Supabase + API)</li>
              <li>⏳ <strong>Phase C</strong> — העלאת אודיו ותמלול</li>
              <li>⏳ <strong>Phase D</strong> — הצגת ניתוח השיחה</li>
              <li>⏳ <strong>Phase E</strong> — שמירה וקישור ללקוחות</li>
              <li>⏳ <strong>Phase F</strong> — שחרור גרסה סופית</li>
            </ul>
          </div>

          <p style={{ fontSize: "13px", color: "var(--ink-faint)" }}>
            <span className={styles.spinner} style={{ marginInlineEnd: "8px", verticalAlign: "middle" }}></span>
            כשה-Phase הנוכחי יושלם, תופיע כאן הממשק האמיתי.
          </p>
        </div>

        <div className={`${styles.card} ${styles.cardGold}`}>
          <h2 className={styles.h2}>📍 אימות תשתית</h2>
          <p style={{ color: "var(--ink-muted)", fontSize: "14px" }}>
            אם אתה רואה דף זה עם הצבעים הנכונים (כחול-זהב-קרם), הגופן Heebo,
            וטקסט מימין-לשמאל — Phase A הסתיים בהצלחה.
          </p>
        </div>

        <footer style={{ textAlign: "center", marginTop: "32px", fontSize: "12px", color: "var(--ink-faint)" }}>
          SinC-ART · Phase A · 06/05/2026
        </footer>
      </div>
    </div>
  );
}
