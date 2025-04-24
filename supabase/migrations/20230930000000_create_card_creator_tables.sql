-- 卡片创建任务表
CREATE TABLE IF NOT EXISTS card_creator_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('image', 'text')),
  template_image_url TEXT,
  template_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 学生卡片提交表
CREATE TABLE IF NOT EXISTS card_creator_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES card_creator_tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  card_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS card_creator_tasks_course_id_idx ON card_creator_tasks(course_id);
CREATE INDEX IF NOT EXISTS card_creator_submissions_task_id_idx ON card_creator_submissions(task_id);
CREATE INDEX IF NOT EXISTS card_creator_submissions_student_id_idx ON card_creator_submissions(student_id);

-- 确保表在RLS策略下是安全的
ALTER TABLE card_creator_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_creator_submissions ENABLE ROW LEVEL SECURITY;

-- 教师可以查看和创建任务
CREATE POLICY card_creator_tasks_teacher_policy 
  ON card_creator_tasks 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'teacher')
    )
  );

-- 学生可以查看任务
CREATE POLICY card_creator_tasks_student_view_policy 
  ON card_creator_tasks 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments 
      WHERE course_enrollments.user_id = auth.uid() 
      AND course_enrollments.course_id = card_creator_tasks.course_id
    )
  );

-- 学生可以查看和创建自己的提交
CREATE POLICY card_creator_submissions_student_policy 
  ON card_creator_submissions 
  FOR ALL 
  TO authenticated 
  USING (
    student_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'teacher')
    ) OR
    EXISTS (
      SELECT 1 FROM card_creator_tasks
      JOIN course_enrollments ON card_creator_tasks.course_id = course_enrollments.course_id
      WHERE card_creator_tasks.id = card_creator_submissions.task_id
      AND course_enrollments.user_id = auth.uid()
    )
  ); 