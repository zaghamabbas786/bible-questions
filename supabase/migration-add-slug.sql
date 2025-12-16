-- Migration to add slug column to existing searches table
-- Run this if your database already has a searches table without the slug column

-- Add slug column
ALTER TABLE searches ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing records
-- This function will create basic slugs from existing queries
DO $$
DECLARE
  rec RECORD;
  new_slug TEXT;
BEGIN
  FOR rec IN SELECT id, query FROM searches WHERE slug IS NULL LOOP
    -- Generate slug from query
    new_slug := lower(trim(regexp_replace(rec.query, '[^\w\s-]', '', 'g')));
    new_slug := regexp_replace(new_slug, '\s+', '-', 'g');
    new_slug := regexp_replace(new_slug, '-+', '-', 'g');
    new_slug := substring(new_slug from 1 for 60);
    new_slug := regexp_replace(new_slug, '-+$', '', 'g');
    
    -- Ensure uniqueness by appending ID if needed
    IF EXISTS (SELECT 1 FROM searches WHERE slug = new_slug AND id != rec.id) THEN
      new_slug := new_slug || '-' || substring(rec.id::text from 1 for 8);
    END IF;
    
    UPDATE searches SET slug = new_slug WHERE id = rec.id;
  END LOOP;
END $$;

-- Make slug column required after populating existing records
ALTER TABLE searches ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint
ALTER TABLE searches ADD CONSTRAINT searches_slug_unique UNIQUE (slug);

-- Create index on slug for faster queries
CREATE INDEX IF NOT EXISTS idx_searches_slug ON searches(slug);

