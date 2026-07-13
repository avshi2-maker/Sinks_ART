"use client";

import { useState } from "react";
import { submitLead } from "@/app/actions";
import { PhoneInput, validateIsraeliPhone } from "./PhoneInput";
import { useSelection } from "@/context/SelectionContext";

const BUDGET_TIERS = [
  { value: "tier_1_8k_15k", label: "8,000 - 15,000 ₪", desc: "תקציב יעיל" },
  { value: "tier_2_15k_25k", label: "15,000 - 25,000 ₪", desc: "סטנדרט פרימיום" },
  { value: "tier_3_25k_50k", label: "25,000 - 50,000 ₪", desc: "אומנותי" },
  { value: "tier_4_50k_plus", label: "50,000+ ₪", desc: "יצירת מופת" },
];

const PROJECT_TYPES = [
  { value: "renovation", label: "שיפוץ" },
  { value: "new_construction", label: "בנייה חדשה" },
  { value: "replacement", label: "החלפה" },
  { value: "commercial", label: "מסחרי" },
];

const ICON_WALL = "M4 5h16M6 9h12v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9zM9 17l-1 2M15 17l1 2";
const ICON_CABINET = "M5 4h14v6H5zM5 10v9M19 10v9M5 19h14M9 13v3M15 13v3";
const ICON_SIDE = "M3 8h18v3H3zM6 11v8M18 11v8M3 19h18M8 4h8v4H8z";
const ICON_CORNER = "M4 4v16h16M4 4h8v8h8M8 12v4M12 16h4";
const ICON_UNSURE = "M12 19a1 1 0 1 0 0 .01M9 9a3 3 0 1 1 4 2.8c-.8.4-1 1-1 1.7v.5";

const MOUNT_TYPES = [
  { value: "wall_hung", label: "כיור תלוי על קיר", icon: ICON_WALL },
  { value: "on_cabinet", label: "כיור על ארון", icon: ICON_CABINET },
  { value: "side_counters", label: "כיור עם משטחי שיש מהצד", icon: ICON_SIDE },
  { value: "corner", label: "כיור פינתי", icon: ICON_CORNER },
  { value: "unsure", label: "לא בטוח/ה — נחליט יחד", icon: ICON_UNSURE },
];

const SIZE_BUCKETS = [
  { value: "narrow", label: "צר", desc: "מתאים לשירותי אורחים (~40-50 ס\"מ)" },
  { value: "standard", label: "בינוני", desc: "אמבטיה סטנדרטית (~60-80 ס\"מ)" },
  { value: "wide", label: "רחב", desc: "אמבטיה גדולה / כיור זוגי (120-240 ס\"מ)" },
  { value: "unsure", label: "לא בטוח/ה", desc: "אמדוד עם נציג שלכם" },
];

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dqdku88vv";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_LEAD_PRESET || "marble_lead_uploads";
const BUSINESS_WHATSAPP = "972505231042";
const MAX_FILES = 5;
const MAX_SIZE_MB = 10;
const ACCEPTED = ".jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf";

type UploadedFile = { name: string; url: string; type: string };
type PickInfo = { name: string; section: string };
type SubmittedLead = { full_name: string; phone: string; city_he: string; project_type: string; budget_tier: string; mount_type: string; size_bucket: string; notes_he: string; files: UploadedFile[]; picks: PickInfo[] };

function trackEvent(eventName: string, params: Record<string, string | number>) {
  if (typeof window !== "undefined") {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") { w.gtag("event", eventName, params); }
  }
}

function labelFor(list: { value: string; label: string }[], val: string): string {
  return list.find((x) => x.value === val)?.label || "—";
}

