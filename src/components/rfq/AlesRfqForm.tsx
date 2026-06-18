'use client';

// src/components/rfq/AlesRfqForm.tsx
// Ales's mobile pricing screen. RTL-safe, no horizontal overflow on Android.
import { useState, useMemo } from 'react';
import { submitRfqResponse, RfqRow, RfqAsset } from '@/lib/rfq/rfqData';
import type { OptionRow } from '@/lib/options/optionsCatalog';
import { uploadToCloudinary } from '@/lib/intake/cloudinary';

const ARVO_DARK = '#161616';
const ARVO_GOLD = '#e6c870';

function MediaItem({ asset }: { asset: RfqAsset }) {
  if (asset.kind === 'video') {
    return <video src={asset.url} controls className="w-full max-w-full rounded-md border border-stone-200 bg-black" style={{ maxHeight: 220 }} />;
  }
  if (asset.kind === 'audio') {
    return (
      <div className="w-full max-w-full border border-stone-200 rounded-md p-2 bg-stone-50">
        <div className="text-xs text-stone-500 mb-1">🎤 הקלטת לקוח</div>
        <audio src={asset.url} controls className="w-full max-w-full" />
      </div>
    );
  }
  return (
    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="block w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.url} alt={asset.label || 'מדיה'} className="w-full max-w-full rounded-md border border-stone-200 object-cover" style={{ maxHeight: 240 }} />
    </a>
  );
}

