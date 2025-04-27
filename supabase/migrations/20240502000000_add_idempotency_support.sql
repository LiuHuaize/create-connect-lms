-- 添加幂等性记录表
CREATE TABLE IF NOT EXISTS public.idempotency_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  response JSONB,
  UNIQUE(key, requester_id, endpoint)
);

-- 设置TTL索引
CREATE INDEX IF NOT EXISTS idx_idempotency_created_at ON public.idempotency_records(created_at);

-- 添加RLS策略，仅允许读取自己的记录
ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;

-- 幂等性记录自动清理函数 - 保留30天的记录
CREATE OR REPLACE FUNCTION clean_old_idempotency_records()
RETURNS void AS $$
BEGIN
  DELETE FROM public.idempotency_records
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建课程保存事务函数
CREATE OR REPLACE FUNCTION save_course_transaction(
  p_course JSONB,
  p_modules JSONB,
  p_requester_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_course_id UUID;
  v_saved_course JSONB;
  v_saved_modules JSONB;
  v_current_time TIMESTAMP WITH TIME ZONE := now();
  v_result JSONB;
BEGIN
  -- 开始事务
  BEGIN
    -- 1. 保存课程基本信息
    IF (p_course->>'id') IS NULL OR (p_course->>'id') = '' THEN
      -- 新课程
      INSERT INTO public.courses (
        title,
        description,
        short_description,
        author_id,
        cover_image,
        status,
        price,
        tags,
        category,
        updated_at
      ) VALUES (
        p_course->>'title',
        p_course->>'description',
        p_course->>'short_description',
        p_requester_id,
        p_course->>'cover_image',
        p_course->>'status',
        (p_course->>'price')::NUMERIC,
        (p_course->'tags')::JSONB,
        p_course->>'category',
        v_current_time
      )
      RETURNING id, to_jsonb(courses) INTO v_course_id, v_saved_course;
    ELSE
      -- 更新现有课程
      UPDATE public.courses
      SET 
        title = p_course->>'title',
        description = p_course->>'description',
        short_description = p_course->>'short_description',
        cover_image = p_course->>'cover_image',
        status = p_course->>'status',
        price = (p_course->>'price')::NUMERIC,
        tags = (p_course->'tags')::JSONB,
        category = p_course->>'category',
        updated_at = v_current_time
      WHERE 
        id = (p_course->>'id')::UUID AND 
        author_id = p_requester_id
      RETURNING id, to_jsonb(courses) INTO v_course_id, v_saved_course;
      
      -- 验证是否找到并更新了课程
      IF v_course_id IS NULL THEN
        RAISE EXCEPTION '未找到课程或无权更新';
      END IF;
    END IF;
    
    -- 2. 处理模块
    WITH module_data AS (
      SELECT 
        jsonb_array_elements(p_modules) AS module_json
    ),
    inserted_modules AS (
      INSERT INTO public.course_modules (
        id,
        course_id,
        title,
        order_index,
        updated_at
      )
      SELECT
        CASE 
          WHEN (module_json->>'id') IS NULL OR (module_json->>'id') = '' OR (module_json->>'id') LIKE 'm%' 
          THEN uuid_generate_v4()
          ELSE (module_json->>'id')::UUID
        END,
        v_course_id,
        module_json->>'title',
        (module_json->>'order_index')::INTEGER,
        v_current_time
      FROM module_data
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        order_index = EXCLUDED.order_index,
        updated_at = EXCLUDED.updated_at
      RETURNING to_jsonb(course_modules)
    )
    SELECT jsonb_agg(to_jsonb) INTO v_saved_modules
    FROM inserted_modules;
    
    -- 构建结果
    v_result := jsonb_build_object(
      'success', true,
      'course', v_saved_course,
      'modules', v_saved_modules,
      'savedAt', v_current_time
    );
    
    -- 提交事务
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- 回滚事务
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建保存课时的事务函数
CREATE OR REPLACE FUNCTION save_lessons_transaction(
  p_lessons JSONB,
  p_module_id UUID,
  p_requester_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_saved_lessons JSONB;
  v_current_time TIMESTAMP WITH TIME ZONE := now();
  v_result JSONB;
BEGIN
  -- 验证用户是否有权限编辑此模块的课时
  DECLARE
    v_course_author UUID;
  BEGIN
    SELECT c.author_id INTO v_course_author
    FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cm.id = p_module_id;
    
    IF v_course_author IS NULL OR v_course_author != p_requester_id THEN
      RAISE EXCEPTION '无权编辑此模块的课时';
    END IF;
  END;
  
  -- 开始事务
  BEGIN
    WITH lesson_data AS (
      SELECT 
        jsonb_array_elements(p_lessons) AS lesson_json
    ),
    inserted_lessons AS (
      INSERT INTO public.lessons (
        id,
        module_id,
        title,
        type,
        content,
        order_index,
        video_file_path,
        bilibili_url,
        updated_at
      )
      SELECT
        CASE 
          WHEN (lesson_json->>'id') IS NULL OR (lesson_json->>'id') = '' OR (lesson_json->>'id') LIKE 'l%' 
          THEN uuid_generate_v4()
          ELSE (lesson_json->>'id')::UUID
        END,
        p_module_id,
        lesson_json->>'title',
        lesson_json->>'type',
        (lesson_json->'content')::JSONB,
        (lesson_json->>'order_index')::INTEGER,
        lesson_json->>'video_file_path',
        lesson_json->>'bilibili_url',
        v_current_time
      FROM lesson_data
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        content = EXCLUDED.content,
        order_index = EXCLUDED.order_index,
        video_file_path = EXCLUDED.video_file_path,
        bilibili_url = EXCLUDED.bilibili_url,
        updated_at = EXCLUDED.updated_at
      RETURNING to_jsonb(lessons)
    )
    SELECT jsonb_agg(to_jsonb) INTO v_saved_lessons
    FROM inserted_lessons;
    
    -- 构建结果
    v_result := jsonb_build_object(
      'success', true,
      'lessons', v_saved_lessons,
      'savedAt', v_current_time
    );
    
    -- 提交事务
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- 回滚事务
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建软删除函数
CREATE OR REPLACE FUNCTION soft_delete_course_items(
  p_course_id UUID,
  p_module_ids UUID[],
  p_lesson_ids UUID[],
  p_requester_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_current_time TIMESTAMP WITH TIME ZONE := now();
  v_deleted_modules_count INTEGER := 0;
  v_deleted_lessons_count INTEGER := 0;
  v_has_permission BOOLEAN := FALSE;
BEGIN
  -- 验证用户是否有权限
  SELECT (author_id = p_requester_id) INTO v_has_permission
  FROM public.courses
  WHERE id = p_course_id;
  
  IF NOT v_has_permission THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '无权执行此操作'
    );
  END IF;
  
  -- 软删除模块
  IF p_module_ids IS NOT NULL AND array_length(p_module_ids, 1) > 0 THEN
    UPDATE public.course_modules
    SET deleted_at = v_current_time
    WHERE id = ANY(p_module_ids) AND course_id = p_course_id;
    
    GET DIAGNOSTICS v_deleted_modules_count = ROW_COUNT;
  END IF;
  
  -- 软删除课时
  IF p_lesson_ids IS NOT NULL AND array_length(p_lesson_ids, 1) > 0 THEN
    UPDATE public.lessons
    SET deleted_at = v_current_time
    WHERE id = ANY(p_lesson_ids) AND module_id IN (
      SELECT id FROM public.course_modules WHERE course_id = p_course_id
    );
    
    GET DIAGNOSTICS v_deleted_lessons_count = ROW_COUNT;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'modules_deleted', v_deleted_modules_count,
    'lessons_deleted', v_deleted_lessons_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 