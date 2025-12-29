-- Fix RLS Policies for Admin Access

-- 1. Ensure users can always view their own profile (to check their own role)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 2. Allow admins to view ALL profiles
-- This relies on the "Users can view own profile" policy being active for the subquery
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
