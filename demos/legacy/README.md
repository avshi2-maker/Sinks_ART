# Legacy Demos — SinC-ART Single-File Prototypes

This folder contains the original single-file HTML prototypes for the SinC-ART call intake feature, built between **01/05/2026 and 03/05/2026**. They are kept here for historical reference only.

## What this is

Ten iterations (v1 through v11, with v6 skipped) of a Hebrew RTL audio-call intake demo. Each file is a self-contained HTML page with embedded JS and CSS — early experiments in transcript display, speaker bubble UX, and Claude analysis output.

## Why it's archived

The production SinC-ART implementation now lives at:

```
src/app/sinc/
src/components/sinc/
src/lib/sinc/
```

It is a multi-file Next.js + TypeScript build with proper Cloudinary uploads, ElevenLabs Scribe v1 diarization, Claude Sonnet analysis, Supabase persistence (Phase D), and the shared Phase 15.5 patterns (`ApiCostMeter`, `ExportFooter`, `ReportSnapshot`).

The legacy single-file demos played their role as fast iteration sandboxes. They have been **fully superseded**.

## File index

| File | Date | Notes |
|---|---|---|
| `sinc_art_call_intake_01052026-v1.html` | 01/05/2026 | Initial prototype |
| `sinc_art_call_intake_02052026-v2.html` | 02/05/2026 | |
| `sinc_art_call_intake_02052026-v3.html` | 02/05/2026 | |
| `sinc_art_call_intake_02052026-v4.html` | 02/05/2026 | |
| `sinc_art_call_intake_03052026-v5.html` | 03/05/2026 | |
| `sinc_art_call_intake_03052026-v7.html` | 03/05/2026 | v6 skipped |
| `sinc_art_call_intake_03052026-v8.html` | 03/05/2026 | |
| `sinc_art_call_intake_03052026-v9.html` | 03/05/2026 | |
| `sinc_art_call_intake_03052026-v10.html` | 03/05/2026 | |
| `sinc_art_call_intake_03052026-v11.html` | 03/05/2026 | **Last single-file version** before the multi-file rebuild |

## Rules

- **Do not modify these files.** They are a frozen historical record.
- **Do not link to them from production code.** They are not part of the running app.
- **For new SinC-ART work, edit `src/app/sinc/` and friends — never these demos.**
- If you need to inspect an old behavior, open the file directly in a browser to see how it worked at that point in time.

## Related decision log entries

- 03/05/2026 — SinC-ART call intake demo iterated v5 → v11
- 06/05/2026 — SinC-ART Phase B/C shipped Session 17 cont. (multi-file production build)
- 07/05/2026 — SinC-ART Phase D shipped (save flow to Supabase)
- 07/05/2026 — Phase E (this archive) — demos moved to `demos/legacy/`
