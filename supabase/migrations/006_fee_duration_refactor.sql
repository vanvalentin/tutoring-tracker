BEGIN;

CREATE OR REPLACE FUNCTION parse_legacy_duration_minutes(input_text TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  match_parts TEXT[];
  parsed_value NUMERIC;
  parsed_unit TEXT;
BEGIN
  IF input_text IS NULL OR btrim(input_text) = '' THEN
    RETURN NULL;
  END IF;

  match_parts := regexp_match(
    input_text,
    '^(\d+(?:[.,]\d+)?)\s*(h(?:our|r)?s?|m(?:in(?:ute)?s?)?)$',
    'i'
  );

  IF match_parts IS NULL THEN
    RETURN NULL;
  END IF;

  parsed_value := replace(match_parts[1], ',', '.')::NUMERIC;
  parsed_unit := lower(match_parts[2]);

  IF parsed_unit LIKE 'h%' THEN
    RETURN round(parsed_value * 60)::INTEGER;
  END IF;

  RETURN round(parsed_value)::INTEGER;
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
BEGIN
  IF EXISTS (
    SELECT 1
    FROM fees
    WHERE duration_minutes IS NULL
  ) THEN
    RAISE EXCEPTION 'Fee duration migration failed: some fees could not be parsed into duration_minutes.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM lessons
    WHERE duration_minutes IS NULL
  ) THEN
    RAISE EXCEPTION 'Lesson duration migration failed: some lessons could not be parsed into duration_minutes.';
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
