-- Admin Functions & Policies

-- 1. Function to update user role (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role user_role)
RETURNS VOID AS $$
BEGIN
  -- Check if the executor is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Allow Admins to Delete Rooms
-- We assume 'rooms' table exists.
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete any room" ON rooms;
CREATE POLICY "Admins can delete any room"
ON rooms FOR DELETE
USING (is_admin());

-- Also allow admins to UPDATE rooms (e.g. change name/description)
DROP POLICY IF EXISTS "Admins can update any room" ON rooms;
CREATE POLICY "Admins can update any room"
ON rooms FOR UPDATE
USING (is_admin());
