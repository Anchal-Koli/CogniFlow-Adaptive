
-- 1. Fix user_roles privilege escalation: replace ALL policy with granular policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can select all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop the old restrictive insert policy since we now have a proper permissive admin insert
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

-- 2. Server-side quiz score validation trigger
CREATE OR REPLACE FUNCTION public.validate_quiz_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  quiz_questions jsonb;
  computed_score int := 0;
  computed_total int := 0;
  ans jsonb;
  q jsonb;
BEGIN
  -- Fetch quiz questions
  SELECT questions INTO quiz_questions
  FROM public.quizzes
  WHERE id::text = NEW.quiz_id;

  IF quiz_questions IS NULL THEN
    RETURN NEW;
  END IF;

  computed_total := jsonb_array_length(quiz_questions);

  -- Compute score from answers by checking against correct answers
  FOR ans IN SELECT * FROM jsonb_array_elements(NEW.answers)
  LOOP
    FOR q IN SELECT * FROM jsonb_array_elements(quiz_questions)
    LOOP
      IF (q->>'id') = (ans->>'questionId') THEN
        IF (ans->>'selected')::int = (q->>'correctAnswer')::int THEN
          computed_score := computed_score + 1;
        END IF;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;

  -- Override client-provided values with server-computed values
  NEW.score := computed_score;
  NEW.total := computed_total;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_quiz_score
  BEFORE INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_quiz_score();

-- 3. Restrict direct gamification field updates on profiles
CREATE OR REPLACE FUNCTION public.protect_gamification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent direct client manipulation of gamification fields
  -- Only allow changes if called from a trusted server context
  -- For now, preserve old values to prevent client-side tampering
  IF current_setting('role', true) != 'service_role' THEN
    NEW.skill_rating := OLD.skill_rating;
    NEW.xp := OLD.xp;
    NEW.level := OLD.level;
    NEW.xp_to_next := OLD.xp_to_next;
    NEW.streak := OLD.streak;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_gamification_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_gamification_fields();
