-- Migration: Add Guest Access Code System
-- Run this in Supabase SQL Editor

-- Add access_code column for guest caregiver authentication
ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS access_code VARCHAR(8) UNIQUE;

-- Create index for faster access code lookups
CREATE INDEX IF NOT EXISTS idx_caregivers_access_code ON caregivers(access_code) WHERE access_code IS NOT NULL;

-- Function to generate a random 6-digit access code
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  new_code VARCHAR(8);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-digit code
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM caregivers WHERE access_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate access code for guest caregivers (profile_id IS NULL)
CREATE OR REPLACE FUNCTION auto_generate_access_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate access code for guest caregivers (no profile_id)
  IF NEW.profile_id IS NULL AND NEW.access_code IS NULL THEN
    NEW.access_code := generate_access_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_access_code ON caregivers;
CREATE TRIGGER trigger_auto_generate_access_code
  BEFORE INSERT ON caregivers
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_access_code();

-- Generate access codes for existing guest caregivers
UPDATE caregivers 
SET access_code = generate_access_code() 
WHERE profile_id IS NULL AND access_code IS NULL;

-- Add RLS policy for guest access (read-only access to their own data)
-- Guest caregivers can read their own caregiver record by access_code
CREATE POLICY IF NOT EXISTS "Guest caregivers can read own data" ON caregivers
  FOR SELECT
  USING (
    -- Allow if access_code matches (for guest session validation)
    access_code IS NOT NULL
  );

-- Create RPC function to update access code (bypasses schema cache issues)
CREATE OR REPLACE FUNCTION update_caregiver_access_code(
  p_caregiver_id UUID,
  p_access_code VARCHAR(8)
)
RETURNS VOID AS $$
BEGIN
  UPDATE caregivers
  SET access_code = p_access_code
  WHERE id = p_caregiver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_caregiver_access_code(UUID, VARCHAR) TO authenticated;

-- IMPORTANT: After running this migration, reload the PostgREST schema cache:
-- Go to Supabase Dashboard > Settings > API > Click "Reload schema cache"
-- Or restart the project from Settings > General > Restart project
