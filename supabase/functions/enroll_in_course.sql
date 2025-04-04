
-- 注册课程的函数
CREATE OR REPLACE FUNCTION public.enroll_in_course(user_id_param uuid, course_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.course_enrollments (
    user_id, 
    course_id,
    status,
    progress,
    enrolled_at
  ) VALUES (
    user_id_param,
    course_id_param,
    'active',
    0,
    now()
  )
  ON CONFLICT (user_id, course_id) DO NOTHING;
END;
$$;
