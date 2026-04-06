
-- 1. topic_mastery: replace ALL with SELECT-only for users, add INSERT/UPDATE for service_role only
DROP POLICY IF EXISTS "Users can manage own mastery" ON public.topic_mastery;

CREATE POLICY "Users can read own mastery" ON public.topic_mastery
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow inserts/updates only via service_role (triggers, edge functions)
CREATE POLICY "Service can manage mastery" ON public.topic_mastery
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. cognitive_traits: replace ALL with SELECT-only for users
DROP POLICY IF EXISTS "Users can manage own traits" ON public.cognitive_traits;

CREATE POLICY "Users can read own traits" ON public.cognitive_traits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage traits" ON public.cognitive_traits
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. rating_history: replace ALL with SELECT-only for users
DROP POLICY IF EXISTS "Users can manage own rating history" ON public.rating_history;

CREATE POLICY "Users can read own rating history" ON public.rating_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage rating history" ON public.rating_history
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Create RPC function to get quiz questions WITHOUT correct answers
CREATE OR REPLACE FUNCTION public.get_quiz_for_attempt(_quiz_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'id', q.id,
    'title', q.title,
    'topic', q.topic,
    'difficulty', q.difficulty,
    'description', q.description,
    'time_limit', q.time_limit,
    'questions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', elem->>'id',
          'question', elem->>'question',
          'options', elem->'options',
          'hint', elem->>'hint',
          'explanation', elem->>'explanation'
        )
      )
      FROM jsonb_array_elements(q.questions) AS elem
    )
  )
  FROM public.quizzes q
  WHERE q.id = _quiz_id AND q.is_published = true;
$$;

-- 5. Restrict direct SELECT on quizzes to hide questions column for non-instructors
-- We keep the existing policy but add a view-based approach via the RPC above
-- The RPC is the recommended way to fetch quiz data for attempts

-- 6. Protect cognitive_efficiency on profiles (was missed in previous migration)
CREATE OR REPLACE FUNCTION public.protect_gamification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) != 'service_role' THEN
    NEW.skill_rating := OLD.skill_rating;
    NEW.xp := OLD.xp;
    NEW.level := OLD.level;
    NEW.xp_to_next := OLD.xp_to_next;
    NEW.streak := OLD.streak;
    NEW.cognitive_efficiency := OLD.cognitive_efficiency;
  END IF;
  RETURN NEW;
END;
$$;
