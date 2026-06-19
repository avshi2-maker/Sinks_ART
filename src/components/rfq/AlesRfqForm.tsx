'use client';

// src/components/rfq/AlesRfqForm.tsx
// Ales's mobile pricing screen. MULTI-SINK: one pricing block per sink, each with
// A) full price (mandatory), B) installation (included / +price), C) misc (+price + text).
// RTL-safe, no horizontal overflow on Android (all the v2 overflow guards preserved).
import { useState, useMemo } from 'react';
import { submitRfqResponse, RfqRow, RfqAsset, RfqSink } from '@/lib/rfq/rfqData';
import type { OptionRow } from '@/lib/options/optionsCatalog';
import { uploadToCloudinary } from '@/lib/intake/cloudinary';

const ARVO_DARK = '#161616';
const ARVO_GOLD = '#e6c870';

// Resolve sinks from an RFQ (new sinks[] or legacy single spec) — mirrors sinksFromRfq.
function resolveSinks(rfq: RfqRow): RfqSink[] {
  const q = rfq.questions || {};
  if (Array.isArray(q.sinks) && q.sinks.length > 0) return q.sinks;
  const s = q.spec || {};
  return [{ id: 'legacy-1', name: s.modelName || rfq.title_he || 'כיור', dimensions: s.dimensions, stone: s.stone, notes: s.notes }];
}

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

// per-sink pricing state
interface SinkPrice {
  full: number;            // A) מחיר מלא (mandatory)
  installMode: 'included' | 'extra'; // B) התקנה
  installPrice: number;    // when extra
  miscPrice: number;       // C) שונות price
  miscText: string;        // C) שונות text
}

function emptyPrice(): SinkPrice {
  return { full: 0, installMode: 'included', installPrice: 0, miscPrice: 0, miscText: '' };
}

