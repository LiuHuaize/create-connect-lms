/**
 * 文件上传服务
 * 处理BlockNote编辑器的文件上传功能
 */
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// 存储桶名称常量
export const COURSE_ASSETS_BUCKET = 'course-assets';

/**
 * 将文件转换为Base64字符串
 * 用于内部存储和展示图片、文件等
 * 
 * @param file 要上传的文件
 * @returns Promise<string> 返回base64编码的文件内容
 */
export const uploadFileAsBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // 将文件转换为base64字符串
        const base64String = reader.result as string;
        resolve(base64String);
      };
      
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 上传文件到Supabase Storage
 * 用于存储图片、文件等
 * 
 * @param file 要上传的文件
 * @param folder 存储路径的文件夹，默认为'course-content'
 * @returns Promise<string> 返回公共访问URL
 */
export const uploadFileToSupabase = async (file: File, folder: string = 'course-content'): Promise<string> => {
  try {
    // 获取文件扩展名并生成安全的文件名
    const fileExt = file.name.split('.').pop() || '';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    
    // 构建文件路径
    const filePath = `${folder}/${fileName}`;
    
    // 上传到Supabase Storage
    const { data, error } = await supabase.storage
      .from(COURSE_ASSETS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('文件上传到Supabase失败:', error);
      throw error;
    }
    
    // 获取公共URL
    const { data: urlData } = supabase.storage
      .from(COURSE_ASSETS_BUCKET)
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('上传文件到Supabase失败:', error);
    throw new Error(`上传文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * 检测文件是否为图片
 * 
 * @param file 要检查的文件
 * @returns boolean 是否为图片
 */
const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * BlockNote编辑器专用的文件上传处理函数
 * 供BlockNote编辑器使用的上传函数
 * 
 * @param file 要上传的文件
 * @returns Promise<string> 返回文件URL
 */
export const handleBlockNoteFileUpload = async (file: File): Promise<string> => {
  try {
    // 检测文件类型
    if (isImageFile(file)) {
      // 对于图片，上传到Supabase并返回URL
      const folder = 'rich-editor/images';
      const url = await uploadFileToSupabase(file, folder);
      return url;
    } else {
      // 对于其他类型的文件，仍然使用Base64编码
      // 未来可以扩展为根据不同文件类型使用不同的存储策略
      return uploadFileAsBase64(file);
    }
  } catch (error) {
    console.error('文件上传处理失败:', error);
    toast.error('文件上传失败，请重试');
    throw error;
  }
}; 