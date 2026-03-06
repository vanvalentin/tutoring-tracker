-- Tutoring Tracker Database Schema
-- Run this in Supabase SQL Editor to create tables
-- Requires Supabase Auth (Google provider) to be enabled
--
-- For FRESH installs: run this entire file
-- For EXISTING installs (tables without user_id): run supabase/migrations/001_add_user_id.sql first

-- Add user_id to all tables for multi-tenant RLS
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  address TEXT,
  goal TEXT,
  payment_method TEXT,
  default_duration TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration TEXT NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  duration TEXT NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  paid BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transportation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT,
  destination TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  vendor TEXT,
  paid_by_parent BOOLEAN DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE transportation ENABLE ROW LEVEL SECURITY;
ALTER TABLE material ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if migrating from old schema
DROP POLICY IF EXISTS "Allow all for students" ON students;
DROP POLICY IF EXISTS "Allow all for fees" ON fees;
DROP POLICY IF EXISTS "Allow all for lessons" ON lessons;
DROP POLICY IF EXISTS "Allow all for transportation" ON transportation;
DROP POLICY IF EXISTS "Allow all for material" ON material;

-- RLS: Users can only access their own data
CREATE POLICY "Users can manage own students" ON students
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own fees" ON fees
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own lessons" ON lessons
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own transportation" ON transportation
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own material" ON material
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Migration: Add user_id to existing tables (run if upgrading from schema without user_id)
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
-- ALTER TABLE fees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
-- etc. Then backfill and set NOT NULL. See Supabase migration docs.
