import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { supabase } from '@/integrations/supabase/client';
import { ImageEditorState, CropperRefs, CourseImageUploaderProps } from './types';

// 帮助函数：通过宽高和长宽比创建裁剪
function createCrop(
  width: number,
  height: number,
  aspect: number = 16 / 9,
  percentage: number = 90
): Crop {
  return makeAspectCrop(
    {
      unit: '%',
      width: percentage,
    },
    aspect,
    width,
    height
  );
}

// 帮助函数：创建居中裁剪
function createCenteredCrop(
  width: number,
  height: number,
  aspect: number = 16 / 9,
  percentage: number = 90
): Crop {
  const crop = createCrop(width, height, aspect, percentage);
  return centerCrop(crop, width, height);
}

// 将裁剪区域画到canvas上
function cropImageToCanvas(
  image: HTMLImageElement,
  crop: PixelCrop,
  canvas: HTMLCanvasElement,
  scaleX: number = 1,
  scaleY: number = 1
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  // 设置canvas的尺寸为输出尺寸
  canvas.width = 1280; // 固定宽度 - 16:9比例
  canvas.height = 720;

  // 绘制剪裁后的图像
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}

// 从canvas创建图像URL
async function canvasToBlob(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const croppedImageUrl = URL.createObjectURL(blob);
        resolve(croppedImageUrl);
      },
      'image/png',
      0.95
    );
  });
}

export const useImageEditor = ({
  course, 
  setCourse, 
  setCoverImageURL
}: Pick<CourseImageUploaderProps, 'course' | 'setCourse' | 'setCoverImageURL'>) => {
  // 状态
  const [state, setState] = useState<ImageEditorState>({
    isUploading: false,
    showImageEditor: false,
    editingImage: null,
    isSaving: false,
    imageSaved: false,
    currentStep: 'upload',
    cropPreviewURL: null
  });

  // 裁剪状态
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  
  // ref
  const refs: CropperRefs = {
    imgRef: useRef<HTMLImageElement>(null),
    previewCanvasRef: useRef<HTMLCanvasElement>(null)
  };

  // 重置编辑器状态
  const resetEditorState = useCallback(() => {
    setState(prev => ({
      ...prev,
      imageSaved: false,
      cropPreviewURL: null,
      currentStep: 'upload'
    }));
    
    setCrop(undefined);
    setCompletedCrop(undefined);

    // 清理URL
    if (state.cropPreviewURL && state.cropPreviewURL.startsWith('blob:')) {
      URL.revokeObjectURL(state.cropPreviewURL);
    }
  }, [state.cropPreviewURL]);

  // 图片加载完成后处理
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // 默认长宽比16:9
    const aspect = 16 / 9;
    
    // 创建并居中裁剪区域
    const crop = createCenteredCrop(width, height, aspect);
    setCrop(crop);
    
    // 更新状态为编辑模式
    setState(prev => ({
      ...prev,
      currentStep: 'crop'
    }));
  }, []);

  // 生成预览
  const generatePreview = useCallback(async () => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      refs.imgRef.current &&
      refs.previewCanvasRef.current
    ) {
      // 计算缩放比例
      const scaleX = refs.imgRef.current.naturalWidth / refs.imgRef.current.width;
      const scaleY = refs.imgRef.current.naturalHeight / refs.imgRef.current.height;
      
      // 生成画布
      cropImageToCanvas(
        refs.imgRef.current,
        completedCrop,
        refs.previewCanvasRef.current,
        scaleX,
        scaleY
      );
      
      try {
        // 从画布获取Blob URL
        const croppedImageUrl = await canvasToBlob(refs.previewCanvasRef.current);
        
        setState(prev => ({
          ...prev,
          cropPreviewURL: croppedImageUrl,
          currentStep: 'preview'
        }));
        
        toast.success('图片裁剪成功，请检查预览效果');
      } catch (error) {
        console.error('生成预览图片失败:', error);
        toast.error('生成预览图片失败');
      }
    }
  }, [completedCrop]);

  // 处理裁剪完成
  const handleApplyCrop = useCallback(() => {
    if (!completedCrop?.width || !completedCrop?.height) {
      toast.error('请先选择裁剪区域');
      return;
    }
    
    generatePreview();
  }, [completedCrop, generatePreview]);

  // 保存裁剪后的图片
  const handleSaveEditedImage = useCallback(async (blob: Blob) => {
    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      // 直接检查传入的 blob
      if (!blob || blob.size === 0) {
        throw new Error('生成的图片数据无效');
      }
      
      const file = new File([blob], `course-cover-${Date.now()}.png`, { type: 'image/png' });
      
      const fileExt = 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `course-covers/${fileName}`;
      
      // 上传到Supabase存储
      const { data, error } = await supabase.storage
        .from('course-assets')
        .upload(filePath, file);
        
      if (error) {
        throw error;
      }
      
      // 获取公共URL
      const { data: publicURL } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filePath);
        
      // 更新课程封面URL
      setCoverImageURL(publicURL.publicUrl);
      setCourse(prev => ({ ...prev, cover_image: publicURL.publicUrl }));
      
      setState(prev => ({ ...prev, imageSaved: true }));
      toast.success('封面图片已保存');
      
      // 短暂延迟后关闭编辑器
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          showImageEditor: false,
          isSaving: false 
        }));
        resetEditorState();
      }, 1000);
      
    } catch (error) {
      console.error('保存编辑后的图片失败:', error);
      toast.error('保存图片失败，请重试');
    } finally {
      // 确保 isSaving 状态在成功或失败时都被重置
      setState(prev => ({ ...prev, isSaving: false })); 
    }
  }, [setCourse, setCoverImageURL, resetEditorState]);

  // 处理图片上传
  const handleCoverImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setState(prev => ({ ...prev, isUploading: true }));
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast.error('请上传图片文件');
        setState(prev => ({ ...prev, isUploading: false }));
        return;
      }
      
      // 检查文件大小
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('图片大小不能超过5MB');
        setState(prev => ({ ...prev, isUploading: false }));
        return;
      }
      
      // 创建临时URL
      const localImageUrl = URL.createObjectURL(file);
      
      setState(prev => ({ 
        ...prev, 
        editingImage: localImageUrl,
        showImageEditor: true,
        currentStep: 'edit',
        isUploading: false
      }));
      
    } catch (error) {
      console.error('上传图片失败:', error);
      setState(prev => ({ ...prev, isUploading: false }));
      toast.error('上传图片失败，请重试');
    }
  }, []);

  // 返回所有需要的状态和处理函数
  return {
    state,
    setState,
    crop,
    setCrop,
    completedCrop,
    setCompletedCrop,
    refs,
    handlers: {
      resetEditorState,
      onImageLoad,
      handleApplyCrop,
      handleSaveEditedImage,
      handleCoverImageUpload,
    }
  };
}; 