-- ════════════════════════════════════════════════════════════════
-- Phase D — Add 'audio' to media_analyses.media_type whitelist
-- ════════════════════════════════════════════════════════════════
--
-- Context: /sinc (SinC-ART) call analysis save flow needs to write
-- one row to media_analyses with media_type='audio'. The existing
-- check constraint only allows visual media types (photo, sketch,
-- mp4, pdf, youtube, instagram, url) because /intake historically
-- only handled visual content.
--
-- Action: drop the existing check constraint, recreate it with
-- 'audio' appended to the allowed list.
--
-- Safety:
--   - Pure ALTER TABLE, no data touched
--   - Existing rows with the old allowed values continue to satisfy
--     the new constraint (it is a strict superset)
--   - Atomic: either the constraint swap completes or nothing changes
--
-- Rollback (if ever needed):
--   ALTER TABLE media_analyses DROP CONSTRAINT media_analyses_media_type_check;
--   ALTER TABLE media_analyses ADD CONSTRAINT media_analyses_media_type_check
--     CHECK (media_type = ANY (ARRAY['photo','sketch','mp4','pdf','youtube','instagram','url']));
--
-- Phase D, file 1 of N (06/05/2026)
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE media_analyses
    DROP CONSTRAINT media_analyses_media_type_check;

ALTER TABLE media_analyses
    ADD CONSTRAINT media_analyses_media_type_check
    CHECK (media_type = ANY (ARRAY[
        'photo'::text,
        'sketch'::text,
        'mp4'::text,
        'pdf'::text,
        'youtube'::text,
        'instagram'::text,
        'url'::text,
        'audio'::text
    ]));

-- Verify the new constraint is in place before committing
SELECT pg_get_constraintdef(c.oid) AS new_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
WHERE t.relname = 'media_analyses'
  AND c.conname = 'media_analyses_media_type_check';

COMMIT;
