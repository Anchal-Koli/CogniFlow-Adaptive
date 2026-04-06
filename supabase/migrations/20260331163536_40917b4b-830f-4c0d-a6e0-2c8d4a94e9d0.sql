
-- Remove the old restrictive policy that only blocked self-inserts
DROP POLICY IF EXISTS "Deny self role assignment" ON public.user_roles;

-- Remove the permissive admin insert policy 
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Create a single restrictive INSERT policy: only admins can insert ANY role
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
