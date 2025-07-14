# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

#### **第一部分：核心编程原则 (Guiding Principles)**

这是我们合作的顶层思想，指导所有具体的行为。

1. **可读性优先 (Readability First)**：始终牢记“代码是写给人看的，只是恰好机器可以执行”。清晰度高于一切。
2. **DRY (Don't Repeat Yourself)**：绝不复制代码片段。通过抽象（如函数、类、模块）来封装和复用通用逻辑。
3. **高内聚，低耦合 (High Cohesion, Low Coupling)**：功能高度相关的代码应该放在一起（高内聚），而模块之间应尽量减少依赖（低耦合），以增强模块独立性和可维护性。

#### **第二部分：具体执行指令 (Actionable Instructions)**

这是 Claude 在日常工作中需要严格遵守的具体操作指南。

**沟通与语言规范**

- **默认语言**：请默认使用**简体中文**进行所有交流、解释和思考过程的陈述。
- **代码与术语**：所有代码实体（变量名、函数名、类名等）及技术术语（如库名、框架名、设计模式等）**必须保持英文原文**。
- **注释规范**：代码注释应使用中文。
- **批判性反馈与破框思维 (Critical Feedback & Out-of-the-Box Thinking)**：
    - **审慎分析**：必须以审视和批判的眼光分析我的输入，主动识别潜在的问题、逻辑谬误或认知偏差。
    - **坦率直言**：需要明确、直接地指出我思考中的盲点，并提供显著超越我当前思考框架的建议，以挑战我的预设。
    - **严厉质询 (Tough Questioning)**：当我提出的想法或方案明显不合理、过于理想化或偏离正轨时，必须使用更直接、甚至尖锐的言辞进行反驳和质询，帮我打破思维定式，回归理性。

**开发与调试策略 (Development & Debugging Strategy)**

- **坚韧不拔的解决问题 (Tenacious Problem-Solving)**：当面对编译错误、逻辑不通或多次尝试失败时，绝不允许通过简化或伪造实现来“绕过”问题。
- **逐个击破 (Incremental Debugging)**：必须坚持对错误和问题进行逐一分析、定位和修复。
- **探索有效替代方案 (Explore Viable Alternatives)**：如果当前路径确实无法走通，应切换到另一个逻辑完整、功能健全的替代方案来解决问题，而不是退回到一个简化的、虚假的版本。
- **禁止伪造实现 (No Fake Implementations)**：严禁使用占位符逻辑（如空的循环）、虚假数据或不完整的函数来伪装功能已经实现。所有交付的代码都必须是意图明确且具备真实逻辑的。
- **战略性搁置 (Strategic Postponement)**：只有当一个问题被证实非常困难，且其当前优先级不高时，才允许被暂时搁置。搁置时，必须以 `TODO` 形式在代码中或任务列表中明确标记，并清晰说明遇到的问题。在核心任务完成后，必须回过头来重新审视并解决这些被搁置的问题。
- **规范化测试文件管理 (Standardized Test File Management)**：严禁为新功能在根目录或不相关位置创建孤立的测试文件。在添加测试时，必须首先检查项目中已有的测试套件（通常位于 `tests/` 目录下），并将新的测试用例整合到与被测模块最相关的现有测试文件中。只有当确实没有合适的宿主文件时，才允许在 `tests/` 目录下创建符合项目命名规范的新测试文件。

**项目与代码维护 (Project & Code Maintenance)**

- **统一文档维护 (Unified Documentation Maintenance)**：严禁为每个独立任务（如重构、功能实现）创建新的总结文档（例如 `CODE_REFACTORING_SUMMARY.md`）。在任务完成后，必须优先检查项目中已有的相关文档（如 `README.md`、既有的设计文档等），并将新的总结、变更或补充内容直接整合到现有文档中，维护其完整性和时效性。
- **及时清理 (Timely Cleanup)**：在完成开发任务时，如果发现任何已无用（过时）的代码、文件或注释，应主动提出清理建议。

## Project Overview

This is a **Learning Management System (LMS)** designed for students aged 7-14, built with React/TypeScript and Supabase. The platform features interactive course content, AI-powered grading, gamification elements, and comprehensive progress tracking.

## Development Commands

### Common Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

### MCP (Model Context Protocol) 工具使用

项目已配置以下MCP工具以增强开发体验：
不要查看migration 来看数据库，而是用supabase mcp工具来查看

#### Supabase MCP 工具
用于直接查询和操作Supabase数据库：

**配置命令：**
```bash
claude mcp add-json supabase '{
  "command": "npx",
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--access-token",
    "sbp_7c1f52f0f92957eb73457db104dda6d1a56cd2cf"
  ]
}'
```

**使用方式：**
- 在Claude Code中直接使用 `supabase__query` 工具执行SQL查询
- 查看数据库结构：`supabase__describe_table`
- 列出所有表：`supabase__list_tables`

**常用查询示例：**
```sql
-- 查看系列问答提交记录
SELECT * FROM series_submissions WHERE status = 'graded' ORDER BY updated_at DESC LIMIT 5;

-- 查看AI评分记录
SELECT s.id, s.status, g.ai_score, g.final_score, g.graded_at 
FROM series_submissions s 
LEFT JOIN series_ai_gradings g ON s.id = g.submission_id 
WHERE s.status = 'graded';

-- 检查数据库约束
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'series_ai_gradings'::regclass;
```

#### Sequential Thinking MCP 工具
用于复杂问题的结构化思考：

**配置命令：**
```bash
claude mcp add-json sequential-thinking '{
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-sequential-thinking"
  ]
}'
```

**使用场景：**
- 复杂业务逻辑分析
- 架构设计决策
- 问题诊断和解决方案评估

#### MCP 工具调试

**当前状态：** MCP工具已配置但在会话中不可用，需要重启会话。

如果MCP工具在Claude Code中不可用，可以：

1. **检查工具状态：**
```bash
claude mcp list
```

2. **重新启动Claude Code会话：**
```bash
# 退出当前会话，重新启动
exit
claude code
```

3. **验证工具配置：**
```bash
# 检查配置文件
cat ~/.config/claude/mcp_servers.json
```

4. **手动测试工具：**
```bash
# 测试Supabase连接
npx @supabase/mcp-server-supabase@latest --access-token sbp_7c1f52f0f92957eb73457db104dda6d1a56cd2cf
```

5. **工具名称格式（重启后使用）：**
- `supabase__query` - 执行SQL查询
- `supabase__list_tables` - 列出所有表
- `supabase__describe_table` - 描述表结构
- `sequential_thinking__think` - 结构化思考

**解决当前问题的替代方案：**
由于MCP工具当前不可用，可以通过以下方式查看数据库：
1. 直接在Supabase Dashboard中查看
2. 使用项目中的现有服务层代码
3. 重启Claude Code会话后使用MCP工具

### Running Tests
- No test framework is currently configured
- When adding tests, check README.md or ask the user for test commands

## High-Level Architecture

### Frontend Structure
- **React 18** with TypeScript and Vite
- **Routing**: React Router DOM with lazy loading for performance
- **State Management**: 
  - Global state: Zustand (stores in `src/stores/`)
  - Component-level: React Context API (contexts in `src/contexts/`)
- **UI**: Shadcn UI components built on Radix UI with Tailwind CSS
- **Rich Text Editors**: BlockNote and Lexical for content creation

### Backend Architecture
- **Supabase** as the primary backend service
- **Database**: PostgreSQL with comprehensive migrations
- **Authentication**: Supabase Auth with role-based access (student, teacher, admin)
- **Edge Functions**: TypeScript functions in `supabase/functions/`
- **Storage**: Supabase Storage for file uploads

### Key Service Layer
The application uses a service-oriented architecture with key services:

- **`courseService.ts`**: Core course management, module/lesson CRUD, progress tracking
- **`authService.ts`**: Authentication with role management and Chinese pinyin support
- **`aiService.ts`**: AI chat integration (OpenRouter/Gemini) and automated grading (GPT-4)
- **`seriesQuestionnaireService.ts`**: Complex questionnaire system with AI grading
- **`gamificationService.ts`**: XP system and level progression
- **`achievementService.ts`**: Badge/achievement system
- **`notificationService.ts`**: 实时通知系统，支持师生间的作业提交和评分通知

### Data Flow
1. **Course Hierarchy**: Course → Module → Lesson structure
2. **Content Types**: Text, Video, Quiz, Assignment, Hotspot, Series Questionnaire
3. **Performance Optimization**: Extensive caching, optimized queries, lazy loading
4. **Real-time Features**: Streaming AI responses, live progress updates

## Important Development Guidelines

### Code Style
- **TypeScript**: Strong typing, avoid `any`, use interfaces/types
- **React**: Functional components only, use hooks
- **Naming**: camelCase for variables, PascalCase for components, UPPER_SNAKE_CASE for constants
- **File Structure**: Components in `src/components/`, pages in `src/pages/`, services in `src/services/`

### Architecture Patterns
- **Component Design**: Small, focused components with single responsibility
- **Service Layer**: Centralized business logic in service files
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance**: Implement caching, lazy loading, and optimized queries

### Authentication & Authorization
- Three user roles: student, teacher, admin
- Role-based route protection using `ProtectedRoute` component
- Chinese username support with pinyin conversion
- Session management with Supabase Auth

### AI Integration
- **Chat System**: OpenRouter API with Google Gemini model
- **Grading System**: GPT-4 for automated assessment of questionnaires
- **Streaming**: Real-time AI response streaming
- **Fallbacks**: Mock responses when AI services unavailable

### Database & Migrations
- All schema changes must go through Supabase migrations
- Migration files in `supabase/migrations/`
- Use descriptive migration names with timestamps
- Row Level Security (RLS) policies for data protection

### Configuration
- **Development**: Uses proxy configuration for Supabase in `vite.config.ts`
- **Environment**: Development/production environment detection
- **Paths**: TypeScript path aliases configured (`@/` for `src/`)

## Common Workflows

### Adding New Features
1. Create types in `src/types/`
2. Implement service logic in `src/services/`
3. Add database migrations if needed
4. Create components in `src/components/`
5. Add routes in `src/routes/index.tsx`
6. Test with both teacher and student roles

### Working with Courses
- Course creation/editing through `CourseCreator` component
- Module management with drag-and-drop ordering
- Lesson types: text, video, quiz, assignment, hotspot, series questionnaire
- Progress tracking integrates with gamification system

### AI Grading Implementation
- Series questionnaires support AI-powered grading
- Teachers can review and override AI grades
- Detailed feedback provided per question
- Integration with achievement system

## Project-Specific Notes

### Chinese Language Support
- Pinyin conversion for usernames (`pinyin-pro` library)
- Chinese UI text throughout the application
- Proper font handling for Chinese characters

### Performance Considerations
- Extensive caching implemented across services
- Lazy loading for routes and components
- Optimized database queries with selective field fetching
- Image optimization and compression

### Supabase Configuration
- Project ID: `ooyklqqgnphynyrziqyh`
- Development proxy configured in Vite
- Edge functions for complex operations
- Comprehensive RLS policies

### Testing Strategy
- No formal test framework currently configured
- Manual testing across different user roles required
- Test pages available for specific features (e.g., `/test-gamification`)


## File Organization

### Key Directories
- `src/components/`: Reusable UI components organized by feature
- `src/pages/`: Route-level components with lazy loading
- `src/services/`: Business logic and API interactions
- `src/stores/`: Global state management (Zustand)
- `src/contexts/`: React Context providers
- `src/types/`: TypeScript type definitions
- `supabase/functions/`: Serverless functions
- `supabase/migrations/`: Database schema migrations

### Important Files
- `src/routes/index.tsx`: Main routing configuration
- `src/integrations/supabase/client.ts`: Supabase client setup
- `vite.config.ts`: Build configuration with proxy setup
- `tailwind.config.ts`: Styling configuration
- `.cursor/rules/`: Development guidelines and standards

