/*
  # Création des tables pour événements, contenu et forum

  1. Tables créées:
    - `events` : Événements, conférences, cours
      - `id` (uuid, primary key)
      - `type` (text) : 'event' | 'conference' | 'forum' | 'class'
      - `title` (text)
      - `description` (text)
      - `date` (date)
      - `time` (text)
      - `location` (text)
      - `instructor` (text)
      - `participants` (integer)
      - `max_participants` (integer)
      - `status` (text) : 'draft' | 'published' | 'cancelled'
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `content_items` : Contenu multimédia (images, vidéos, articles)
      - `id` (uuid, primary key)
      - `type` (text) : 'image' | 'video' | 'article' | 'communique' | 'annonce' | 'actualite'
      - `title` (text)
      - `description` (text)
      - `url` (text)
      - `thumbnail` (text)
      - `author` (text)
      - `date` (date)
      - `likes` (integer)
      - `views` (integer)
      - `comments` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `forum_posts` : Posts du forum
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `author` (text)
      - `date` (date)
      - `category` (text)
      - `replies` (jsonb)
      - `likes` (integer)
      - `views` (integer)
      - `is_answered` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité:
    - Enable RLS sur toutes les tables
    - Contenu publié visible par tous
    - Modification réservée aux authentifiés
*/

-- Table des événements
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('event', 'conference', 'forum', 'class')),
  title text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  instructor text,
  participants integer NOT NULL DEFAULT 0,
  max_participants integer,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table du contenu multimédia
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('image', 'video', 'article', 'communique', 'annonce', 'actualite')),
  title text NOT NULL,
  description text DEFAULT '',
  url text NOT NULL,
  thumbnail text,
  author text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  likes integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des posts du forum
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  replies jsonb NOT NULL DEFAULT '[]'::jsonb,
  likes integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  is_answered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);
CREATE INDEX IF NOT EXISTS idx_content_type ON content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_date ON content_items(date DESC);
CREATE INDEX IF NOT EXISTS idx_forum_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_date ON forum_posts(date DESC);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Policies pour events
CREATE POLICY "Les événements publiés sont visibles par tous"
  ON events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des événements"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les événements"
  ON events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent supprimer les événements"
  ON events FOR DELETE
  TO authenticated
  USING (true);

-- Policies pour content_items
CREATE POLICY "Le contenu est visible par tous"
  ON content_items FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer du contenu"
  ON content_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier le contenu"
  ON content_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent supprimer le contenu"
  ON content_items FOR DELETE
  TO authenticated
  USING (true);

-- Policies pour forum_posts
CREATE POLICY "Les posts du forum sont visibles par tous"
  ON forum_posts FOR SELECT
  USING (true);

CREATE POLICY "Tous peuvent créer des posts"
  ON forum_posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les posts"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent supprimer les posts"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (true);
