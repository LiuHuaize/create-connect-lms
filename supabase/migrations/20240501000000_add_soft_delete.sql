-- 为课程表添加软删除字段
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 为课程模块表添加软删除字段
ALTER TABLE public.course_modules
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 为课时表添加软删除字段
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 修改RLS策略，排除已删除的记录
DROP POLICY IF EXISTS "课程可以被所有已认证用户读取" ON public.courses;
CREATE POLICY "课程可以被所有已认证用户读取" 
  ON public.courses 
  FOR SELECT 
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "课程模块可以被所有已认证用户读取" ON public.course_modules;
CREATE POLICY "课程模块可以被所有已认证用户读取" 
  ON public.course_modules 
  FOR SELECT 
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "课时可以被所有已认证用户读取" ON public.lessons;
CREATE POLICY "课时可以被所有已认证用户读取" 
  ON public.lessons 
  FOR SELECT 
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

-- 创建获取未删除课程的函数
CREATE OR REPLACE FUNCTION public.get_non_deleted_courses()
RETURNS SETOF public.courses AS $$
  SELECT * FROM public.courses WHERE deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- 创建获取未删除模块的函数
CREATE OR REPLACE FUNCTION public.get_non_deleted_modules(course_id uuid)
RETURNS SETOF public.course_modules AS $$
  SELECT * FROM public.course_modules 
  WHERE course_id = $1 AND deleted_at IS NULL
  ORDER BY order_index;
$$ LANGUAGE sql SECURITY DEFINER;

-- 创建获取未删除课时的函数
CREATE OR REPLACE FUNCTION public.get_non_deleted_lessons(module_id uuid)
RETURNS SETOF public.lessons AS $$
  SELECT * FROM public.lessons 
  WHERE module_id = $1 AND deleted_at IS NULL
  ORDER BY order_index;
$$ LANGUAGE sql SECURITY DEFINER;

-- 修改课程查询API，排除已删除的内容
CREATE OR REPLACE FUNCTION public.get_course_details(p_course_id uuid)
RETURNS SETOF json AS $$
DECLARE
    course_data json;
    modules_data json;
BEGIN
    -- 获取课程基本信息
    SELECT row_to_json(c) INTO course_data
    FROM public.courses c
    WHERE c.id = p_course_id AND c.deleted_at IS NULL;
    
    IF course_data IS NULL THEN
        RETURN;
    END IF;
    
    -- 获取模块信息
    SELECT json_agg(m) INTO modules_data
    FROM (
        SELECT m.*, (
            SELECT json_agg(l)
            FROM (
                SELECT l.*
                FROM public.lessons l
                WHERE l.module_id = m.id AND l.deleted_at IS NULL
                ORDER BY l.order_index
            ) l
        ) AS lessons
        FROM public.course_modules m
        WHERE m.course_id = p_course_id AND m.deleted_at IS NULL
        ORDER BY m.order_index
    ) m;
    
    -- 合并课程和模块信息
    course_data := course_data || jsonb_build_object('modules', COALESCE(modules_data, '[]'::json));
    
    RETURN QUERY SELECT course_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 