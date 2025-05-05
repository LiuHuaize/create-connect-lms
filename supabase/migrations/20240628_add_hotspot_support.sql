-- 添加对热点类型课程的支持
-- 由于type字段是文本类型，我们不需要修改表结构
-- 只需要确保应用能够正确处理热点类型的内容

-- 创建一个函数来记录和检查热点内容的完成情况
CREATE OR REPLACE FUNCTION check_hotspot_completion(lesson_data JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  total_hotspots INTEGER;
  completed_hotspots INTEGER;
BEGIN
  -- 如果数据为空或不是热点内容，返回false
  IF lesson_data IS NULL OR NOT (lesson_data ? 'hotspots') THEN
    RETURN FALSE;
  END IF;
  
  -- 获取总热点数
  total_hotspots := jsonb_array_length(lesson_data->'hotspots');
  
  -- 如果没有热点，返回true（视为已完成）
  IF total_hotspots = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- 获取已完成热点数（如果有一个visited_hotspots数组）
  IF lesson_data ? 'visited_hotspots' AND jsonb_typeof(lesson_data->'visited_hotspots') = 'array' THEN
    completed_hotspots := jsonb_array_length(lesson_data->'visited_hotspots');
  ELSE
    completed_hotspots := 0;
  END IF;
  
  -- 如果所有热点都已访问，返回true
  RETURN completed_hotspots >= total_hotspots;
END;
$$ LANGUAGE plpgsql;

-- 更新lesson_completion检查函数，添加对热点类型的支持
CREATE OR REPLACE FUNCTION is_lesson_completed(lesson_type TEXT, lesson_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- 根据不同的课时类型判断完成状态
  CASE 
    WHEN lesson_type = 'text' THEN
      RETURN TRUE; -- 文本类型当打开就算完成
    WHEN lesson_type = 'video' THEN
      RETURN lesson_data->>'completed' = 'true';
    WHEN lesson_type = 'quiz' THEN
      RETURN (lesson_data->>'score')::FLOAT >= (lesson_data->>'passing_score')::FLOAT;
    WHEN lesson_type = 'assignment' THEN
      RETURN lesson_data->>'submitted' = 'true';
    WHEN lesson_type = 'hotspot' THEN
      RETURN check_hotspot_completion(lesson_data);
    ELSE
      RETURN FALSE; -- 其他未知类型
  END CASE;
END;
$$ LANGUAGE plpgsql; 