/*
  # Fix Assignments Table Schema

  1. Schema Changes
    - Drop old assignments table with incorrect columns
    - Create new assignments table with correct schema:
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses)
      - `user_id` (uuid, references auth.users)
      - `title` (text) - assignment name
      - `category_id` (text) - category identifier
      - `date` (date) - due/submission date
      - `earned_points` (numeric) - points earned
      - `total_points` (numeric) - total possible points
      - `extra_credit` (boolean) - extra credit flag
      - `status` (text) - graded/pending/missing
      - `source_scan_id` (uuid, nullable) - if created from scan
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on assignments table
    - Add policies for authenticated users to manage their own assignments
*/

-- Drop old assignments table if it exists
DROP TABLE IF EXISTS assignments CASCADE;

-- Create assignments table with correct schema
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category_id text NOT NULL,
  date date NOT NULL,
  earned_points numeric NOT NULL DEFAULT 0,
  total_points numeric NOT NULL DEFAULT 0,
  extra_credit boolean DEFAULT false,
  status text NOT NULL DEFAULT 'graded',
  source_scan_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_date ON assignments(date);
