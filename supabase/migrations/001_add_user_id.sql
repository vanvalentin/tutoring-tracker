-- Migration for existing projects: add user_id column
-- Run this ONLY if you have existing tables without user_id
-- You will need to assign a user_id to existing rows or delete them first

-- Add column (nullable first)
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE transportation ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE material ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill: set user_id for existing rows (replace 'YOUR-USER-UUID' with your auth.users id)
-- UPDATE students SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- UPDATE fees SET user_id = 'YOUR-USER-UUID' WHERE user_id IS NULL;
-- etc.

-- Then make NOT NULL:
-- ALTER TABLE students ALTER COLUMN user_id SET NOT NULL;
-- etc.
