-- 第一阶段游戏化系统：基础档案系统
-- 扩展用户档案表，添加游戏化字段

-- 扩展profiles表，添加游戏化字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_experience INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '新手学习者';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- 创建学习时间线表
CREATE TABLE IF NOT EXISTS learning_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_title TEXT NOT NULL,
  activity_description TEXT,
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  experience_gained INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS learning_timeline_user_id_idx ON learning_timeline(user_id);
CREATE INDEX IF NOT EXISTS learning_timeline_created_at_idx ON learning_timeline(created_at);

-- 启用RLS
ALTER TABLE learning_timeline ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户可以查看自己的学习时间线
CREATE POLICY "Users can view their own learning timeline"
  ON learning_timeline
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的学习时间线记录
CREATE POLICY "Users can insert their own learning timeline"
  ON learning_timeline
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理员和教师可以查看所有学习时间线
CREATE POLICY "Admins and teachers can view all learning timelines"
  ON learning_timeline
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'teacher')
    )
  );

-- 为现有用户初始化游戏化字段
UPDATE profiles 
SET 
  total_level = 1,
  total_experience = 0,
  title = '新手学习者',
  learning_streak = 0
WHERE 
  total_level IS NULL 
  OR total_experience IS NULL 
  OR title IS NULL 
  OR learning_streak IS NULL;
