-- Cache Google Maps transit data between student pairs.
-- Keyed by (user_id, from_student_id, to_student_id) so results are reused across dates.
-- Invalidate by deleting rows when a student's address changes.

CREATE TABLE IF NOT EXISTS transit_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  to_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  transit_minutes INTEGER NOT NULL,
  driving_minutes INTEGER NOT NULL,
  distance_meters INTEGER NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, from_student_id, to_student_id)
);

ALTER TABLE transit_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own transit cache"
  ON transit_cache FOR ALL USING (auth.uid() = user_id);
