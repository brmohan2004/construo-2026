-- Add duration column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS duration TEXT;
