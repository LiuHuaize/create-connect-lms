-- 添加系列问答相关成就
-- 为游戏化系统添加系列问答功能的成就

-- 插入系列问答相关成就
INSERT INTO achievements (achievement_key, title, description, achievement_type, requirement_type, requirement_value, experience_reward, is_active) VALUES
-- 系列问答学习成就
('series_questionnaire_first', '问答新手', '完成第一个系列问答', 'learning', 'count', 1, 100, true),
('series_questionnaire_master', '问答达人', '完成5个系列问答', 'learning', 'count', 5, 300, true),
('writing_enthusiast', '写作爱好者', '在系列问答中累计写作1000字', 'learning', 'count', 1000, 200, true),
('series_high_scorer', '高分选手', '在系列问答中获得3次85分以上的成绩', 'learning', 'count', 3, 250, true),

-- 技能相关成就（基于系列问答的深度思考）
('deep_thinker', '深度思考者', '在批判思考技能达到3级', 'skill', 'count', 3, 150, true),
('creative_writer', '创意写手', '在创新能力技能达到3级', 'skill', 'count', 3, 150, true),
('communication_expert', '沟通专家', '在沟通协调技能达到4级', 'skill', 'count', 4, 200, true),

-- 特殊成就
('prolific_writer', '多产作家', '单次系列问答写作超过500字', 'special', 'count', 1, 100, true),
('consistent_learner', '坚持学习者', '连续完成3个系列问答且都获得良好评分', 'special', 'count', 3, 300, true)

ON CONFLICT (achievement_key) DO NOTHING;

-- 更新活动类型枚举（如果使用了枚举类型）
-- 注意：这里假设 activity_type 是 TEXT 类型，如果是枚举需要相应调整

-- 为 learning_timeline 表添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_learning_timeline_activity_type ON learning_timeline(activity_type);
CREATE INDEX IF NOT EXISTS idx_learning_timeline_user_activity ON learning_timeline(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_learning_timeline_created_at ON learning_timeline(created_at);

-- 为系列问答相关表添加索引以提高成就检查性能
CREATE INDEX IF NOT EXISTS idx_series_submissions_student_status ON series_submissions(student_id, status);
CREATE INDEX IF NOT EXISTS idx_series_ai_gradings_final_score ON series_ai_gradings(final_score);

-- 添加注释
COMMENT ON TABLE achievements IS '成就定义表，包含所有可解锁的成就';
COMMENT ON COLUMN achievements.achievement_key IS '成就唯一标识符，用于代码中引用';
COMMENT ON COLUMN achievements.achievement_type IS '成就类型：learning(学习), skill(技能), social(社交), special(特殊)';
COMMENT ON COLUMN achievements.requirement_type IS '要求类型：count(数量), streak(连续), score(分数), time(时间)';
COMMENT ON COLUMN achievements.requirement_value IS '达成成就所需的数值';
COMMENT ON COLUMN achievements.experience_reward IS '解锁成就获得的经验值奖励';

-- 验证插入的成就数据
DO $$
DECLARE
    achievement_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO achievement_count FROM achievements WHERE achievement_key LIKE 'series_%' OR achievement_key IN ('deep_thinker', 'creative_writer', 'communication_expert', 'prolific_writer', 'consistent_learner');
    
    IF achievement_count >= 9 THEN
        RAISE NOTICE '成功添加 % 个系列问答相关成就', achievement_count;
    ELSE
        RAISE WARNING '系列问答成就添加可能不完整，当前数量: %', achievement_count;
    END IF;
END $$;