export default function AlesRfqForm({ rfq, options }: { rfq: RfqRow; options: OptionRow[] }) {
  const spec = rfq.questions?.spec || {};
  const assets = Array.isArray(rfq.asset_urls) ? rfq.asset_urls : [];

  const [stonePrice, setStonePrice] = useState(0);
  const [laborPrice, setLaborPrice] = useState(0);
  const [installPrice, setInstallPrice] = useState(0);
  const [deliveryDays, setDeliveryDays] = useState('');
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sitePhotos, setSitePhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [addonPrice, setAddonPrice] = useState<Record<string, number>>({});

  const addonTotal = useMemo(() => options.reduce((s, o) => s + (picked[o.id] ? (Number(addonPrice[o.id]) || 0) : 0), 0), [options, picked, addonPrice]);
  const total = (Number(stonePrice) || 0) + (Number(laborPrice) || 0) + (Number(installPrice) || 0) + addonTotal;

  async function onSitePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const up = await uploadToCloudinary(f, 'ales-site-photos');
        setSitePhotos((prev) => [...prev, up.url]);
      }
    } catch (err) {
      setError('העלאת תמונה נכשלה: ' + (err instanceof Error ? err.message : String(err)));
    }
    setUploading(false);
    e.target.value = '';
  }

  async function send() {
    setError(null);
    if (total <= 0) { setError('הזן מחיר לפני שליחה'); return; }
    setBusy(true);
    const lineItems = [
      stonePrice > 0 ? { desc: 'אבן / חומר', price: Number(stonePrice) } : null,
      laborPrice > 0 ? { desc: 'עבודה / ייצור', price: Number(laborPrice) } : null,
      installPrice > 0 ? { desc: 'התקנה / הובלה', price: Number(installPrice) } : null,
      ...options.filter((o) => picked[o.id]).map((o) => ({ desc: o.name_he, price: Number(addonPrice[o.id]) || 0 })),
    ].filter(Boolean) as { desc: string; price: number }[];

    const res = await submitRfqResponse({
      token: rfq.token,
      lineItems,
      totalIls: total,
      remarkHe: [deliveryDays ? 'אספקה: ' + deliveryDays : '', remark].filter(Boolean).join(' · '),
      sitePhotoUrls: sitePhotos,
    });
    setBusy(false);
    if (!res.ok) { setError('שליחה נכשלה: ' + (res.error || '')); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center overflow-x-hidden" dir="rtl">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: ARVO_GOLD }}>
          <span className="text-3xl" style={{ color: ARVO_DARK }}>✓</span>
        </div>
        <div className="text-xl font-bold text-stone-900">המחיר נשלח, תודה!</div>
        <div className="text-sm text-stone-500 mt-2">אבשי קיבל את ההצעה שלך עבור {rfq.title_he}.</div>
      </div>
    );
  }

  const numInput = (label: string, val: number, set: (n: number) => void) => (
    <label className="block w-full">
      <span className="block text-xs font-medium text-stone-600 mb-1">{label}</span>
      <input type="number" inputMode="numeric" value={val || ''} onChange={(e) => set(Number(e.target.value) || 0)} placeholder="0" className="w-full max-w-full box-border px-2 py-2 text-base border border-stone-300 rounded-md" dir="ltr" />
    </label>
  );

  return (
    <div className="w-full overflow-x-hidden" dir="rtl">
      <div className="w-full max-w-md mx-auto px-3 py-4">
        <div className="rounded-lg p-3 mb-3 flex items-center gap-3" style={{ background: ARVO_DARK }}>
          <div className="w-9 h-9 rounded-md flex items-center justify-center font-bold shrink-0" style={{ background: ARVO_GOLD, color: ARVO_DARK }}>A</div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">תמחור · {rfq.title_he}</div>
            <div className="text-xs truncate" style={{ color: ARVO_GOLD }}>{rfq.project_ref || ''}{rfq.customer_hint ? ' · ' + rfq.customer_hint : ''}</div>
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 mb-3 text-sm text-stone-700 break-words">
          <div className="font-medium text-stone-900 mb-1">{spec.modelName || 'כיור שיש'}{spec.dimensions ? ' · ' + spec.dimensions : ''}</div>
          {spec.stone && (<div className="text-xs text-stone-500">שיש: {spec.stone}</div>)}
          {spec.notes && (<div className="text-xs text-stone-500 mt-1 break-words">{spec.notes}</div>)}
        </div>

        {assets.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-stone-700 mb-2">מהלקוח ({assets.length})</div>
            <div className="space-y-2">
              {assets.map((a, i) => (<MediaItem key={i} asset={a} />))}
            </div>
          </div>
        )}

        {options.length > 0 && (
          <div className="mb-3 border border-stone-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-stone-700 mb-2">תוספות — סמן ותמחר את הרלוונטיות</div>
            <div className="space-y-2">
              {options.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!picked[o.id]} onChange={(e) => setPicked((p) => ({ ...p, [o.id]: e.target.checked }))} className="w-5 h-5 shrink-0" />
                  <span className="flex-1 min-w-0 text-sm text-stone-700 break-words">{o.name_he}</span>
                  {picked[o.id] && (<input type="number" inputMode="numeric" value={addonPrice[o.id] || ''} onChange={(e) => setAddonPrice((p) => ({ ...p, [o.id]: Number(e.target.value) || 0 }))} placeholder="₪" className="w-20 shrink-0 box-border px-2 py-1 text-sm border border-stone-300 rounded text-center" dir="ltr" />)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border border-stone-200 rounded-lg p-3 mb-3 space-y-2">
          <div className="text-xs font-semibold text-stone-700">פירוט המחיר שלך (כולל מע"מ)</div>
          {numInput('אבן / חומר ₪', stonePrice, setStonePrice)}
          {numInput('עבודה / ייצור ₪', laborPrice, setLaborPrice)}
          {numInput('התקנה / הובלה ₪', installPrice, setInstallPrice)}
          <div className="flex items-center justify-between bg-stone-100 rounded-md px-3 py-2 mt-1">
            <span className="text-xs text-stone-600">סה"כ כולל תוספות ומע"מ</span>
            <span className="text-lg font-bold text-stone-900">₪{total.toLocaleString()}</span>
          </div>
        </div>

        <label className="block w-full mb-3">
          <span className="block text-xs font-medium text-stone-600 mb-1">זמן אספקה</span>
          <input value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} placeholder="למשל: 14 ימי עבודה" className="w-full max-w-full box-border px-2 py-2 text-sm border border-stone-300 rounded-md" dir="rtl" />
        </label>

        <label className="block w-full mb-3">
          <span className="block text-xs font-medium text-stone-600 mb-1">הערה</span>
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} className="w-full max-w-full box-border px-2 py-2 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
        </label>

        <div className="mb-3">
          <label className="flex items-center justify-center gap-2 w-full max-w-full box-border py-3 border-2 border-dashed border-stone-300 rounded-lg bg-white cursor-pointer text-sm text-stone-600">
            <span className="text-xl">📷</span>
            <span>{uploading ? 'מעלה...' : 'צלם / צרף תמונת אתר'}</span>
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onSitePhoto} disabled={uploading} />
          </label>
          {sitePhotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {sitePhotos.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={u} alt={'אתר ' + (i + 1)} className="w-16 h-16 object-cover rounded-md border border-stone-200" />
              ))}
            </div>
          )}
        </div>

        {error && (<div className="text-sm text-red-600 mb-2 break-words">{error}</div>)}

        <button onClick={send} disabled={busy} className="w-full max-w-full box-border py-3 rounded-md font-bold text-white disabled:opacity-50" style={{ background: ARVO_DARK }}>{busy ? 'שולח...' : 'שלח הצעה ←'}</button>
        <div className="text-center text-[11px] text-stone-400 mt-2">ההצעה תישלח לאבשי לעיבוד. אינך מתומחר ישירות מול הלקוח.</div>
      </div>
    </div>
  );
}
