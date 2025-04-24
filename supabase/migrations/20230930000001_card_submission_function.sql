-- 创建卡片提交插入函数
CREATE OR REPLACE FUNCTION insert_card_submission(
  p_task_id UUID,
  p_student_id UUID,
  p_content TEXT,
  p_card_image_url TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO card_creator_submissions (
    task_id,
    student_id,
    content,
    card_image_url
  ) VALUES (
    p_task_id,
    p_student_id,
    p_content,
    p_card_image_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 