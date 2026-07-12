-- Fix classroom create via SECURITY DEFINER RPC (reliable with Clerk JWT + RETURNING)

CREATE OR REPLACE FUNCTION public.create_classroom(
  p_name text,
  p_invite_code text
)
RETURNS public.classrooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id varchar := auth.jwt() ->> 'sub';
  v_row public.classrooms%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Classroom name must be at least 2 characters';
  END IF;

  INSERT INTO public.classrooms (teacher_id, name, invite_code)
  VALUES (v_user_id, trim(p_name), upper(trim(p_invite_code)))
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_classroom(text, text) TO authenticated;

DROP POLICY IF EXISTS "classrooms_select_teacher" ON public.classrooms;
CREATE POLICY "classrooms_select_teacher" ON public.classrooms
  FOR SELECT TO authenticated
  USING (teacher_id = (auth.jwt() ->> 'sub'));
