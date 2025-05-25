/**
 * 文件上传服务
 * 处理BlockNote编辑器的文件上传功能
 */
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// 存储桶名称常量
export const COURSE_ASSETS_BUCKET = 'course-assets';
export const COURSE_VIDEOS_BUCKET = 'course_videos';

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
 * @param bucketName 存储桶名称，默认为COURSE_ASSETS_BUCKET
 * @returns Promise<string> 返回公共访问URL
 */
export const uploadFileToSupabase = async (
  file: File, 
  folder: string = 'course-content',
  bucketName: string = COURSE_ASSETS_BUCKET
): Promise<string> => {
  try {
    console.log('开始上传文件到Supabase:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder,
      bucketName
    });

    // 获取文件扩展名并生成安全的文件名
    const fileExt = file.name.split('.').pop() || '';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    
    // 构建文件路径
    const filePath = `${folder}/${fileName}`;
    
    // 上传到Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // 允许覆盖现有文件
      });
      
    if (error) {
      console.error('文件上传到Supabase失败:', error);
      throw error;
    }
    
    console.log('文件上传成功:', data);
    
    // 获取公共URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    console.log('获取文件公共URL成功:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('上传文件到Supabase失败:', error);
    throw new Error(`上传文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * 上传视频文件到专用的视频存储桶
 * 
 * @param file 要上传的视频文件
 * @param folder 存储路径的文件夹，默认为'videos'
 * @returns Promise<string> 返回公共访问URL
 */
export const uploadVideoToSupabase = async (
  file: File, 
  folder: string = 'videos'
): Promise<string> => {
  try {
    // 检查是否为视频文件
    if (!file.type.startsWith('video/')) {
      throw new Error('请上传视频文件');
    }

    return await uploadFileToSupabase(file, folder, COURSE_VIDEOS_BUCKET);
  } catch (error) {
    console.error('视频上传失败:', error);
    throw error;
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
 * 检测文件是否为视频
 * 
 * @param file 要检查的文件
 * @returns boolean 是否为视频
 */
const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

/**
 * 检测文件是否为音频
 * 
 * @param file 要检查的文件
 * @returns boolean 是否为音频
 */
const isAudioFile = (file: File): boolean => {
  return file.type.startsWith('audio/');
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
    console.log('BlockNote文件上传开始:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 根据文件类型选择不同的处理策略
    if (isImageFile(file)) {
      // 对于图片，上传到资源存储桶
      const folder = 'rich-editor/images';
      const url = await uploadFileToSupabase(file, folder, COURSE_ASSETS_BUCKET);
      console.log('图片上传成功:', url);
      return url;
    } else if (isVideoFile(file)) {
      // 对于视频，上传到视频存储桶
      const folder = 'rich-editor/videos';
      const url = await uploadVideoToSupabase(file, folder);
      console.log('视频上传成功:', url);
      return url;
    } else if (isAudioFile(file)) {
      // 对于音频，上传到资源存储桶
      const folder = 'rich-editor/audio';
      const url = await uploadFileToSupabase(file, folder, COURSE_ASSETS_BUCKET);
      console.log('音频上传成功:', url);
      return url;
    } else {
      // 对于其他类型的文件，上传到资源存储桶
      const folder = 'rich-editor/files';
      const url = await uploadFileToSupabase(file, folder, COURSE_ASSETS_BUCKET);
      console.log('文件上传成功:', url);
      return url;
    }
  } catch (error) {
    console.error('文件上传处理失败:', error);
    toast.error(`文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    throw error;
  }
}; 