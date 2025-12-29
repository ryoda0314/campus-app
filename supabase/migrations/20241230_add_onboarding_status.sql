-- Add is_onboarded column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;

-- Update existing users to true (optional, or left false to force them through)
-- For now, we leave default as false so they must onboard.
