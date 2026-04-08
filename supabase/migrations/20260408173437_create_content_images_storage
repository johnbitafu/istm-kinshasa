/*
  # Création du bucket de stockage pour les images de contenu

  1. Nouveau bucket
    - `content-images` - stockage des images uploadées pour le contenu éducatif
  
  2. Policies
    - Lecture publique pour tous les visiteurs
    - Upload autorisé pour tous (pas d'auth requise pour ce cas d'usage public)
    - Suppression autorisée pour tous (admin géré côté app)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for content images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'content-images');

CREATE POLICY "Anyone can upload content images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'content-images');

CREATE POLICY "Anyone can delete content images"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'content-images');
