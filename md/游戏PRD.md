# LMS游戏化系统 PRD (产品需求文档)

## 1. 产品概述

### 1.1 产品背景
基于现有的Create-Connect LMS系统，增加游戏化功能模块，通过RPG式的数字档案、技能进阶和成就系统，提升学生学习动机和参与度，同时为PBL（项目式学习）提供能力追踪和展示平台。
核心模块设计
1. 数字人档案系统

个人头像和基本信息
总等级和经验值
学习统计和成长轨迹
个性化称号和装饰
学习经历时间线：按时间顺序展示所有学习活动
项目作品集：线上线下项目的详细记录和成果展示
能力证明：每个技能维度的具体表现和证据
成长故事：AI生成的个人学习成长叙述
技能标签云：动态展示掌握的具体技能点
荣誉展示：获得的所有成就、徽章、证书

2. 六维技能系统

5C能力加领导力（1）沟通协调Communication（2）团体合作Collaboration（3）批判思考Critical Thinking（4）创新能力力Creativity（5）计算思维Computation Thinking
技能雷达图可视化
技能等级和经验值追踪

3. 经验值与成就系统

多渠道经验值获取
成就徽章机制
虚拟货币和奖励

4. AI学习助手

线下项目记录
智能经验分配
个性化学习建议
### 1.2 产品目标
- **短期目标**：为现有LMS增加基础游戏化功能，提升用户粘性
- **中期目标**：建立完整的学生能力档案和成长轨迹记录
- **长期目标**：打造集学习、评估、展示于一体的数字化能力认证平台

### 1.3 目标用户
- **主要用户**：学生（K12及高等教育）
- **次要用户**：教师（查看学生能力发展）、家长（了解孩子成长）
- **管理用户**：学校管理员（数据分析和管理）

## 2. 核心功能模块设计

### 2.1 数字人档案系统 (Digital Profile System)

#### 2.1.1 基础档案信息
**数据库设计**：扩展现有`profiles`表
```sql
-- 扩展profiles表，添加游戏化字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_experience INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '新手学习者';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;
```

**功能特性**：
- 个人头像上传和自定义
- 总等级和经验值显示
- 个性化称号系统
- 学习连续天数统计

#### 2.1.2 学习经历时间线
**新建表**：`learning_timeline`
```sql
CREATE TABLE learning_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'course_complete', 'lesson_complete', 'quiz_pass', 'project_submit'
  activity_title TEXT NOT NULL,
  activity_description TEXT,
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  experience_gained INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**功能特性**：
- 按时间顺序展示所有学习活动
- 支持课程完成、课时学习、测验通过等多种活动类型
- 每个活动记录获得的经验值

#### 2.1.3 项目作品集
**新建表**：`user_portfolio`
```sql
CREATE TABLE user_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  project_description TEXT,
  project_type TEXT NOT NULL, -- 'online', 'offline', 'assignment', 'personal'
  project_url TEXT,
  project_images TEXT[], -- 项目图片URLs数组
  skills_demonstrated TEXT[], -- 展示的技能标签
  completion_date DATE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 六维技能系统 (6-Skill Radar System)

#### 2.2.1 技能维度定义
基于"6变形战士"能力模型：
1. **Communication** (沟通协调)
2. **Collaboration** (团体合作)
3. **Critical Thinking** (批判思考)
4. **Creativity** (创新能力)
5. **Cultural Intelligence** (文化智力)
6. **Complex Problem Solving** (复杂问题解决能力)

#### 2.2.2 技能数据表设计
**新建表**：`user_skills`
```sql
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('communication', 'collaboration', 'critical_thinking', 'creativity', 'cultural_intelligence', 'complex_problem_solving')),
  skill_level INTEGER DEFAULT 1 CHECK (skill_level >= 1 AND skill_level <= 10),
  skill_experience INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_type)
);
```

