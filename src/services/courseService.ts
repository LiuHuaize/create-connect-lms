
import { supabase } from '@/integrations/supabase/client';
import { 
  DbCourse, 
  DbCourseModule, 
  DbLesson, 
  NewCourse, 
  UpdateCourse, 
  mapDbModulesToAppModules,
  mapAppModulesToDbFormat
} from '@/types/db';
import { CourseModule, Lesson } from '@/types/course';

// Upload file to Supabase storage
export const uploadCourseMedia = async (file: File, path: string = ''): Promise<string | null> => {
  try {
    const filePath = path ? `${path}/${file.name}` : file.name;
    const { data, error } = await supabase.storage
      .from('course_media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      console.error('Error uploading file:', error.message);
      return null;
    }
    
    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from('course_media')
      .getPublicUrl(data.path);
      
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

// Create a new course
export const createCourse = async (course: NewCourse): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...course,
        status: 'draft'
      } as any) // Use type assertion to bypass type checking for now
      .select('id')
      .single();
      
    if (error) {
      console.error('Error creating course:', error.message);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error creating course:', error);
    return null;
  }
};

// Get a course by ID
export const getCourseById = async (courseId: string): Promise<DbCourse | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (error) {
      console.error('Error fetching course:', error.message);
      return null;
    }
    
    return data as unknown as DbCourse;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

// Update a course
export const updateCourse = async (courseId: string, updates: UpdateCourse): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', courseId);
      
    if (error) {
      console.error('Error updating course:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating course:', error);
    return false;
  }
};

// Publish a course
export const publishCourse = async (courseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', courseId);
      
    if (error) {
      console.error('Error publishing course:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error publishing course:', error);
    return false;
  }
};

// Get all modules for a course
export const getCourseModules = async (courseId: string): Promise<CourseModule[] | null> => {
  try {
    // Fetch modules
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
      
    if (modulesError) {
      console.error('Error fetching modules:', modulesError.message);
      return null;
    }
    
    // Fetch lessons for all modules
    const moduleIds = modules.map(module => module.id);
    if (moduleIds.length === 0) {
      return [];
    }
    
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds)
      .order('order_index');
      
    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError.message);
      return null;
    }
    
    return mapDbModulesToAppModules(modules as unknown as DbCourseModule[], lessons as unknown as DbLesson[]);
  } catch (error) {
    console.error('Error fetching course modules:', error);
    return null;
  }
};

// Create or update modules and lessons
export const saveCourseContent = async (
  courseId: string, 
  modules: CourseModule[]
): Promise<boolean> => {
  try {
    // Call the save_course_content RPC
    const { data, error } = await supabase.rpc('save_course_content', {
      p_course_id: courseId,
      p_modules: modules
    } as any);
    
    if (error) {
      console.error('Error saving course content:', error.message);
      
      // Fallback approach - delete and recreate
      return await saveCourseContentManually(courseId, modules);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving course content:', error);
    
    // Fallback approach - delete and recreate
    return await saveCourseContentManually(courseId, modules);
  }
};

// Manual approach to save course content when RPC fails
const saveCourseContentManually = async (
  courseId: string, 
  modules: CourseModule[]
): Promise<boolean> => {
  // First, delete all existing modules and lessons (cascades to lessons)
  const { error: deleteError } = await supabase
    .from('course_modules')
    .delete()
    .eq('course_id', courseId);
    
  if (deleteError) {
    console.error('Error deleting existing modules:', deleteError.message);
    return false;
  }
  
  // Now create new modules
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    
    // Insert module
    const { data: moduleData, error: moduleError } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title: module.title,
        order_index: i
      } as any)
      .select('id')
      .single();
      
    if (moduleError) {
      console.error('Error creating module:', moduleError.message);
      return false;
    }
    
    // Insert lessons for this module
    const lessonInserts = module.lessons.map((lesson, index) => ({
      module_id: moduleData.id,
      title: lesson.title,
      type: lesson.type,
      content: lesson.content,
      order_index: index
    }));
    
    if (lessonInserts.length > 0) {
      const { error: lessonError } = await supabase
        .from('lessons')
        .insert(lessonInserts as any);
        
      if (lessonError) {
        console.error('Error creating lessons:', lessonError.message);
        return false;
      }
    }
  }
  
  return true;
};

// Get all courses created by the current user
export const getUserCourses = async (): Promise<DbCourse[] | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching user courses:', error.message);
      return null;
    }
    
    return data as unknown as DbCourse[];
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return null;
  }
};

// Get public courses
export const getPublicCourses = async (): Promise<DbCourse[] | null> => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching public courses:', error.message);
      return null;
    }
    
    return data as unknown as DbCourse[];
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return null;
  }
};

// Delete a course
export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
      
    if (error) {
      console.error('Error deleting course:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    return false;
  }
};

