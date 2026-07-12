-- C6: Classroom / teacher mode

CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id varchar NOT NULL,
  name text NOT NULL,
  invite_code varchar(8) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_members (
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id varchar NOT NULL,
  role text NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'teacher')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.classroom_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  companion_id uuid NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classrooms_teacher
  ON public.classrooms (teacher_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_classrooms_invite_code
  ON public.classrooms (invite_code);

CREATE INDEX IF NOT EXISTS idx_classroom_members_user
  ON public.classroom_members (user_id);

CREATE INDEX IF NOT EXISTS idx_classroom_assignments_classroom
  ON public.classroom_assignments (classroom_id, created_at DESC);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_assignments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_classroom_teacher(
  p_classroom_id uuid,
  p_user_id varchar
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classrooms
    WHERE id = p_classroom_id
      AND teacher_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_classroom_member(
  p_classroom_id uuid,
  p_user_id varchar
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classroom_members
    WHERE classroom_id = p_classroom_id
      AND user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.classrooms
    WHERE id = p_classroom_id
      AND teacher_id = p_user_id
  );
$$;

DROP POLICY IF EXISTS "classrooms_select_member" ON public.classrooms;
CREATE POLICY "classrooms_select_member" ON public.classrooms
  FOR SELECT TO authenticated
  USING (public.is_classroom_member(id, (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "classrooms_insert_teacher" ON public.classrooms;
CREATE POLICY "classrooms_insert_teacher" ON public.classrooms
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "classrooms_update_teacher" ON public.classrooms;
CREATE POLICY "classrooms_update_teacher" ON public.classrooms
  FOR UPDATE TO authenticated
  USING (teacher_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (teacher_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "classrooms_delete_teacher" ON public.classrooms;
CREATE POLICY "classrooms_delete_teacher" ON public.classrooms
  FOR DELETE TO authenticated
  USING (teacher_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "classroom_members_select" ON public.classroom_members;
CREATE POLICY "classroom_members_select" ON public.classroom_members
  FOR SELECT TO authenticated
  USING (public.is_classroom_member(classroom_id, (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "classroom_members_delete_teacher" ON public.classroom_members;
CREATE POLICY "classroom_members_delete_teacher" ON public.classroom_members
  FOR DELETE TO authenticated
  USING (public.is_classroom_teacher(classroom_id, (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "classroom_assignments_select" ON public.classroom_assignments;
CREATE POLICY "classroom_assignments_select" ON public.classroom_assignments
  FOR SELECT TO authenticated
  USING (public.is_classroom_member(classroom_id, (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "classroom_assignments_insert" ON public.classroom_assignments;
CREATE POLICY "classroom_assignments_insert" ON public.classroom_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_classroom_teacher(classroom_id, (auth.jwt() ->> 'sub')));

DROP POLICY IF EXISTS "classroom_assignments_delete" ON public.classroom_assignments;
CREATE POLICY "classroom_assignments_delete" ON public.classroom_assignments
  FOR DELETE TO authenticated
  USING (public.is_classroom_teacher(classroom_id, (auth.jwt() ->> 'sub')));

GRANT ALL ON TABLE public.classrooms TO authenticated, service_role;
GRANT ALL ON TABLE public.classroom_members TO authenticated, service_role;
GRANT ALL ON TABLE public.classroom_assignments TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.is_classroom_teacher(uuid, varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_classroom_member(uuid, varchar) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_classroom_by_code(p_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_classroom_id uuid;
  v_user_id varchar := auth.jwt() ->> 'sub';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_classroom_id
  FROM public.classrooms
  WHERE upper(invite_code) = upper(trim(p_invite_code))
  LIMIT 1;

  IF v_classroom_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = v_classroom_id AND teacher_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Teachers cannot join their own class as a student';
  END IF;

  INSERT INTO public.classroom_members (classroom_id, user_id, role)
  VALUES (v_classroom_id, v_user_id, 'student')
  ON CONFLICT DO NOTHING;

  RETURN v_classroom_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_classroom_member_stats(p_classroom_id uuid)
RETURNS TABLE (
  user_id varchar,
  session_count bigint,
  total_minutes integer,
  last_session_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cm.user_id,
    count(sh.id) AS session_count,
    (coalesce(sum(sh.duration_seconds), 0) / 60)::integer AS total_minutes,
    max(sh.ended_at) AS last_session_at
  FROM public.classroom_members cm
  LEFT JOIN public.session_history sh
    ON sh.user_id = cm.user_id
    AND sh.ended_at IS NOT NULL
  WHERE cm.classroom_id = p_classroom_id
    AND cm.role = 'student'
    AND public.is_classroom_teacher(p_classroom_id, auth.jwt() ->> 'sub')
  GROUP BY cm.user_id;
$$;

GRANT EXECUTE ON FUNCTION public.join_classroom_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_classroom_member_stats(uuid) TO authenticated;
