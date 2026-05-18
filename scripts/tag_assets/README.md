# Sink Media Tagger

AI-powered asset tagging pipeline for the Marble Art Sinks `sink_media` table.

**Pipeline:** Local images → Claude Sonnet 4.6 vision → 9-facet JSON tags → Cloudinary upload → Supabase row.

---

## One-time setup

```powershell
# From C:\SinkS\Sinks_ART\scripts\tag_assets\
npm install
```

Then add **one new variable** to your existing `C:\SinkS\Sinks_ART\.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get the key at https://console.anthropic.com → Settings → API Keys.

Everything else (Supabase URL/keys, Cloudinary creds) — the tagger reuses what's already in `.env.local` for the CRM. **No duplication.**

---

## Daily usage

### Dry run (no upload, no insert — just see what Claude would tag)
```powershell
node tag_assets.js --folder="C:\SinkS\assets_intake\extracted" --dry-run --limit=3
```

Use this FIRST on any new batch to verify tagging quality before committing rows.

### Live run on small batch
```powershell
node tag_assets.js --folder="C:\SinkS\assets_intake\extracted" --limit=5
```

### Live run on full batch
```powershell
node tag_assets.js --folder="C:\SinkS\assets_intake\extracted"
```

### Re-tag everything (override idempotency)
```powershell
node tag_assets.js --folder="C:\SinkS\assets_intake\extracted" --force
```

---

## What gets tagged

Every image is classified across 9 facets matching the `sink_media` schema:

| Facet | Example values |
|---|---|
| `subject_type` | finished_sink, marble_sample, workshop_process, portrait, bathroom_scene, competitor_research, concept_render, sketch, other |
| `sink_config` | dual_pitch, single_pitch, double_basin, with_cabinet, wall_mounted, freestanding, extra_wide, mixed, unknown |
| `marble_family` | white, beige, cream, grey, black, green, brown, red, blue, multi_color, unknown |
| `veining_intensity` | none, subtle, moderate, dramatic, unknown |
| `room_context` | installed_bathroom, installed_kitchen, workshop, studio_isolated, outdoor, unknown |
| `media_type` | photo, video, sketch_scan, ai_render, 3d_model |
| `quality_tier` | hero, supporting, reference_only, archive |
| `media_source` | ales_workshop, customer_install, nano_banana, competitor_aliexpress, pinterest_ref, dealer_photo, other |
| `has_people` | true / false |

Plus bilingual auto-generated captions (`caption_he` and `caption_en`) and an `ai_confidence` score (0.0–1.0).

---

## Idempotency

The tagger skips files whose `original_filename` already exists in `sink_media`. So running the tagger twice on the same folder is safe — second run is a no-op.

Use `--force` to override this and re-tag everything (useful after improving the prompt).

---

## Cost

Per image: roughly **$0.005–0.010 USD** (Claude Sonnet 4.6 vision).
For 500 images: roughly **$2.50–5.00 USD** total.

The script prints `Total API cost` at the end of every run.

---

## Reviewing the AI's work

After tagging, open Supabase → `sink_media` table. Filter or order by `created_at DESC` to see new rows.

Each row contains:
- The 9 facet columns (the tags Claude assigned)
- `ai_confidence` — Claude's self-rated confidence
- `ai_raw_output` (JSONB) — full model reasoning + token counts + cost
- `human_reviewed` — boolean; flip to `true` after you review

When you correct a tag manually:
1. Update the relevant column directly in Supabase Table Editor
2. Set `human_reviewed = true`
3. Optionally set `human_corrections` (JSONB) to `{"old": {...}, "new": {...}}` to track changes

This builds a feedback dataset — useful later if we want to fine-tune the prompt.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Missing env vars` | `.env.local` not found or var missing | Confirm path; add missing var |
| `SyntaxError: Unexpected token` in JSON parsing | Model returned malformed JSON | Run on that image with `--dry-run`; check `ai_raw_output` |
| `Supabase insert failed: violates check constraint` | Model returned an invalid enum value | Improve prompt; report image to Claude support |
| `Cloudinary upload failed` | Wrong credentials or quota exceeded | Check Cloudinary dashboard |
| `ENOENT: no such file or directory` | Wrong `--folder` path | Use absolute path with quotes |

---

## File structure after install

```
C:\SinkS\Sinks_ART\
├── .env.local                       ← ANTHROPIC_API_KEY added here
├── scripts/
│   └── tag_assets/
│       ├── tag_assets.js            ← the script
│       ├── package.json             ← dependencies (isolated)
│       ├── README.md                ← this file
│       ├── node_modules/            ← installed packages (gitignored)
│       └── package-lock.json
└── (rest of CRM app)
```

---

*Generated for Marble Art Sinks Session 26, May 17 2026.*
