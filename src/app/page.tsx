export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-6 py-16">
      <div className="max-w-2xl text-center">
        <p className="text-xs tracking-widest text-stone-500 uppercase mb-4">
          אומנות שעוברת מדור לדור
        </p>

        <h1
          className="text-5xl md:text-6xl font-bold text-stone-900 mb-6 leading-tight"
          style={{ fontFamily: "var(--font-frank-ruhl), serif" }}
        >
          שיש אמנותי
        </h1>

        <p className="text-lg text-stone-700 leading-relaxed mb-8">
          כיורי שיש חצובים ביד, ייחודיים לכל לקוח.
          <br />
          שני אמנים. אבן טבעית. מאות שעות עבודה.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-stone-900 hover:bg-stone-800 text-stone-50 px-8 py-3 rounded font-medium transition-colors">
            לגלריה ←
          </button>
          <button className="bg-white hover:bg-stone-100 border border-stone-300 text-stone-900 px-8 py-3 rounded font-medium transition-colors">
            בקשת הצעת מחיר
          </button>
        </div>

        <p className="text-xs text-stone-400 mt-16">
          גרסה {process.env.NEXT_PUBLIC_APP_VERSION || "30042026-v1"}
        </p>
      </div>
    </main>
  );
}