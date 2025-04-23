-- 创建触发器函数，用于删除课时完成记录后更新课程注册进度
CREATE OR REPLACE FUNCTION update_course_enrollment_progress_after_delete()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INT;
  completed_lessons INT;
  progress_value INT;
  course_id_var UUID;
  user_id_var UUID;
  enrollment_id_var UUID;
BEGIN
  -- 在DELETE触发器中，使用OLD引用被删除的记录
  course_id_var := OLD.course_id;
  user_id_var := OLD.user_id;
  enrollment_id_var := OLD.enrollment_id;
  
  -- 获取课程总课时数
  SELECT COUNT(*)
  INTO total_lessons
  FROM public.lessons
  INNER JOIN public.course_modules ON lessons.module_id = course_modules.id
  WHERE course_modules.course_id = course_id_var;
  
  -- 获取已完成课时数（注意：此时该记录已被删除，所以计数已经自动减1）
  SELECT COUNT(*)
  INTO completed_lessons
  FROM public.lesson_completions
  WHERE course_id = course_id_var AND user_id = user_id_var;
  
  -- 计算进度
  IF total_lessons > 0 THEN
    progress_value := (completed_lessons * 100) / total_lessons;
  ELSE
    progress_value := 0;
  END IF;
  
  -- 更新课程注册进度
  UPDATE public.course_enrollments
  SET progress = progress_value,
      last_accessed_at = NOW()
  WHERE id = enrollment_id_var;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 创建DELETE触发器
CREATE TRIGGER after_lesson_completion_delete
AFTER DELETE ON public.lesson_completions
FOR EACH ROW
EXECUTE FUNCTION update_course_enrollment_progress_after_delete();

-- 允许用户删除自己的课程完成记录
CREATE POLICY "Users can delete their own lesson completions"
  ON public.lesson_completions
  FOR DELETE
  USING (auth.uid() = user_id); 