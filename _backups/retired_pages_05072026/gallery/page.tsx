import Link from "next/link";
import { supabase, type SinkWithImage } from "@/lib/supabase";

export const revalidate = 60;

async function getPublishedSinks(): Promise<SinkWithImage[]> {
  const { data, error } = await supabase
    .from("sinks")
    .select(
      `
      id,
      slug,
      artist_id,
      name_he,
      description_he,
      shape,
      stone_type_he,
      stone_type_en,
      default_dimensions,
      weight_kg,
      price_band,
      source_type,
      ai_prompt,
      ai_model,
      ai_seed,
      source_reference,
      approved_by_artist,
      is_published,
      sort_order,
      created_at,
      updated_at,
      artists!inner ( name_he ),
      sink_images ( cloudinary_url, is_primary )
    `,
    )
    .eq("is_published", true)
    .eq("approved_by_artist", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load sinks:", error);
    return [];
  }
  if (!data) return [];

  return data.map((row) => {
    const primary =
      row.sink_images?.find((img: { is_primary: boolean }) => img.is_primary) ??
      row.sink_images?.[0] ??
      null;

    const artistObj = Array.isArray(row.artists) ? row.artists[0] : row.artists;

    return {
      ...row,
      primary_image_url: primary?.cloudinary_url ?? null,
      artist_name_he: artistObj?.name_he ?? "",
    } as SinkWithImage;
  });
}

function SourceTypeBadge({ sourceType }: { sourceType: string }) {
  if (sourceType === "concept") {
    return (
      <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">
        סקיצה
      </span>
    );
  }
  if (sourceType === "real_photo") {
    return (
      <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded">
        יצירה מקורית
      </span>
    );
  }
  return null;
}

export default async function GalleryPage() {
  const sinks = await getPublishedSinks();

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
            ← חזרה לעמוד הבית
          </Link>
          <h1
            className="text-4xl md:text-5xl font-bold text-stone-900 mt-4 mb-3"
            style={{ fontFamily: "var(--font-frank-ruhl), serif" }}
          >
            גלריית כיורים
          </h1>
          <p className="text-stone-600">
            {sinks.length > 0
              ? `${sinks.length} יצירות זמינות`
              : "הגלריה תתמלא בקרוב"}
          </p>
        </div>

        {sinks.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-lg py-16 px-6 text-center max-w-xl mx-auto">
            <p
              className="text-2xl text-stone-700 mb-3"
              style={{ fontFamily: "var(--font-frank-ruhl), serif" }}
            >
              עדיין לא הוספנו יצירות
            </p>
            <p className="text-stone-500 leading-relaxed">
              האמנים שלנו מצלמים את העבודות בימים אלה.
              <br />
              חזרו בעוד מספר ימים — או צרו קשר ונשמח לתאם פגישה.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 bg-stone-900 hover:bg-stone-800 text-stone-50 px-6 py-2 rounded font-medium transition-colors"
            >
              חזרה לעמוד הבית
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sinks.map((sink) => (
              <Link
                key={sink.id}
                href={`/sink/${sink.slug}`}
                className="bg-white border border-stone-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                  {sink.primary_image_url ? (
                    <img
                      src={sink.primary_image_url}
                      alt={sink.name_he}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-stone-300 text-sm">תמונה תיווסף בקרוב</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3
                      className="text-lg font-medium text-stone-900"
                      style={{ fontFamily: "var(--font-frank-ruhl), serif" }}
                    >
                      {sink.name_he}
                    </h3>
                    <SourceTypeBadge sourceType={sink.source_type} />
                  </div>
                  <p className="text-sm text-stone-600 mb-1">
                    {sink.artist_name_he} · {sink.stone_type_he}
                  </p>
                  {sink.default_dimensions && (
                    <p className="text-xs text-stone-400">
                      {sink.default_dimensions} ס&quot;מ
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
