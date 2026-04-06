
-- Add a RESTRICTIVE policy that blocks users from inserting their own role
-- The handle_new_user trigger runs as SECURITY DEFINER and bypasses RLS
CREATE POLICY "Deny self role assignment" ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() != user_id);
