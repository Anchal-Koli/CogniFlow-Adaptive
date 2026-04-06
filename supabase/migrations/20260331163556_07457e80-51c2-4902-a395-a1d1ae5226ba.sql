
-- Need a permissive INSERT policy too, since restrictive alone blocks everyone
-- (Postgres requires at least one permissive to pass AND all restrictive to pass)
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