**技能经验记录表**：`skill_experience_logs`
```sql
CREATE TABLE skill_experience_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL,
  experience_gained INTEGER NOT NULL,
  source_type TEXT NOT NULL, -- 'course', 'lesson', 'quiz', 'assignment', 'project'
  source_id UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.3 经验值与成就系统 (Experience & Achievement System)

#### 2.3.1 经验值获取规则
**基础经验值设定**：
- 完成课时：10-50 EXP（根据课时类型和难度）
- 通过测验：20-100 EXP（根据分数和难度）
- 提交作业：30-80 EXP
- 完成课程：100-500 EXP
- 连续学习：每日额外10 EXP

#### 2.3.2 成就系统
**新建表**：`achievements`
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_key TEXT UNIQUE NOT NULL, -- 成就唯一标识
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  achievement_type TEXT NOT NULL, -- 'learning', 'skill', 'social', 'special'
  requirement_type TEXT NOT NULL, -- 'count', 'streak', 'score', 'time'
  requirement_value INTEGER NOT NULL,
  experience_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**用户成就记录表**：`user_achievements`
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

### 2.4 AI学习助手 (AI Learning Assistant)

#### 2.4.1 线下项目记录
**功能设计**：
- 通过对话式界面记录线下项目
- AI自动分析项目内容并分配技能经验
- 支持图片上传和语音输入

#### 2.4.2 智能经验分配
**算法逻辑**：
```typescript
// 基于活动内容的智能经验分配
interface ExperienceAllocation {
  communication: number;
  collaboration: number;
  critical_thinking: number;
  creativity: number;
  computational_thinking: number;
  leadership: number;
}

// AI分析项目描述，返回技能经验分配
function analyzeProjectSkills(projectDescription: string): ExperienceAllocation;
```

## 3. 技术实现方案

### 3.1 基于现有架构的快速实现

#### 3.1.1 利用现有基础设施
- **数据库**：扩展现有Supabase数据库
- **认证系统**：复用现有用户认证和角色管理
- **API服务**：扩展现有courseService模式
- **前端框架**：基于现有React + TypeScript架构

#### 3.1.2 新增服务模块
```typescript
// src/services/gamificationService.ts
export const gamificationService = {
  // 用户档案相关
  getUserProfile: (userId: string) => Promise<UserGameProfile>,
  updateUserProfile: (userId: string, data: Partial<UserGameProfile>) => Promise<void>,

  // 技能系统相关
  getUserSkills: (userId: string) => Promise<UserSkill[]>,
  addSkillExperience: (userId: string, skillType: string, experience: number) => Promise<void>,

  // 成就系统相关
  getUserAchievements: (userId: string) => Promise<UserAchievement[]>,
  checkAndUnlockAchievements: (userId: string) => Promise<Achievement[]>,

  // 时间线相关
  addTimelineActivity: (userId: string, activity: TimelineActivity) => Promise<void>,
  getUserTimeline: (userId: string, limit?: number) => Promise<TimelineActivity[]>,

  // 作品集相关
  addPortfolioProject: (userId: string, project: PortfolioProject) => Promise<void>,
  getUserPortfolio: (userId: string) => Promise<PortfolioProject[]>
};
```

### 3.2 前端组件设计

#### 3.2.1 核心组件列表
```typescript
// 数字档案组件
- UserProfileCard: 用户基础信息卡片
- SkillRadarChart: 六维技能雷达图
- ExperienceProgressBar: 经验值进度条
- AchievementBadges: 成就徽章展示

// 时间线组件
- LearningTimeline: 学习活动时间线
- TimelineItem: 单个时间线项目

// 作品集组件
- PortfolioGrid: 作品集网格展示
- ProjectCard: 单个项目卡片
- ProjectModal: 项目详情弹窗

