
-- 检查用户是否已注册课程的函数
CREATE OR REPLACE FUNCTION public.check_enrollment(user_id_param uuid, course_id_param uuid)
RETURNS TABLE (enrollment_id uuid) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id as enrollment_id
  FROM public.course_enrollments
  WHERE user_id = user_id_param AND course_id = course_id_param;
$$;