function buildWhatsAppMessage(lead: SubmittedLead): string {
  const lines = [
    "שלום, מילאתי טופס באתר מרבל ארט:",
    "",
    `שם: ${lead.full_name}`,
    `טלפון: ${lead.phone}`,
    lead.city_he ? `עיר: ${lead.city_he}` : "",
    `סוג פרויקט: ${labelFor(PROJECT_TYPES, lead.project_type)}`,
    `סוג התקנה: ${labelFor(MOUNT_TYPES, lead.mount_type)}`,
    `גודל משוער: ${labelFor(SIZE_BUCKETS, lead.size_bucket)}`,
    `תקציב: ${labelFor(BUDGET_TIERS, lead.budget_tier)}`,
    lead.notes_he ? `הערות: ${lead.notes_he}` : "",
  ];
  if (lead.picks.length > 0) {
    lines.push("");
    lines.push("הפריטים שבחרתי מהגלריה:");
    lead.picks.forEach((p, i) => { lines.push(`${i + 1}. ${p.name} (${p.section})`); });
  }
  if (lead.files.length > 0) {
    lines.push("");
    lines.push("קבצים מצורפים:");
    lead.files.forEach((f, i) => { lines.push(`${i + 1}. ${f.url}`); });
  }
  return lines.filter((l) => l !== "").join("\n");
}

