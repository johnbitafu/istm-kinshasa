/*
  # Create content_types table

  ## Summary
  Creates a table to persist custom content types added by administrators.

  ## New Tables
  - `content_types`
    - `id` (uuid, primary key)
    - `value` (text, unique) - the slug used in code (e.g. 'conference')
    - `label` (text) - display name (e.g. 'Conférence')
    - `is_base` (boolean) - whether this is a built-in type (cannot be deleted)
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Authenticated users can read all types
  - Authenticated users can insert new types
  - Authenticated users can delete non-base types
*/

CREATE TABLE IF NOT EXISTS content_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text UNIQUE NOT NULL,
  label text NOT NULL,
  is_base boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read content types"
  ON content_types FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert content types"
  ON content_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete non-base content types"
  ON content_types FOR DELETE
  TO authenticated
  USING (is_base = false);

INSERT INTO content_types (value, label, is_base) VALUES
  ('article', 'Article', true),
  ('image', 'Image', true),
  ('video', 'Vidéo', true),
  ('communique', 'Communiqué', true),
  ('annonce', 'Annonce', true),
  ('actualite', 'Actualité', true)
ON CONFLICT (value) DO NOTHING;
