
-- Function to save course content (modules and lessons) in a transaction
CREATE OR REPLACE FUNCTION public.save_course_content(
  p_course_id UUID,
  p_modules JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  module_record RECORD;
  lesson_record RECORD;
  v_module_id UUID;
  v_module_index INTEGER;
  v_lesson_index INTEGER;
BEGIN
  -- Delete existing modules and lessons for this course
  DELETE FROM public.course_modules WHERE course_id = p_course_id;
  
  -- Process each module
  v_module_index := 0;
  FOR module_record IN SELECT * FROM jsonb_array_elements(p_modules)
  LOOP
    -- Insert module
    INSERT INTO public.course_modules (
      course_id,
      title,
      order_index
    ) VALUES (
      p_course_id,
      (module_record.value->>'title')::TEXT,
      v_module_index
    ) RETURNING id INTO v_module_id;
    
    -- Process lessons for this module
    v_lesson_index := 0;
    FOR lesson_record IN SELECT * FROM jsonb_array_elements(module_record.value->'lessons')
    LOOP
      -- Insert lesson
      INSERT INTO public.lessons (
        module_id,
        title,
        type,
        content,
        order_index
      ) VALUES (
        v_module_id,
        (lesson_record.value->>'title')::TEXT,
        (lesson_record.value->>'type')::TEXT,
        (lesson_record.value->'content')::JSONB,
        v_lesson_index
      );
      
      v_lesson_index := v_lesson_index + 1;
    END LOOP;
    
    v_module_index := v_module_index + 1;
  END LOOP;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
    RETURN FALSE;
END;
$$;
