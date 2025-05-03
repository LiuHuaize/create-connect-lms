/**
 * 文件上传服务
 * 处理BlockNote编辑器的文件上传功能
 */
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// 存储桶名称
const MEDIA_BUCKET = 'media';
const VIDEO_FOLDER = 'videos';
const AUDIO_FOLDER = 'audios';
const IMAGE_FOLDER = 'images';
const FILE_FOLDER = 'files';

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
 * 判断文件类型
 * @param file 文件
 */
const getFileType = (file: File): 'image' | 'video' | 'audio' | 'file' => {
  if (file.type.startsWith('image/')) {
    return 'image';
  } else if (file.type.startsWith('video/')) {
    return 'video';
  } else if (file.type.startsWith('audio/')) {
    return 'audio';
  } else {
    return 'file';
  }
};

/**
 * 获取存储文件路径
 * @param file 文件
 */
const getStoragePath = (file: File): string => {
  const fileType = getFileType(file);
  const fileName = `${uuidv4()}-${file.name}`;
  
  switch (fileType) {
    case 'image': 
      return `${IMAGE_FOLDER}/${fileName}`;
    case 'video': 
      return `${VIDEO_FOLDER}/${fileName}`;
    case 'audio': 
      return `${AUDIO_FOLDER}/${fileName}`;
    case 'file':
    default:
      return `${FILE_FOLDER}/${fileName}`;
  }
};

/**
 * 上传文件到Supabase存储
 * 
 * @param file 要上传的文件
 * @returns Promise<string> 返回公共访问URL
 */
export const uploadFileToSupabase = async (file: File): Promise<string> => {
  try {
    // 创建文件路径
    const filePath = getStoragePath(file);
    
    // 上传文件到Supabase存储
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('上传文件失败:', error);
      throw error;
    }
    
    // 获取公共URL
    const { data: { publicUrl } } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('文件上传处理失败:', error);
    // 如果上传失败，回退到Base64（仅适用于小文件）
    if (file.size < 5 * 1024 * 1024 && !file.type.startsWith('video/')) { // 小于5MB且不是视频
      console.warn('回退到Base64编码...');
      return uploadFileAsBase64(file);
    }
    throw error;
  }
};

/**
 * 上传文件到服务器
 * 使用Supabase存储
 * 
 * @param file 要上传的文件
 * @returns Promise<string> 返回文件URL
 */
export const uploadFileToServer = async (file: File): Promise<string> => {
  return uploadFileToSupabase(file);
};

/**
 * BlockNote编辑器专用的文件上传处理函数
 * 供BlockNote编辑器使用的上传函数
 * 
 * @param file 要上传的文件
 * @returns Promise<string> 返回文件URL
 */
export const handleBlockNoteFileUpload = async (file: File): Promise<string> => {
  // 检查文件大小
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制 (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`);
  }
  
  // 根据文件类型选择上传方式
  const fileType = getFileType(file);
  
  // 视频和音频文件使用Supabase存储
  if (fileType === 'video' || fileType === 'audio' || file.size > 2 * 1024 * 1024) {
    return uploadFileToSupabase(file);
  } else {
    // 小图片和小文档可以使用Base64
    return uploadFileAsBase64(file);
  }
}; 