// AI助手组件
- AIAssistantChat: AI对话界面
- ProjectRecorder: 项目记录器
- SkillAnalyzer: 技能分析器
```

#### 3.2.2 页面路由设计
```typescript
// 新增路由
/profile/:userId - 用户档案页面
/profile/:userId/timeline - 学习时间线
/profile/:userId/portfolio - 作品集
/profile/:userId/achievements - 成就展示
/ai-assistant - AI学习助手
```

## 4. MVP实现计划

### 4.1 第一阶段 (2周) - 基础档案系统
**目标**：建立基础的用户游戏化档案

**开发任务**：
1. 数据库迁移：扩展profiles表，创建基础游戏化字段
2. 实现基础经验值系统：课程/课时完成自动获得经验
3. 开发用户档案页面：显示等级、经验值、基础信息
4. 集成到现有导航：在用户菜单中添加"我的档案"入口

**技术要点**：
- 修改现有courseService，在课程完成时触发经验值更新
- 创建gamificationService基础框架
- 设计响应式的档案页面布局

### 4.2 第二阶段 (2周) - 六维技能系统
**目标**：实现技能雷达图和技能经验追踪

**开发任务**：
1. 创建技能相关数据表
2. 实现技能经验分配逻辑
3. 开发技能雷达图组件（使用Chart.js或类似库）
4. 在课程内容中标记技能类型，自动分配技能经验

**技术要点**：
- 为现有课程和课时添加技能标签字段
- 实现技能等级计算算法
- 使用可视化库创建雷达图

### 4.3 第三阶段 (2周) - 时间线和成就系统
**目标**：完善用户活动记录和激励机制

**开发任务**：
1. 实现学习时间线功能
2. 创建基础成就系统（10-15个基础成就）
3. 开发成就检查和解锁逻辑
4. 添加时间线页面和成就展示页面

**技术要点**：
- 在现有学习活动中插入时间线记录逻辑
- 实现成就检查的定时任务或触发器
- 设计吸引人的成就徽章UI

### 4.4 第四阶段 (2周) - AI助手和作品集
**目标**：完成MVP的高级功能

**开发任务**：
1. 实现简化版AI助手（基于规则的项目分析）
2. 开发作品集功能
3. 完善用户档案的完整性
4. 系统测试和优化

**技术要点**：
- 集成AI服务（可以先用简单的关键词匹配）
- 实现文件上传和图片展示
- 优化数据库查询性能

## 5. 数据库迁移脚本

### 5.1 第一阶段迁移
```sql
-- 20241201000000_add_gamification_basic.sql
-- 扩展用户档案表
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
```

### 5.2 第二阶段迁移
```sql
-- 20241215000000_add_skills_system.sql
-- 创建用户技能表
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('communication', 'collaboration', 'critical_thinking', 'creativity', 'cultural_intelligence', 'complex_problem_solving')),
  skill_level INTEGER DEFAULT 1 CHECK (skill_level >= 1 AND skill_level <= 10),
  skill_experience INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_type)
);

-- 创建技能经验记录表
CREATE TABLE IF NOT EXISTS skill_experience_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL,
  experience_gained INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为课程和课时添加技能标签
ALTER TABLE courses ADD COLUMN IF NOT EXISTS skill_tags TEXT[] DEFAULT '{}';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS skill_tags TEXT[] DEFAULT '{}';
```

## 6. 成功指标和验收标准

### 6.1 技术指标
- **性能要求**：页面加载时间 < 2秒
- **可用性要求**：系统可用性 > 99%
- **兼容性要求**：支持主流浏览器（Chrome, Firefox, Safari, Edge）

### 6.2 用户体验指标
- **用户参与度**：日活跃用户增长 > 20%
- **学习完成率**：课程完成率提升 > 15%
- **用户满意度**：用户反馈评分 > 4.0/5.0

### 6.3 功能验收标准
- [ ] 用户可以查看完整的个人档案信息
- [ ] 技能雷达图正确显示六个维度的技能等级
- [ ] 学习活动能够自动记录到时间线
- [ ] 经验值和等级计算准确无误
- [ ] 成就系统能够正确检测和解锁
- [ ] AI助手能够记录线下项目并分配技能经验
- [ ] 作品集功能完整可用

## 7. 风险评估和应对策略

### 7.1 技术风险
**风险**：数据库性能问题
**应对**：合理设计索引，使用缓存机制

**风险**：AI服务集成复杂度
**应对**：MVP阶段使用简化的规则引擎，后期逐步升级

### 7.2 产品风险
**风险**：用户接受度不高
**应对**：充分的用户调研和A/B测试

**风险**：游戏化元素过度干扰学习
**应对**：保持教育本质，游戏化作为辅助手段

## 8. 后续迭代计划

### 8.1 V2.0 功能规划
- 社交功能：好友系统、学习小组
- 高级AI功能：个性化学习建议、智能课程推荐
- 数据分析：学习行为分析、能力发展报告

### 8.2 V3.0 功能规划
- 跨平台同步：移动端APP
- 区块链认证：技能证书上链
- 企业版功能：团队管理、企业培训

---

**文档版本**：V1.0
**创建日期**：2024年12月
**最后更新**：2024年12月
**负责人**：产品开发团队