-- 升级 assignment_lesson_content 表，添加 allow_file_upload 列
ALTER TABLE IF EXISTS assignment_lesson_content
ADD COLUMN IF NOT EXISTS allow_file_upload BOOLEAN DEFAULT FALSE;

-- 升级 assignment_submissions 表，添加 file_submissions 列
ALTER TABLE IF EXISTS assignment_submissions
ADD COLUMN IF NOT EXISTS file_submissions JSONB DEFAULT '[]'::jsonb;

-- 创建 assignment-submissions 存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions', 'assignment-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- 为 assignment-submissions 存储桶设置权限
CREATE POLICY "Students can upload their own assignments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assignment-submissions' AND
    (storage.foldername(name))[1] = 'assignments' AND
    (storage.foldername(name))[3] = auth.uid()::text
  );
  
CREATE POLICY "Students can view their own assignments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'assignment-submissions' AND
    (storage.foldername(name))[1] = 'assignments' AND
    (storage.foldername(name))[3] = auth.uid()::text
  );

CREATE POLICY "Students can delete their own assignments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'assignment-submissions' AND
    (storage.foldername(name))[1] = 'assignments' AND
    (storage.foldername(name))[3] = auth.uid()::text
  );
    
CREATE POLICY "Teachers can view all student assignments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'assignment-submissions' AND
    auth.uid() IN (
      SELECT c.author_id FROM courses c
      JOIN modules m ON c.id = m.course_id
      JOIN lessons l ON m.id = l.module_id
      WHERE l.id = (storage.foldername(name))[2]
    )
  ); 