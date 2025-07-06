-- 创建系列问答的事务处理函数
-- 确保问答和问题的创建是原子性的

CREATE OR REPLACE FUNCTION create_series_questionnaire_transaction(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_instructions TEXT DEFAULT NULL,
  p_lesson_id UUID,
  p_ai_grading_prompt TEXT DEFAULT NULL,
  p_ai_grading_criteria JSONB DEFAULT NULL,
  p_max_score INTEGER DEFAULT 100,
  p_time_limit_minutes INTEGER DEFAULT NULL,
  p_allow_save_draft BOOLEAN DEFAULT TRUE,
  p_skill_tags TEXT[] DEFAULT '{}',
  p_questions JSONB DEFAULT '[]',
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_questionnaire_id UUID;
  v_questionnaire RECORD;
  v_question JSONB;
  v_questions_created INTEGER := 0;
  v_result JSONB;
BEGIN
  -- 验证用户权限
  IF NOT EXISTS (
    SELECT 1 FROM lessons l
    JOIN course_modules cm ON l.module_id = cm.id
    JOIN courses c ON cm.course_id = c.id
    WHERE l.id = p_lesson_id AND c.author_id = p_user_id
  ) THEN
    RAISE EXCEPTION '无权在此课时创建系列问答';
  END IF;

  -- 开始事务
  BEGIN
    -- 创建系列问答
    INSERT INTO series_questionnaires (
      title,
      description,
      instructions,
      lesson_id,
      ai_grading_prompt,
      ai_grading_criteria,
      max_score,
      time_limit_minutes,
      allow_save_draft,
      skill_tags,
      created_at,
      updated_at
    ) VALUES (
      p_title,
      p_description,
      p_instructions,
      p_lesson_id,
      p_ai_grading_prompt,
      p_ai_grading_criteria,
      p_max_score,
      p_time_limit_minutes,
      p_allow_save_draft,
      p_skill_tags,
      NOW(),
      NOW()
    ) RETURNING id INTO v_questionnaire_id;

    -- 创建问题
    IF jsonb_array_length(p_questions) > 0 THEN
      FOR v_question IN SELECT * FROM jsonb_array_elements(p_questions)
      LOOP
        INSERT INTO series_questions (
          questionnaire_id,
          title,
          description,
          question_text,
          order_index,
          required,
          min_words,
          max_words,
          placeholder_text,
          created_at,
          updated_at
        ) VALUES (
          v_questionnaire_id,
          (v_question->>'title')::TEXT,
          (v_question->>'description')::TEXT,
          (v_question->>'question_text')::TEXT,
          (v_question->>'order_index')::INTEGER,
          COALESCE((v_question->>'required')::BOOLEAN, TRUE),
          COALESCE((v_question->>'min_words')::INTEGER, 0),
          (v_question->>'max_words')::INTEGER,
          (v_question->>'placeholder_text')::TEXT,
          NOW(),
          NOW()
        );
        
        v_questions_created := v_questions_created + 1;
      END LOOP;
    END IF;

    -- 获取创建的完整问答数据
    SELECT 
      q.*,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', sq.id,
            'title', sq.title,
            'description', sq.description,
            'question_text', sq.question_text,
            'order_index', sq.order_index,
            'required', sq.required,
            'min_words', sq.min_words,
            'max_words', sq.max_words,
            'placeholder_text', sq.placeholder_text,
            'created_at', sq.created_at,
            'updated_at', sq.updated_at
          ) ORDER BY sq.order_index
        ) FILTER (WHERE sq.id IS NOT NULL),
        '[]'::jsonb
      ) as questions
    INTO v_questionnaire
    FROM series_questionnaires q
    LEFT JOIN series_questions sq ON q.id = sq.questionnaire_id
    WHERE q.id = v_questionnaire_id
    GROUP BY q.id, q.title, q.description, q.instructions, q.lesson_id, 
             q.ai_grading_prompt, q.ai_grading_criteria, q.max_score, 
             q.time_limit_minutes, q.allow_save_draft, q.skill_tags, 
             q.created_at, q.updated_at;

    -- 构建返回结果
    v_result := jsonb_build_object(
      'questionnaire_id', v_questionnaire_id,
      'questions_created', v_questions_created,
      'questionnaire', row_to_json(v_questionnaire)
    );

    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- 回滚事务（PostgreSQL 会自动回滚）
      RAISE EXCEPTION '创建系列问答失败: %', SQLERRM;
  END;
END;
$$;

-- 为函数添加注释
COMMENT ON FUNCTION create_series_questionnaire_transaction IS '创建系列问答的事务处理函数，确保问答和问题的创建是原子性的';

-- 授权给认证用户
GRANT EXECUTE ON FUNCTION create_series_questionnaire_transaction TO authenticated;

-- 创建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_series_questionnaires_lesson_id ON series_questionnaires(lesson_id);
CREATE INDEX IF NOT EXISTS idx_series_questions_questionnaire_id ON series_questions(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_series_questions_order ON series_questions(questionnaire_id, order_index);
CREATE INDEX IF NOT EXISTS idx_series_submissions_questionnaire_student ON series_submissions(questionnaire_id, student_id);
CREATE INDEX IF NOT EXISTS idx_series_submissions_status ON series_submissions(status);
CREATE INDEX IF NOT EXISTS idx_series_ai_gradings_submission ON series_ai_gradings(submission_id);

-- 创建复合索引以优化常见查询
CREATE INDEX IF NOT EXISTS idx_series_questionnaires_lesson_created ON series_questionnaires(lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_series_submissions_student_status ON series_submissions(student_id, status);
