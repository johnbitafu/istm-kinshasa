/*
  # Fix content_types RLS — allow anon insert and delete

  ## Summary
  The app uses a custom authentication system (not Supabase Auth), so the Supabase
  client always operates as the `anon` role even when an admin is logged in.
  The existing INSERT/DELETE policies restricted to `authenticated` therefore
  blocked all admin operations on content_types.

  ## Changes
  - Drop the INSERT policy that was restricted to `authenticated`
  - Drop the DELETE policy that was restricted to `authenticated`
  - Recreate them to also cover `anon` role (access control is enforced at the
    application level by the custom AuthGuard)
*/

DROP POLICY IF EXISTS "Authenticated users can insert content types" ON content_types;
DROP POLICY IF EXISTS "Authenticated users can delete non-base content types" ON content_types;

CREATE POLICY "Allow insert content types"
  ON content_types
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow delete non-base content types"
  ON content_types
  FOR DELETE
  TO anon, authenticated
  USING (is_base = false);
