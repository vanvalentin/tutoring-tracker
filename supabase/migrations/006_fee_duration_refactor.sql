BEGIN;

CREATE OR REPLACE FUNCTION parse_legacy_duration_minutes(input_text TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  match_parts TEXT[];
  parsed_value NUMERIC;
  parsed_unit TEXT;
  parsed_hours INTEGER;
  parsed_minutes INTEGER;
  normalized_text TEXT;
  parse_target TEXT;
BEGIN
  IF input_text IS NULL OR btrim(input_text) = '' THEN
    RETURN NULL;
  END IF;

  normalized_text := lower(regexp_replace(btrim(input_text), '\s+', ' ', 'g'));
  parse_target := regexp_replace(normalized_text, '(?:\s*\([^)]*\))+\s*$', '', 'g');

  match_parts := regexp_match(parse_target, '^(\d{1,2}):(\d{2})$');

  IF match_parts IS NOT NULL THEN
    parsed_hours := match_parts[1]::INTEGER;
    parsed_minutes := match_parts[2]::INTEGER;
    RETURN (parsed_hours * 60) + parsed_minutes;
  END IF;

  match_parts := regexp_match(
    parse_target,
    '^(\d+(?:[.,]\d+)?)\s*(h|hr|hrs|hour|hours)(?:\s+(\d+)\s*(m|min|mins|minute|minutes))?$'
  );

  IF match_parts IS NOT NULL THEN
    parsed_value := replace(match_parts[1], ',', '.')::NUMERIC;
    parsed_minutes := COALESCE(match_parts[3]::INTEGER, 0);
    RETURN round(parsed_value * 60)::INTEGER + parsed_minutes;
  END IF;

  match_parts := regexp_match(
    parse_target,
    '^(\d+(?:[.,]\d+)?)\s*(m|min|mins|minute|minutes)$'
  );

  IF match_parts IS NOT NULL THEN
    parsed_value := replace(match_parts[1], ',', '.')::NUMERIC;
    parsed_unit := lower(match_parts[2]);
    IF parsed_unit LIKE 'm%' THEN
      RETURN round(parsed_value)::INTEGER;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

ALTER TABLE fees ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

UPDATE fees
SET
  label = COALESCE(NULLIF(label, ''), duration),
  duration_minutes = COALESCE(duration_minutes, parse_legacy_duration_minutes(duration));

ALTER TABLE students ADD COLUMN IF NOT EXISTS default_fee_id UUID REFERENCES fees(id) ON DELETE SET NULL;

UPDATE students AS s
SET default_fee_id = f.id
FROM fees AS f
WHERE s.default_fee_id IS NULL
  AND s.default_duration IS NOT NULL
  AND s.user_id = f.user_id
  AND s.default_duration = f.label;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS fee_label TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

UPDATE lessons
SET
  fee_label = COALESCE(NULLIF(fee_label, ''), duration),
  duration_minutes = COALESCE(duration_minutes, parse_legacy_duration_minutes(duration));

DO $$
DECLARE
  bad_fee_labels TEXT;
  bad_lesson_labels TEXT;
BEGIN
  SELECT string_agg(label, ', ' ORDER BY label)
  INTO bad_fee_labels
  FROM fees
  WHERE duration_minutes IS NULL;

  IF EXISTS (
    SELECT 1
    FROM fees
    WHERE duration_minutes IS NULL
  ) THEN
    RAISE EXCEPTION 'Fee duration migration failed. Unparseable fee labels: %', bad_fee_labels;
  END IF;

  SELECT string_agg(fee_label, ', ' ORDER BY fee_label)
  INTO bad_lesson_labels
  FROM lessons
  WHERE duration_minutes IS NULL;

  IF EXISTS (
    SELECT 1
    FROM lessons
    WHERE duration_minutes IS NULL
  ) THEN
    RAISE EXCEPTION 'Lesson duration migration failed. Unparseable lesson labels: %', bad_lesson_labels;
  END IF;
END;
$$;

ALTER TABLE fees
  ALTER COLUMN label SET NOT NULL,
  ALTER COLUMN duration_minutes SET NOT NULL;

ALTER TABLE lessons
  ALTER COLUMN fee_label SET NOT NULL,
  ALTER COLUMN duration_minutes SET NOT NULL;

ALTER TABLE fees DROP COLUMN IF EXISTS duration;
ALTER TABLE students DROP COLUMN IF EXISTS default_duration;
ALTER TABLE lessons DROP COLUMN IF EXISTS duration;

COMMIT;