export function LeadForm() {
  const { items: picks, remove: removePick, clear: clearPicks, count: pickCount } = useSelection();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedLead | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setUploadError(null);
    if (files.length + selected.length > MAX_FILES) {
      setUploadError(`ניתן להעלות עד ${MAX_FILES} קבצים.`);
      return;
    }
    setUploading(true);
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(selected)) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`הקובץ "${file.name}" גדול מדי (מקסימום ${MAX_SIZE_MB} מגה).`);
        continue;
      }
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", UPLOAD_PRESET);
        const isImage = file.type.startsWith("image/");
        const endpoint = isImage ? "image" : (file.type.startsWith("video/") ? "video" : "auto");
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`, { method: "POST", body: fd });
        if (!res.ok) { setUploadError(`שגיאה בהעלאת "${file.name}". נסו שוב.`); continue; }
        const data = await res.json();
        if (data.secure_url) { newFiles.push({ name: file.name, url: data.secure_url, type: file.type }); }
      } catch {
        setUploadError(`שגיאה בהעלאת "${file.name}". נסו שוב.`);
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setUploading(false);
    e.target.value = "";
  }

  function removeFile(url: string) {
    setFiles((prev) => prev.filter((f) => f.url !== url));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const phone = (formData.get("phone") as string)?.trim() || "";
    const phoneCheck = validateIsraeliPhone(phone);
    if (!phoneCheck.ok) {
      setError("אנא הזינו מספר טלפון ישראלי תקין (נייד או קווי).");
      return;
    }
    formData.set("phone", phoneCheck.normalized);
    const mountType = (formData.get("mount_type") as string) || "";
    const sizeBucket = (formData.get("size_bucket") as string) || "";
    setPending(true);
    const userNotes = ((formData.get("notes_he") as string) || "").trim();
    const structured = [
      mountType ? `סוג התקנה: ${labelFor(MOUNT_TYPES, mountType)}` : "",
      sizeBucket ? `גודל משוער: ${labelFor(SIZE_BUCKETS, sizeBucket)}` : "",
      picks.length > 0 ? `בחירות מהגלריה: ${picks.map((p) => p.name).join(", ")}` : "",
    ].filter((s) => s !== "").join(" | ");
    const combinedNotes = [userNotes, structured].filter((s) => s !== "").join("\n");
    formData.set("notes_he", combinedNotes);
    formData.set("inspiration_urls_json", JSON.stringify([...files.map((f) => f.url), ...picks.map((p) => p.thumbnailUrl)]));
    const result = await submitLead(formData);
    setPending(false);
    if (result.success) {
      setSubmitted({
        full_name: (formData.get("full_name") as string) || "",
        phone: phoneCheck.normalized,
        city_he: ((formData.get("city_he") as string) || "").trim(),
        project_type: (formData.get("project_type") as string) || "",
        budget_tier: (formData.get("budget_tier") as string) || "",
        mount_type: mountType,
        size_bucket: sizeBucket,
        notes_he: userNotes,
        files,
        picks: picks.map((p) => ({ name: p.name, section: p.section })),
      });
      trackEvent("lead_submitted", { picks: picks.length, files: files.length });
      clearPicks();
      setDone(true);
    } else {
      setError(result.error);
    }
  }

  if (done && submitted) {
    const waMessage = encodeURIComponent(buildWhatsAppMessage(submitted));
    const waHref = `https://wa.me/${BUSINESS_WHATSAPP}?text=${waMessage}`;
    const onWaClick = () => trackEvent("whatsapp_lead_sent", { location: "thank_you", files: submitted.files.length, picks: submitted.picks.length });
    return (
      <div className="bg-[var(--color-cream)] border-2 border-[var(--color-brass)] rounded-2xl p-10 md:p-14 text-center">
        <div className="w-16 h-16 bg-[var(--color-brass)] rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-[var(--color-charcoal)] text-3xl font-black">✓</span>
        </div>
        <h3 className="text-[var(--color-charcoal)] text-3xl font-black mb-4">תודה רבה!</h3>
        <p className="text-[var(--color-charcoal)]/70 text-lg max-w-md mx-auto leading-relaxed mb-8">קיבלנו את הפרטים. כדי שנחזור אליכם מהר יותר — שלחו לנו את הפרטים גם בוואטסאפ בלחיצה אחת:</p>
        <p className="text-[var(--color-charcoal)]/50 text-sm mt-6">או שנציג יחזור אליכם תוך 24-48 שעות.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--color-cream)] rounded-2xl p-6 md:p-10 shadow-lg">
      {pickCount > 0 && (
        <div className="bg-[var(--color-brass)]/10 border-2 border-[var(--color-brass)]/40 rounded-xl p-5">
          <p className="text-[var(--color-charcoal)] font-bold text-sm mb-3">הבחירות שלכם מהגלריה ({pickCount}):</p>
          <div className="flex flex-wrap gap-3">
            {picks.map((p) => (
              <div key={p.id} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbnailUrl} alt={p.name} className="w-16 h-16 rounded-lg object-cover border border-[var(--color-cream-darker)]" />
                <button type="button" onClick={() => removePick(p.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600" aria-label="הסר">×</button>
                <p className="text-[var(--color-charcoal)]/60 text-[10px] text-center mt-1 max-w-16 truncate">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="full_name" className="block text-[var(--color-charcoal)] font-medium mb-2 text-sm">שם מלא *</label>
          <input id="full_name" name="full_name" required className="w-full px-4 py-3 border border-[var(--color-cream-darker)] rounded-lg bg-white text-[var(--color-charcoal)] focus:border-[var(--color-brass)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/20 transition-all" placeholder="ישראל ישראלי" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-[var(--color-charcoal)] font-medium mb-2 text-sm">טלפון *</label>
          <PhoneInput id="phone" name="phone" required placeholder="050-1234567" />
        </div>
      </div>

      <div>
        <label htmlFor="city_he" className="block text-[var(--color-charcoal)] font-medium mb-2 text-sm">עיר</label>
        <input id="city_he" name="city_he" className="w-full px-4 py-3 border border-[var(--color-cream-darker)] rounded-lg bg-white text-[var(--color-charcoal)] focus:border-[var(--color-brass)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/20 transition-all" placeholder="תל אביב, ירושלים, חיפה..." />
      </div>

      <div>
        <label className="block text-[var(--color-charcoal)]/70 font-medium mb-3 text-sm">סוג פרויקט (אופציונלי)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROJECT_TYPES.map((p) => (
            <label key={p.value} className="cursor-pointer">
              <input type="radio" name="project_type" value={p.value} className="sr-only peer" />
              <div className="px-4 py-3 border-2 border-[var(--color-cream-darker)] rounded-lg bg-white text-center text-sm transition-all peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/10 hover:border-[var(--color-brass)]/50">{p.label}</div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[var(--color-charcoal)] font-medium mb-1 text-sm">איך הכיור מותקן? (אופציונלי)</label>
        <p className="text-[var(--color-charcoal)]/50 text-xs mb-3">לא בטוחים? בחרו "לא בטוח/ה" ונעבור על זה יחד.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MOUNT_TYPES.map((m) => (
            <label key={m.value} className="cursor-pointer">
              <input type="radio" name="mount_type" value={m.value} className="sr-only peer" />
              <div className="flex flex-col items-center gap-2 px-3 py-4 border-2 border-[var(--color-cream-darker)] rounded-lg bg-white text-center text-xs transition-all peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/10 hover:border-[var(--color-brass)]/50">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-brass-dark)]"><path d={m.icon} /></svg>
                <span className="text-[var(--color-charcoal)] leading-tight">{m.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[var(--color-charcoal)] font-medium mb-1 text-sm">גודל משוער (אופציונלי)</label>
        <p className="text-[var(--color-charcoal)]/50 text-xs mb-3">אין צורך למדוד בדיוק — בחרו את מה שהכי קרוב. אלס ימדוד במדויק בהמשך.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SIZE_BUCKETS.map((s) => (
            <label key={s.value} className="cursor-pointer">
              <input type="radio" name="size_bucket" value={s.value} className="sr-only peer" />
              <div className="px-3 py-3 border-2 border-[var(--color-cream-darker)] rounded-lg bg-white text-center transition-all peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/10 hover:border-[var(--color-brass)]/50">
                <div className="font-bold text-[var(--color-charcoal)] text-sm">{s.label}</div>
                <div className="text-[var(--color-charcoal)]/55 text-[11px] mt-1 leading-tight">{s.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[var(--color-charcoal)]/70 font-medium mb-3 text-sm">תקציב משוער (אופציונלי)</label>
        <div className="grid md:grid-cols-2 gap-3">
          {BUDGET_TIERS.map((b) => (
            <label key={b.value} className="cursor-pointer">
              <input type="radio" name="budget_tier" value={b.value} className="sr-only peer" />
              <div className="px-5 py-4 border-2 border-[var(--color-cream-darker)] rounded-lg bg-white transition-all peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/10 hover:border-[var(--color-brass)]/50">
                <div className="font-bold text-[var(--color-charcoal)]">{b.label}</div>
                <div className="text-sm text-[var(--color-charcoal)]/60 mt-1">{b.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="notes_he" className="block text-[var(--color-charcoal)] font-medium mb-2 text-sm">הערות (אופציונלי)</label>
        <textarea id="notes_he" name="notes_he" rows={4} className="w-full px-4 py-3 border border-[var(--color-cream-darker)] rounded-lg bg-white text-[var(--color-charcoal)] focus:border-[var(--color-brass)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/20 transition-all resize-none" placeholder="תארו במילים שלכם — אל תדאגו לדיוק. לדוגמה: רוחב הקיר בערך 1.20 מטר, יש חלון מימין..." />
      </div>

      <div>
        <label className="block text-[var(--color-charcoal)] font-medium mb-2 text-sm">צרפו תמונות / סרטונים / מסמכים (אופציונלי)</label>
        <p className="text-[var(--color-charcoal)]/50 text-xs mb-3">טיפ: צלמו את החלל עם טלפון או כרטיס אשראי לצידו — זה עוזר לנו להעריך מידות. עד {MAX_FILES} קבצים, {MAX_SIZE_MB} מגה לקובץ.</p>
        <label htmlFor="lead_files" className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-[var(--color-cream-darker)] rounded-lg bg-white cursor-pointer hover:border-[var(--color-brass)]/50 transition-all">
          <span className="text-[var(--color-brass-dark)] text-3xl mb-2">↑</span>
          <span className="text-[var(--color-charcoal)]/70 text-sm">{uploading ? "מעלה קבצים..." : "לחצו לבחירת קבצים או גררו לכאן"}</span>
        </label>
        <input id="lead_files" type="file" accept={ACCEPTED} multiple onChange={handleFileSelect} disabled={uploading || files.length >= MAX_FILES} className="hidden" />
        {uploadError && (<div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{uploadError}</div>)}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f) => (
              <div key={f.url} className="flex items-center justify-between bg-white border border-[var(--color-cream-darker)] rounded-lg px-4 py-2">
                <span className="text-[var(--color-charcoal)]/80 text-sm truncate ml-3">{f.name}</span>
                <button type="button" onClick={() => removeFile(f.url)} className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0">הסר</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>)}

      <button type="submit" disabled={pending || uploading} className="w-full bg-[var(--color-charcoal)] text-[var(--color-cream)] py-5 rounded-full font-bold text-lg hover:bg-[var(--color-brass)] hover:text-[var(--color-charcoal)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300">{pending ? "שולח..." : "שלחו אלינו פרטים ←"}</button>

      <p className="text-center text-[var(--color-charcoal)]/50 text-xs">לא נשלח ספאם. נציג יחזור אליכם תוך 24-48 שעות בוואטסאפ.</p>
    </form>
  );
}
