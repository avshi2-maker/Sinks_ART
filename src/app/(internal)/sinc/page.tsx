/**
 * src/app/sinc/page.tsx
 *
 * SinC-ART main route — call intake system.
 * Replaces the Phase A placeholder with the working app:
 *   1. AudioFilePicker — user selects audio file
 *   2. CallProcessingFlow — uploads, transcribes, analyzes, displays
 *
 * Migrated from sinc_art_call_intake_03052026-v7.html
 *
 * Phase B/C — Audio pipeline complete (Session 17, 06/05/2026)
 */

'use client';

import { useState } from 'react';
import styles from '@/styles/sinc.module.css';
import AudioFilePicker from '@/components/sinc/AudioFilePicker';
import CallProcessingFlow from '@/components/sinc/CallProcessingFlow';

interface PickedAudio {
  file:        File;
  durationSec: number;
}

export default function SincPage() {
  const [picked, setPicked] = useState<PickedAudio | null>(null);

  function handleFileSelected(file: File, durationSec: number) {
    setPicked({ file, durationSec });
  }

  function handleCancel() {
    setPicked(null);
  }

  return (
    <div className={`${styles.scope} ${styles.page}`}>
      <div className={styles.container}>
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className={styles.h1}>SinC-ART</h1>
          <p className={styles.subtitle}>
            מערכת קליטת שיחות לקוחות · ניתוח אוטומטי בעברית
          </p>
        </header>

        {!picked && (
          <div className={styles.card}>
            <h2 className={styles.h2}>🎙️ בחר קובץ הקלטה</h2>
            <p style={{ marginBottom: '16px', color: 'var(--ink-muted)', fontSize: '14px' }}>
              העלה הקלטת שיחה עם לקוח. המערכת תתמלל את ההקלטה,
              תזהה את הדוברים, ותפיק ניתוח מובנה בעברית.
            </p>
            <AudioFilePicker onFileSelected={handleFileSelected} />
          </div>
        )}

        {picked && (
          <div className={styles.card}>
            <h2 className={styles.h2}>🪄 עיבוד השיחה</h2>
            <CallProcessingFlow
              file={picked.file}
              durationSec={picked.durationSec}
              onCancel={handleCancel}
            />
          </div>
        )}

        <footer style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: 'var(--ink-faint)' }}>
          SinC-ART · Phase B/C · 06/05/2026
        </footer>
      </div>
    </div>
  );
}
