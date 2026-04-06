
-- ============================================
-- Courses table
-- ============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read published courses
CREATE POLICY "Anyone can read published courses" ON public.courses
  FOR SELECT TO authenticated USING (is_published = true);

-- Instructors/admins can manage courses they created
CREATE POLICY "Instructors can manage own courses" ON public.courses
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid() AND (
      public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    created_by = auth.uid() AND (
      public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Admins can manage all courses
CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Quizzes table (dynamic, manageable)
-- ============================================
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL DEFAULT '',
  time_limit INTEGER NOT NULL DEFAULT 10,
  questions JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read published quizzes
CREATE POLICY "Anyone can read published quizzes" ON public.quizzes
  FOR SELECT TO authenticated USING (is_published = true);

-- Instructors/admins can manage own quizzes
CREATE POLICY "Instructors can manage own quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid() AND (
      public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    created_by = auth.uid() AND (
      public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Admins can manage all quizzes
CREATE POLICY "Admins can manage all quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
