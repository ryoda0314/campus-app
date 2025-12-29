-- Create User Role Enum
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- Create policy for admins to view all profiles (optional, but likely needed for admin dash)
-- Note: Existing RLS might strict this. Let's ensure admins can read all.
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);
