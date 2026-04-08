/*
  # Ajout des champs featured à content_items

  1. Modifications
    - `content_items`: Ajout des colonnes `is_featured` et `featured_order`
      - `is_featured` (boolean, default false) : indique si le contenu est mis en avant dans le carrousel
      - `featured_order` (integer, default 0) : ordre d'affichage dans le carrousel
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_items' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE content_items ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_items' AND column_name = 'featured_order'
  ) THEN
    ALTER TABLE content_items ADD COLUMN featured_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_content_featured ON content_items(is_featured, featured_order);
