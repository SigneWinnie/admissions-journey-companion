/*
  # Create Memes Gallery Table

  1. New Tables
    - `memes`
      - `id` (uuid, primary key) - Unique identifier for each saved meme
      - `user_id` (uuid, foreign key to auth.users) - Tracks which user created the meme
      - `data_url` (text) - The actual meme image as a data URL (PNG encoded as base64)
      - `thumbnail_url` (text) - Small preview image
      - `layers` (jsonb) - All text layers that were on the meme (for editing later)
      - `template_id` (text) - Which template was used (drake, distracted-boy, etc)
      - `created_at` (timestamp) - When the meme was created
      - `updated_at` (timestamp) - When it was last modified

  2. Security
    - Enable RLS on `memes` table
    - Users can only view their own memes
    - Users can only delete their own memes
    - Anonymous users (no auth) cannot save - only authenticated users

  3. Indexes
    - Index on `user_id` for faster queries
    - Index on `created_at` for sorting recent memes first

  Note: The data_url field stores large PNG data. Each PNG can be 100KB-500KB. 
  Storing in database instead of localStorage means:
  - Unlimited storage (localStorage is ~5MB)
  - Accessible from any device after login
  - Backed up on Supabase
  - Can be deleted properly with cascade
*/

CREATE TABLE IF NOT EXISTS memes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_url text NOT NULL,
  thumbnail_url text,
  layers jsonb NOT NULL DEFAULT '[]',
  template_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memes_user_id ON memes(user_id);
CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at DESC);

ALTER TABLE memes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memes"
  ON memes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memes"
  ON memes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memes"
  ON memes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own memes"
  ON memes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);