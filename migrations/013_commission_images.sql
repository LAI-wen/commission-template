-- Add preview_images (JSON array of URLs) to commission types
ALTER TABLE commission_types ADD COLUMN preview_images TEXT NOT NULL DEFAULT '[]';
