
-- Fix 1: Add admin read policies to remaining tables
CREATE POLICY "Admins can read all rating_history" ON public.rating_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all cognitive_traits" ON public.cognitive_traits
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all topic_mastery" ON public.topic_mastery
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all onboarding" ON public.onboarding
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Add restrictive policy to prevent non-admin INSERT on user_roles
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
