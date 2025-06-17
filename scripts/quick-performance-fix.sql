-- 快速性能修复 SQL 脚本
-- 执行前请备份数据库！

-- ============================================
-- 第一部分：添加关键索引（立即生效）
-- ============================================

-- 1. 课程注册表索引（解决最主要的性能问题）
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id 
ON course_enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id 
ON course_enrollments(user_id);

-- 2. 课程状态索引（加速已发布课程查询）
CREATE INDEX IF NOT EXISTS idx_courses_status 
ON courses(status);

-- 3. 课程作者索引
CREATE INDEX IF NOT EXISTS idx_courses_author_id 
ON courses(author_id);

-- 4. 模块和课时索引
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id 
ON course_modules(course_id);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id 
ON lessons(module_id);

-- 5. 复合索引优化常用查询
CREATE INDEX IF NOT EXISTS idx_courses_status_created_at 
ON courses(status, created_at DESC);

-- 6. 课程注册复合索引
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_course 
ON course_enrollments(user_id, course_id);

-- ============================================
-- 第二部分：优化 RLS 策略（提升查询性能）
-- ============================================

-- 优化 courses 表的 RLS 策略
DROP POLICY IF EXISTS "Authors can manage their own courses" ON courses;
CREATE POLICY "Authors can manage their own courses" ON courses
FOR ALL USING (author_id = (SELECT auth.uid()));

-- 优化 course_enrollments 表的 RLS 策略
DROP POLICY IF EXISTS "Users can view their own course enrollments" ON course_enrollments;
CREATE POLICY "Users can view their own course enrollments" ON course_enrollments
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Course authors can view enrollments for their courses" ON course_enrollments;
CREATE POLICY "Course authors can view enrollments for their courses" ON course_enrollments
FOR SELECT USING (
  course_id IN (
    SELECT id FROM courses WHERE author_id = (SELECT auth.uid())
  )
);

-- 优化 course_modules 表的 RLS 策略
DROP POLICY IF EXISTS "Course modules inherit permissions from courses" ON course_modules;
CREATE POLICY "Course modules inherit permissions from courses" ON course_modules
FOR ALL USING (
  course_id IN (
    SELECT id FROM courses 
    WHERE author_id = (SELECT auth.uid()) OR status = 'published'
  )
);

-- 优化 lessons 表的 RLS 策略
DROP POLICY IF EXISTS "Lessons inherit permissions from modules" ON lessons;
CREATE POLICY "Lessons inherit permissions from modules" ON lessons
FOR ALL USING (
  module_id IN (
    SELECT cm.id FROM course_modules cm
    JOIN courses c ON cm.course_id = c.id
    WHERE c.author_id = (SELECT auth.uid()) OR c.status = 'published'
  )
);

-- ============================================
-- 第三部分：创建优化查询函数
-- ============================================

-- 创建获取课程基本信息的优化函数
CREATE OR REPLACE FUNCTION get_course_basic_optimized(p_course_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT row_to_json(c.*) INTO result
  FROM courses c
  WHERE c.id = p_course_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取课程模块结构的函数（不包含课时内容）
CREATE OR REPLACE FUNCTION get_course_modules_structure(p_course_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', m.id,
        'title', m.title,
        'description', m.description,
        'order_index', m.order_index,
        'course_id', m.course_id,
        'lessons_count', (
          SELECT COUNT(*) FROM lessons l WHERE l.module_id = m.id
        ),
        'created_at', m.created_at,
        'updated_at', m.updated_at
      ) ORDER BY m.order_index
    ),
    '[]'::json
  ) INTO result
  FROM course_modules m 
  WHERE m.course_id = p_course_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取模块课时的函数
CREATE OR REPLACE FUNCTION get_module_lessons(p_module_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(
    json_agg(
      row_to_json(l.*) ORDER BY l.order_index
    ),
    '[]'::json
  ) INTO result
  FROM lessons l
  WHERE l.module_id = p_module_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取用户课程注册信息的函数
CREATE OR REPLACE FUNCTION get_user_enrollment(p_course_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT row_to_json(ce.*) INTO result
  FROM course_enrollments ce
  WHERE ce.course_id = p_course_id AND ce.user_id = p_user_id;
  
  RETURN COALESCE(result, 'null'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 第四部分：验证脚本
-- ============================================

-- 验证索引创建成功
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('courses', 'course_enrollments', 'course_modules', 'lessons')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 验证函数创建成功
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname IN (
    'get_course_basic_optimized',
    'get_course_modules_structure', 
    'get_module_lessons',
    'get_user_enrollment'
);

-- 显示完成信息
SELECT 'Performance optimization completed successfully!' as status;
