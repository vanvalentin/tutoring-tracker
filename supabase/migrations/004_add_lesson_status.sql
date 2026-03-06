-- Add status to lessons: 'scheduled' (default) or 'canceled'
-- Canceled lessons are kept but visually greyed out and excluded from income stats.

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled';

-- Optional: constrain to known values (Postgres allows any text; this is for clarity)
-- ALTER TABLE lessons ADD CONSTRAINT lessons_status_check CHECK (status IN ('scheduled', 'canceled'));
