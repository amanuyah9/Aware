/*
  # Add Hypothetical Assignment Support

  1. Changes
    - Add `is_hypothetical` boolean column to assignments table
    - Default to false for existing assignments
    - Allow users to mark assignments as hypothetical for "what-if" scenarios

  2. Notes
    - Hypothetical assignments display in the list but don't affect grade calculations
    - Users can convert hypothetical assignments to real assignments and vice versa
*/

-- Add is_hypothetical column
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS is_hypothetical boolean DEFAULT false NOT NULL;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_assignments_is_hypothetical ON assignments(is_hypothetical);

-- Update existing assignments to be non-hypothetical
UPDATE assignments SET is_hypothetical = false WHERE is_hypothetical IS NULL;
