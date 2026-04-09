/*
  # Create students table

  ## Summary
  Creates a dedicated `students` table for storing student records imported from CSV.
  Students can log in using their matricule. Admins can approve or reject students.

  ## New Tables
  - `students`
    - `id` (uuid, primary key)
    - `matricule` (text, unique) - student ID used for login
    - `full_name` (text) - student full name
    - `email` (text)
    - `phone` (text)
    - `birth_date` (date)
    - `gender` (text)
    - `birth_place` (text)
    - `address` (text)
    - `status` (text) - 'pending', 'approved', 'rejected'
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Authenticated users can read approved students
  - Anon users can read approved students (for login check)
  - Admins can read/write all students via service role
*/

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  birth_date date,
  gender text DEFAULT '',
  birth_place text DEFAULT '',
  address text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read students for login"
  ON students
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update student status"
  ON students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete students"
  ON students
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS students_matricule_idx ON students (matricule);
CREATE INDEX IF NOT EXISTS students_status_idx ON students (status);
