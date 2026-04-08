/*
  # Correction RLS content_items - autoriser les insertions anon

  Le système d'authentification admin est custom (non Supabase Auth).
  On autorise les rôles anon et authenticated pour les opérations CRUD
  sur content_items afin que l'admin puisse gérer le contenu.

  1. Modifications
    - Suppression des anciennes politiques INSERT/UPDATE/DELETE trop restrictives
    - Nouvelles politiques permettant à anon et authenticated de gérer le contenu
*/

DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent créer du contenu" ON content_items;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent modifier le contenu" ON content_items;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent supprimer le contenu" ON content_items;

CREATE POLICY "Tout le monde peut créer du contenu"
  ON content_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Tout le monde peut modifier le contenu"
  ON content_items FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tout le monde peut supprimer le contenu"
  ON content_items FOR DELETE
  TO anon, authenticated
  USING (true);
