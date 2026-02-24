-- Migration for existing projects: add time column to lessons
-- Run this in Supabase SQL Editor if you have an existing lessons table

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS time TIME;
