-- Add default_duration to students for pre-populating lessons (matches fees.duration)
ALTER TABLE students ADD COLUMN IF NOT EXISTS default_duration TEXT;
