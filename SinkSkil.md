# SinkSkil — יומן פיתוח / Build Log

**פרויקט:** Marble Art Sinks CRM (`avshi2-maker/Sinks_ART`)
**דומיין:** https://crm.marble-art.co.il
**סטאק:** Next.js 16 · TypeScript · Tailwind · Supabase · Cloudinary · Vercel
**עדכון אחרון:** 2026-08-27

---

## 2026-08-27 — סיכום כל הבניות (Today's Builds)

### 1. תיקון באג הדפסה — Nav נדפס בתוך הצעת המחיר
- **בעיה:** סרגל הניווט/כותרת ה-CRM נדפסו בתוך ה-PDF של הצעת ARVO.
- **תיקון:** נוספה מחלקת `no-print` + כלל `@media print{.no-print{display:none!important;}}`.
- **קבצים:** `src/components/shared/TopNav.tsx`, `src/app/globals.css`.
- **סטטוס:** ✅ commit + push.

### 2. בנייה מחדש של דף השרטוט — תמיכה ב-1–10 כיורים
- מונה כיורים 1–10 (במקום 2 בלבד), טבלת חלוקה (split) עם חישוב AI + עריכה ידנית.
- שתי אפשרויות רצפה: **משופע (sloped)** / **ישר 90° (flat)**.
- שתי אפשרויות ניקוז: כיור-לכל-אגן (נפרד) / ניקוז מרכזי אחד משותף + הערכת אורך תעלה.
- הערה אדומה + נתונים טכניים ב-footer מתרעננים לכל מודל.
- **קבצים:** `src/lib/sketch/sketchRenderer.ts` (הכללה ל-N כיורים, `FloorType`, `DrainMode`, `BasinCell`, `resolveBasins()`, `estimateCentralDrain()`), `src/components/sketch/SketchBuilder.tsx`.

### 3. בורר שיש (Marble Browser) — קטלוג + דגימות הלקוח
- מודל בחירה עם שני מקורות: **קטלוג** ו-**דגימות הלקוח** (`fetchCustomerSamples`).
- הדגימה הנבחרת מוצגת כתמונה ממוזערת (thumbnail) על השרטוט — כ-data-URI כדי למנוע taint בייצוא PNG.
- תגית "(דגימת לקוח)" ב-footer רק כשהדגימה שייכת ללקוח.
- **קבצים:** `src/components/sketch/MarbleBrowser.tsx`, `src/lib/marble/marbleData.ts` (`CustomerSample`, `fetchCustomerSamples`), `src/components/marble/MarbleManager.tsx` (הדבקת URL מ-Cloudinary).

### 4. גשר להדמיה (Imaging Handoff) — גלריה ↔ בונה פרומפטים
- כפתור **🖼️ הדמיה** בכרטיס: שולח שרטוט + שיש A/B ל-`/prompt-builder`.
- **דפדוף בגלריית השרטוטים** מתוך בונה הפרומפטים.
- **קבצים:** `src/components/demos/DemoCard.tsx` (`sendToImaging()`), `src/components/prompt-builder/PromptBuilderShell.tsx`, `src/components/prompt-builder/SketchGalleryPicker.tsx`, `src/app/(internal)/prompt-builder/page.tsx`, `fetchSketchGallery()`.

### 5. שרטוט סדנה (Workshop Sheet) — כפתור 🏭 בכל שרטוט שמור
- כפתור **🏭 שרטוט סדנה (PDF)** מייצר גיליון עבודה מלא לכל מודול (תוכנית, חתך, כיור בודד, רשימת חיתוך, ניסור, שלבי עבודה א׳–ת׳).
- מודע לסוג רצפה (משופע/ישר); ממפה `pitched`→`sloped`.
- **קבצים:** `src/lib/sketch/workshopSheet.ts` (חדש — `buildWorkshopHtml()`), `src/components/demos/DemoCard.tsx` (`openWorkshop()`).

### 6. רישום שיש OMANIA 120×280 בקטלוג
- הועלה ל-Cloudinary; נרשם ב-DB.
- SQL: `insert into marble_swatches (name_en,name_he,image_url,category,is_active) values ('OMANIA 120x280','אומניה 120×280','<cloudinary url>','קלקטה / פורצלן',true);`
- כפילות בוטלה: `update marble_swatches set is_active=false where image_url='...vk3ocn.png';`

---

## תוצרים חיצוניים (Standalone Deliverables — לא בקוד)

- **גיליונות סדנה:** `workshop_female_6.html/.pdf`, `workshop_male_4.html/.pdf` — שרטוט מלא עם מידות והוראות א׳–ת׳.
- **בקשת מחיר CNC:** `CNC_RFQ_MarbleSinks_40.xlsx` — 40 כיורים / 8 מודולים, 2 אפשרויות (משופע/ישר). לוחות בהספקת המזמין; ה-CNC מתמחר חיתוך בלבד. משופע 157mm/פחת 1.25/31 לוחות מול ישר 150mm/פחת 1.10/27 לוחות.
- **4 פרומפטים Nano Banana:** נשים/6 + גברים/4 × משופע/ישר. עקרון: בלוק מונוליטי אחד רציף, אגנים חצובים פנימה — לא כיורים מונחים (vessel).
- **הצעת מחיר ARVO:** `ARVO_offer_marble_sinks.html/.pdf` — נייר לוגו רשמי, שתי הדמיות (משופע/ישר) בגודל זהה, פירוט לפי אזור, סעיפי כלול/חומר/אספקה, הערת תלייה על קיר עם אביזר מתכת מוסתר. מחיר: משופע 4,500₪/עמדה, ישר 4,000₪/עמדה.

---

## רעיונות בהמתנה (Parked — ראה IDEAS_PARKING.md)
- Cloudinary auto-enhance לתמונות דגימה.
- הצעת ARVO כתבנית לשימוש חוזר באפליקציה.
- מילוי אוטומטי של פרומפטי Nano לכל שרטוט.

---

## פקודת דחיפה (Push)
```
cd C:\SinkS\Sinks_ART
git add -A
git commit -m "SinkSkil: N-basin sketch, marble browser, imaging handoff, workshop sheets, ARVO offer + build log"
git push
```
Vercel יבצע deploy אוטומטי לאחר ה-push.
