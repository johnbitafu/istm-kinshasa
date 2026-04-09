/*
  # Add images array to content_items

  ## Summary
  Adds a `images` column (text array) to `content_items` to support
  multiple photos per content item. Existing rows get an empty array.

  ## Changes
  - `content_items.images` (text[]) — list of image URLs for this content item.
    When empty or null, the existing `thumbnail`/`url` fields are used as fallback.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_items' AND column_name = 'images'
  ) THEN
    ALTER TABLE content_items ADD COLUMN images text[] DEFAULT '{}';
  END IF;
END $$;