export default function AlesRfqForm({ rfq, options }: { rfq: RfqRow; options: OptionRow[] }) {
  const sinks = useMemo(() => resolveSinks(rfq), [rfq]);
  const assets = Array.isArray(rfq.asset_urls) ? rfq.asset_urls : [];

  const [prices, setPrices] = useState<Record<string, SinkPrice>>(() => {
    const init: Record<string, SinkPrice> = {};
    sinks.forEach((s) => { init[s.id] = emptyPrice(); });
    return init;
  });

  const [deliveryDays, setDeliveryDays] = useState('');
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sitePhotos, setSitePhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [addonPrice, setAddonPrice] = useState<Record<string, number>>({});

  function setP(id: string, patch: Partial<SinkPrice>) {
    setPrices((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const addonTotal = useMemo(() => options.reduce((s, o) => s + (picked[o.id] ? (Number(addonPrice[o.id]) || 0) : 0), 0), [options, picked, addonPrice]);

  const sinkTotal = (p: SinkPrice) => (Number(p.full) || 0) + (p.installMode === 'extra' ? (Number(p.installPrice) || 0) : 0) + (Number(p.miscPrice) || 0);

  const total = useMemo(() => {
    let t = addonTotal;
    sinks.forEach((s) => { t += sinkTotal(prices[s.id] || emptyPrice()); });
    return t;
  }, [sinks, prices, addonTotal]);

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
    // validate: every sink must have a full price
    for (const s of sinks) {
      const p = prices[s.id] || emptyPrice();
      if (!p.full || p.full <= 0) { setError('הזן מחיר מלא לכל כיור (חסר: ' + s.name + ')'); return; }
    }
    if (total <= 0) { setError('הזן מחיר לפני שליחה'); return; }
    setBusy(true);

    const lineItems: { desc: string; price: number }[] = [];
    sinks.forEach((s) => {
      const p = prices[s.id] || emptyPrice();
      lineItems.push({ desc: s.name + ' — מחיר מלא', price: Number(p.full) || 0 });
      if (p.installMode === 'extra' && (Number(p.installPrice) || 0) > 0) {
        lineItems.push({ desc: s.name + ' — התקנה', price: Number(p.installPrice) || 0 });
      }
      if ((Number(p.miscPrice) || 0) > 0) {
        lineItems.push({ desc: s.name + ' — ' + (p.miscText.trim() || 'שונות'), price: Number(p.miscPrice) || 0 });
      }
    });
    options.filter((o) => picked[o.id]).forEach((o) => {
      lineItems.push({ desc: o.name_he, price: Number(addonPrice[o.id]) || 0 });
    });

    // collect per-sink install-included notes + per-sink misc text (no price) into the remark
    const notes: string[] = [];
    sinks.forEach((s) => {
      const p = prices[s.id] || emptyPrice();
      if (p.installMode === 'included') notes.push(s.name + ': המחיר כולל התקנה');
      if (p.miscText.trim() && (Number(p.miscPrice) || 0) <= 0) notes.push(s.name + ': ' + p.miscText.trim());
    });
    const remarkParts = [deliveryDays ? 'אספקה: ' + deliveryDays : '', notes.join(' · '), remark].filter(Boolean);

    const res = await submitRfqResponse({
      token: rfq.token,
      lineItems,
      totalIls: total,
      remarkHe: remarkParts.join(' · '),
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

        {assets.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-stone-700 mb-2">מהלקוח ({assets.length})</div>
            <div className="space-y-2">
              {assets.map((a, i) => (<MediaItem key={i} asset={a} />))}
            </div>
          </div>
        )}

        {/* one pricing block per sink */}
        {sinks.map((s, idx) => {
          const p = prices[s.id] || emptyPrice();
          return (
            <div key={s.id} className="mb-3 border border-stone-300 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-stone-100 border-b border-stone-200">
                <div className="text-sm font-bold text-stone-900 break-words">כיור {idx + 1}: {s.name}</div>
                {(s.dimensions || s.stone) && (<div className="text-xs text-stone-500 break-words">{[s.dimensions, s.stone].filter(Boolean).join(' · ')}</div>)}
                {s.notes && (<div className="text-xs text-stone-500 mt-0.5 break-words">{s.notes}</div>)}
              </div>
              <div className="p-3 space-y-3">
                {/* A) full price */}
                <label className="block w-full">
                  <span className="block text-xs font-semibold text-stone-700 mb-1">א. מחיר מלא ₪ (כולל מע"מ) *</span>
                  <input type="number" inputMode="numeric" value={p.full || ''} onChange={(e) => setP(s.id, { full: Number(e.target.value) || 0 })} placeholder="0" className="w-full max-w-full box-border px-2 py-2 text-base border border-stone-300 rounded-md" dir="ltr" />
                </label>

                {/* B) installation */}
                <div className="w-full">
                  <span className="block text-xs font-semibold text-stone-700 mb-1">ב. התקנה</span>
                  <select value={p.installMode} onChange={(e) => setP(s.id, { installMode: e.target.value as 'included' | 'extra' })} className="w-full max-w-full box-border px-2 py-2 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
                    <option value="included">המחיר כולל התקנה</option>
                    <option value="extra">תוספת התקנה (הזן מחיר)</option>
                  </select>
                  {p.installMode === 'extra' && (
                    <input type="number" inputMode="numeric" value={p.installPrice || ''} onChange={(e) => setP(s.id, { installPrice: Number(e.target.value) || 0 })} placeholder="מחיר התקנה ₪" className="w-full max-w-full box-border px-2 py-2 text-sm border border-stone-300 rounded-md mt-2" dir="ltr" />
                  )}
                </div>

                {/* C) misc */}
                <div className="w-full">
                  <span className="block text-xs font-semibold text-stone-700 mb-1">ג. שונות / הערה (לא חובה)</span>
                  <input value={p.miscText} onChange={(e) => setP(s.id, { miscText: e.target.value })} placeholder="תיאור (לדוגמה: חיתוך מיוחד)" className="w-full max-w-full box-border px-2 py-2 text-sm border border-stone-300 rounded-md" dir="rtl" />
                  <input type="number" inputMode="numeric" value={p.miscPrice || ''} onChange={(e) => setP(s.id, { miscPrice: Number(e.target.value) || 0 })} placeholder="תוספת מחיר ₪ (אם יש)" className="w-full max-w-full box-border px-2 py-2 text-sm border border-stone-300 rounded-md mt-2" dir="ltr" />
                </div>

                <div className="flex items-center justify-between bg-stone-50 rounded-md px-3 py-1.5">
                  <span className="text-xs text-stone-500">סה"כ כיור זה</span>
                  <span className="text-sm font-bold text-stone-900">₪{sinkTotal(p).toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* add-ons */}
        {options.length > 0 && (
          <div className="mb-3 border border-stone-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-stone-700 mb-2">תוספות — סמן ותמחר את הרלוונטיות</div>
            <div className="space-y-2">
              {options.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!picked[o.id]} onChange={(e) => setPicked((pp) => ({ ...pp, [o.id]: e.target.checked }))} className="w-5 h-5 shrink-0" />
                  <span className="flex-1 min-w-0 text-sm text-stone-700 break-words">{o.name_he}</span>
                  {picked[o.id] && (<input type="number" inputMode="numeric" value={addonPrice[o.id] || ''} onChange={(e) => setAddonPrice((pp) => ({ ...pp, [o.id]: Number(e.target.value) || 0 }))} placeholder="₪" className="w-20 shrink-0 box-border px-2 py-1 text-sm border border-stone-300 rounded text-center" dir="ltr" />)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* grand total */}
        <div className="flex items-center justify-between bg-stone-900 text-white rounded-md px-3 py-3 mb-3">
          <span className="text-sm">סה"כ כללי (עלות אלס, כולל מע"מ)</span>
          <span className="text-lg font-bold">₪{total.toLocaleString()}</span>
        </div>

        <label className="block w-full mb-3">
          <span className="block text-xs font-medium text-stone-600 mb-1">זמן אספקה</span>
          <input value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} placeholder="למשל: 14 ימי עבודה" className="w-full max-w-full box-border px-2 py-2 text-sm border border-stone-300 rounded-md" dir="rtl" />
        </label>

        <label className="block w-full mb-3">
          <span className="block text-xs font-medium text-stone-600 mb-1">הערה כללית</span>
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
