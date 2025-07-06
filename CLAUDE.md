# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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