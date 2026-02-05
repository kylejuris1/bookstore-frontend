-- Migration: Add ad_image column to books table
-- This column will store the URL/path to the ad landing page image

ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS ad_image text NULL;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN public.books.ad_image IS 'URL or path to the image used for ad landing pages';
