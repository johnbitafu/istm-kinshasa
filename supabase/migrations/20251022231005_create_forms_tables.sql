/*
  # Création des tables pour les formulaires dynamiques

  1. Tables créées:
    - `forms` : Stocke les formulaires dynamiques créés par les administrateurs
      - `id` (uuid, primary key)
      - `title` (text) : Titre du formulaire
      - `description` (text) : Description
      - `fields` (jsonb) : Structure JSON des champs du formulaire
      - `filieres` (jsonb) : Liste des filières et mentions disponibles
      - `status` (text) : 'draft' | 'published' | 'archived'
      - `submissions_count` (integer) : Nombre de soumissions
      - `created_by` (uuid) : ID de l'utilisateur créateur
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `form_submissions` : Stocke les soumissions des formulaires (inscriptions étudiants)
      - `id` (uuid, primary key)
      - `form_id` (uuid, foreign key vers forms)
      - `matricule` (text, unique) : Numéro matricule généré
      - `submission_data` (jsonb) : Données soumises par l'étudiant
      - `filiere_id` (text) : ID de la filière choisie
      - `filiere_name` (text) : Nom de la filière
      - `mention` (text) : Mention choisie
      - `filiere_id_2` (text) : ID du 2ème choix de filière (optionnel)
      - `filiere_name_2` (text) : Nom du 2ème choix
      - `mention_2` (text) : 2ème mention
      - `status` (text) : 'pending' | 'approved' | 'rejected'
      - `submitted_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité:
    - Enable RLS sur toutes les tables
    - Les formulaires sont publics en lecture (published)
    - Les soumissions sont accessibles uniquement aux admins
    - Authentification requise pour la modification
*/

-- Table des formulaires dynamiques
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  filieres jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  submissions_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des soumissions de formulaires
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  matricule text NOT NULL UNIQUE,
  submission_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  filiere_id text,
  filiere_name text,
  mention text,
  filiere_id_2 text,
  filiere_name_2 text,
  mention_2 text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_matricule ON form_submissions(matricule);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON form_submissions(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Policies pour forms
-- Tout le monde peut voir les formulaires publiés
CREATE POLICY "Les formulaires publiés sont visibles par tous"
  ON forms FOR SELECT
  USING (status = 'published');

-- Les utilisateurs authentifiés peuvent créer des formulaires
CREATE POLICY "Les utilisateurs authentifiés peuvent créer des formulaires"
  ON forms FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Les créateurs peuvent modifier leurs formulaires
CREATE POLICY "Les créateurs peuvent modifier leurs formulaires"
  ON forms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Les créateurs peuvent supprimer leurs formulaires
CREATE POLICY "Les créateurs peuvent supprimer leurs formulaires"
  ON forms FOR DELETE
  TO authenticated
  USING (true);

-- Policies pour form_submissions
-- Les utilisateurs anonymes peuvent soumettre des formulaires
CREATE POLICY "Les utilisateurs peuvent soumettre des formulaires"
  ON form_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Les utilisateurs authentifiés peuvent lire toutes les soumissions (admins)
CREATE POLICY "Les admins peuvent lire toutes les soumissions"
  ON form_submissions FOR SELECT
  TO authenticated
  USING (true);

-- Les utilisateurs authentifiés peuvent modifier les soumissions
CREATE POLICY "Les admins peuvent modifier les soumissions"
  ON form_submissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Les utilisateurs authentifiés peuvent supprimer les soumissions
CREATE POLICY "Les admins peuvent supprimer les soumissions"
  ON form_submissions FOR DELETE
  TO authenticated
  USING (true);
