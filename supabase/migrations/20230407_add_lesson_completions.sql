-- 创建课程完成记录表
CREATE TABLE IF NOT EXISTS public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  score INT,
  data JSONB,
  UNIQUE(user_id, lesson_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_id ON public.lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON public.lesson_completions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_course_id ON public.lesson_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_enrollment_id ON public.lesson_completions(enrollment_id);

-- 添加RLS策略
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的课程完成记录
CREATE POLICY "Users can view their own lesson completions"
  ON public.lesson_completions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的课程完成记录
CREATE POLICY "Users can insert their own lesson completions"
  ON public.lesson_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的课程完成记录
CREATE POLICY "Users can update their own lesson completions"
  ON public.lesson_completions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建触发器函数，用于更新课程注册进度
CREATE OR REPLACE FUNCTION update_course_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INT;
  completed_lessons INT;
  progress_value INT;
BEGIN
  -- 获取课程总课时数
  SELECT COUNT(*)
  INTO total_lessons
  FROM public.lessons
  INNER JOIN public.course_modules ON lessons.module_id = course_modules.id
  WHERE course_modules.course_id = NEW.course_id;
  
  -- 获取已完成课时数
  SELECT COUNT(*)
  INTO completed_lessons
  FROM public.lesson_completions
  WHERE course_id = NEW.course_id AND user_id = NEW.user_id;
  
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
  WHERE id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER after_lesson_completion_insert_or_update
AFTER INSERT OR UPDATE ON public.lesson_completions
FOR EACH ROW
EXECUTE FUNCTION update_course_enrollment_progress(); 