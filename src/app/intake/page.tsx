/**
 * src/app/intake/page.tsx — v3 (Session 17: MP4 routing added)
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 04/05/2026
 * Updated: 06/05/2026 (Session 17: routes 'mp4' mediaType to Mp4Analyzer)
 */

'use client';

import { useState } from 'react';
import { supabase, CustomerWithProject, MediaTypeDB } from '@/lib/supabase';
import CustomerPicker from '@/components/intake/CustomerPicker';
import MediaInput, { MediaSelection } from '@/components/intake/MediaInput';
import PhotoAnalyzer, { AnalysisResult } from '@/components/intake/analyzers/PhotoAnalyzer';
import Mp4Analyzer from '@/components/intake/analyzers/Mp4Analyzer';
import ApiCallStatus, { ApiCallStatusData } from '@/components/intake/ApiCallStatus';

type SaveState = 'idle' | 'saving' | 'success' | 'error';

const IDLE_STATUS: ApiCallStatusData = {
  stage:       'idle',
  moduleLabel: '',
  startedAt:   0,
};

export default function IntakePage() {
  const [customer, setCustomer] = useState<CustomerWithProject | null>(null);
  const [media, setMedia] = useState<MediaSelection | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMsg, setSaveMsg] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<ApiCallStatusData>(IDLE_STATUS);

  async function saveAnalysis(result: AnalysisResult) {
    if (!customer) {
      setSaveState('error');
      setSaveMsg('שגיאה: לא נבחר לקוח');
      return;
    }

    setSaveState('saving');
    setSaveMsg('');

    try {
      const commType: MediaTypeDB = result.mediaType;
      const subjectKind = result.mediaType === 'sketch' ? 'שרטוט'
                       : result.mediaType === 'mp4'    ? 'סרטון'
                       : 'תמונה';

      const { data: commRow, error: commErr } = await supabase
        .from('customer_communications')
        .insert({
          customer_id:  customer.customer.id,
          project_id:   customer.activeProject?.id || null,
          comm_type:    commType,
          subject:      'ניתוח ' + subjectKind + ': ' + result.sourceFilename,
          body:         result.designIntentHe || result.referenceSummaryHe || '',
          api_cost_usd: result.apiCostUsd,
          ai_analysis:  result.rawJson || {},
        })
        .select('id')
        .single();

      if (commErr || !commRow) {
        throw new Error('customer_communications insert failed: ' + (commErr?.message || 'no row returned'));
      }

      const { error: maErr } = await supabase.from('media_analyses').insert({
        comm_id:               commRow.id,
        customer_id:           customer.customer.id,
        project_id:            customer.activeProject?.id || null,
        media_type:            result.mediaType,
        source_url:            null,
        cloudinary_url:        result.cloudinaryUrl,
        thumbnail_url:         null,
        source_filename:       result.sourceFilename,
        extracted_dimensions:  result.extractedDimensions,
        extracted_stone_type:  result.extractedStoneType,
        extracted_shape:       result.extractedShape,
        design_intent_he:      result.designIntentHe,
        reference_summary_he:  result.referenceSummaryHe,
        ai_full_report:        result.rawJson,
        status:                'analyzed',
        api_cost_usd:          result.apiCostUsd,
      });

      if (maErr) {
        throw new Error('media_analyses insert failed: ' + maErr.message);
      }

      setSaveState('success');
      setSaveMsg('✓ נשמר בהצלחה. סה״כ עלות API: $' + result.apiCostUsd.toFixed(4));
      setMedia(null);
    } catch (e) {
      setSaveState('error');
      setSaveMsg(e instanceof Error ? e.message : 'שגיאה לא ידועה');
    }
  }

  function cancelAnalysis() {
    setMedia(null);
  }

  // Determine which analyzer to render based on detected media type
  const showPhotoAnalyzer =
    media &&
    media.mode === 'file' &&
    media.file &&
    (media.mediaType === 'photo' || media.mediaType === 'sketch');

  const showMp4Analyzer =
    media &&
    media.mode === 'file' &&
    media.file &&
    media.mediaType === 'mp4';

  const otherTypeNotImplementedMessage =
    media && !showPhotoAnalyzer && !showMp4Analyzer
      ? media.mediaType === 'youtube' || media.mediaType === 'instagram' || media.mediaType === 'url'
        ? 'ניתוח קישורים יבוא בעדכון הבא. בינתיים תוכל לטפל ב-תמונות, שרטוטים וסרטונים.'
        : media.mediaType === 'pdf'
        ? 'ניתוח PDF יבוא בעדכון הבא. בינתיים תוכל לטפל ב-תמונות, שרטוטים וסרטונים.'
        : null
      : null;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">קליטת חומרי הפניה</h1>
          <p className="text-sm text-gray-600 mt-1">
            העלאת תמונות / שרטוטים / סרטונים מלקוחות → ניתוח אוטומטי → שמירה לפרויקט
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-5">
            <section>
              <CustomerPicker onSelect={setCustomer} />
            </section>

            {customer && (
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm">
                לקוח נבחר: <strong>{customer.customer.name_he}</strong>
                {customer.activeProject ? (
                  <> · פרויקט פעיל: {customer.activeProject.title_he} [{customer.activeProject.status}]</>
                ) : (
                  <> · אין פרויקט פעיל (ייווצר אוטומטית בשמירה)</>
                )}
              </div>
            )}

            {customer && (
              <section className="border-t pt-5">
                <h2 className="text-sm font-medium text-gray-900 mb-2">בחר חומר הפניה:</h2>
                <MediaInput onChange={setMedia} disabled={saveState === 'saving'} />
              </section>
            )}

            {showPhotoAnalyzer && media && media.file && (
              <section className="border-t pt-5">
                <PhotoAnalyzer
                  file={media.file}
                  mediaType={media.mediaType === 'sketch' ? 'sketch' : 'photo'}
                  customer={customer}
                  onComplete={saveAnalysis}
                  onCancel={cancelAnalysis}
                  onStatusChange={setApiStatus}
                />
              </section>
            )}

            {showMp4Analyzer && media && media.file && (
              <section className="border-t pt-5">
                <Mp4Analyzer
                  file={media.file}
                  customer={customer}
                  onComplete={saveAnalysis}
                  onCancel={cancelAnalysis}
                  onStatusChange={setApiStatus}
                />
              </section>
            )}

            {otherTypeNotImplementedMessage && (
              <section className="border-t pt-5">
                <div className="bg-amber-50 border border-amber-200 rounded px-3 py-3 text-sm text-amber-900">
                  ℹ️ {otherTypeNotImplementedMessage}
                </div>
              </section>
            )}

            {saveState !== 'idle' && (
              <section className="border-t pt-5">
                {saveState === 'saving' && <div className="text-sm text-gray-600">💾 שומר...</div>}
                {saveState === 'success' && (
                  <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                    {saveMsg}
                  </div>
                )}
                {saveState === 'error' && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    ⚠️ {saveMsg}
                  </div>
                )}
              </section>
            )}
          </div>

          <aside>
            <ApiCallStatus status={apiStatus} />
          </aside>
        </div>

        <footer className="text-xs text-gray-500 mt-4 text-center">
          Phase 15 · Multi-Format Media Intake · v1.6
        </footer>
      </div>
    </main>
  );
}
