
import { Database } from '@/integrations/supabase/types';
import { 
  CourseModule, 
  Lesson, 
  LessonType,
  LessonContent,
  VideoLessonContent,
  TextLessonContent,
  QuizLessonContent,
  AssignmentLessonContent
} from './course';

// Database course types
export type DbCourse = {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  category: string | null;
  difficulty: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  status: 'draft' | 'published';
};

export type DbCourseModule = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbLesson = {
  id: string;
  module_id: string;
  title: string;
  type: LessonType;
  content: LessonContent;
  order_index: number;
  created_at: string;
  updated_at: string;
};

// Type for creating a new course
export type NewCourse = {
  title: string;
  description?: string;
  short_description?: string;
  category?: string;
  difficulty?: string;
  cover_image_url?: string;
};

// Type for updating a course
export type UpdateCourse = {
  title?: string;
  description?: string;
  short_description?: string;
  category?: string;
  difficulty?: string;
  cover_image_url?: string;
  status?: 'draft' | 'published';
  published_at?: string | null;
};

// Conversion functions between app and DB types
export const mapDbModulesToAppModules = (
  dbModules: DbCourseModule[],
  dbLessons: DbLesson[]
): CourseModule[] => {
  return dbModules.map((dbModule) => {
    const moduleLessons = dbLessons
      .filter((lesson) => lesson.module_id === dbModule.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content
      }));

    return {
      id: dbModule.id,
      title: dbModule.title,
      lessons: moduleLessons
    };
  }).sort((a, b) => {
    const aIndex = dbModules.findIndex((m) => m.id === a.id);
    const bIndex = dbModules.findIndex((m) => m.id === b.id);
    return aIndex - bIndex;
  });
};

export const mapAppModulesToDbFormat = (
  modules: CourseModule[],
  courseId: string
): { 
  dbModules: Omit<DbCourseModule, 'id' | 'created_at' | 'updated_at'>[],
  dbLessons: Omit<DbLesson, 'id' | 'created_at' | 'updated_at'>[]
} => {
  const dbModules: Omit<DbCourseModule, 'id' | 'created_at' | 'updated_at'>[] = [];
  const dbLessons: Omit<DbLesson, 'id' | 'created_at' | 'updated_at'>[] = [];

  modules.forEach((module, moduleIndex) => {
    // Add module
    dbModules.push({
      course_id: courseId,
      title: module.title,
      order_index: moduleIndex
    });

    // Process lessons for this module
    module.lessons.forEach((lesson, lessonIndex) => {
      dbLessons.push({
        module_id: module.id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        order_index: lessonIndex
      });
    });
  });

  return { dbModules, dbLessons };
};
