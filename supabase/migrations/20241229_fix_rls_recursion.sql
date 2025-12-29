-- Fix 500 Error (Infinite Recursion in RLS)

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER allows this function to bypass RLS
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the Admin policy to use the function to avoid recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  is_admin()
);
