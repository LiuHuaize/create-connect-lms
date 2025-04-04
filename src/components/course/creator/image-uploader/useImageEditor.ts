
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Canvas, Image as FabricImage, Rect } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { ImageEditorState, EditorRefs, CourseImageUploaderProps } from './types';

export const useImageEditor = ({
  course, 
  setCourse, 
  setCoverImageURL
}: Pick<CourseImageUploaderProps, 'course' | 'setCourse' | 'setCoverImageURL'>) => {
  // Editor state
  const [state, setState] = useState<ImageEditorState>({
    isUploading: false,
    showImageEditor: false,
    editingImage: null,
    canvasInitialized: false,
    showLoader: false,
    isSaving: false,
    imageSaved: false,
    imageLoadError: false,
    currentStep: 'upload',
    cropPreviewURL: null,
    editorMode: 'move'
  });

  // Refs
  const refs: EditorRefs = {
    canvasRef: useRef<HTMLCanvasElement>(null),
    fabricCanvasRef: useRef<Canvas | null>(null),
    cropRect: null,
    imageRef: useRef<FabricImage | null>(null),
    previewCanvasRef: useRef<HTMLCanvasElement>(document.createElement('canvas')),
    previewImageRef: useRef<HTMLImageElement>(new Image()),
    loadingTimerRef: useRef<number | null>(null)
  };

  // 预加载图片函数
  const preloadImage = async (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => {
        setState(prev => ({ ...prev, imageLoadError: true }));
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  };

  const initializeEditor = async (imageUrl: string) => {
    if (!refs.canvasRef.current) return;
    
    try {
      setState(prev => ({ ...prev, showLoader: true }));
      
      // 设置加载超时保护
      refs.loadingTimerRef.current = window.setTimeout(() => {
        setState(prev => {
          if (!prev.canvasInitialized) {
            toast.error('图片加载超时，请重试');
            return { ...prev, imageLoadError: true, showLoader: false };
          }
          return prev;
        });
      }, 15000); // 15秒超时
      
      // 预加载图片
      try {
        await preloadImage(imageUrl);
      } catch (error) {
        console.error('预加载图片失败:', error);
        setState(prev => ({ ...prev, imageLoadError: true, showLoader: false }));
        if (refs.loadingTimerRef.current) {
          clearTimeout(refs.loadingTimerRef.current);
        }
        toast.error('无法加载图片，请重试');
        return;
      }
      
      // 清理现有画布
      if (refs.fabricCanvasRef.current) {
        refs.fabricCanvasRef.current.dispose();
        refs.fabricCanvasRef.current = null;
      }

      // 创建新画布并设置尺寸
      const canvas = new Canvas(refs.canvasRef.current, {
        width: 800,
        height: 450, // 16:9 比例
        backgroundColor: '#f0f0f0',
        preserveObjectStacking: true,
      });
      refs.fabricCanvasRef.current = canvas;

      // 加载并添加图片
      FabricImage.fromURL(imageUrl, {
        crossOrigin: 'anonymous'
      }).then(img => {
        refs.imageRef.current = img;
        
        // 计算图片适应画布的缩放比例
        const scaleX = canvas.width! / img.width!;
        const scaleY = canvas.height! / img.height!;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 使图片稍微小于画布
        
        // 设置图片属性
        img.set({
          originX: 'center',
          originY: 'center',
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: state.editorMode === 'move',
          evented: state.editorMode === 'move',
        });
        
        // 添加到画布
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        // 如果初始模式是裁剪，自动添加裁剪框
        if (state.editorMode === 'crop') {
          // 给一点时间让图片完全渲染
          setTimeout(() => {
            addCropRect();
          }, 100);
        }
        
        setState(prev => ({
          ...prev, 
          canvasInitialized: true, 
          showLoader: false,
          imageLoadError: false
        }));
        
        if (refs.loadingTimerRef.current) {
          clearTimeout(refs.loadingTimerRef.current);
        }
      }).catch(err => {
        console.error('加载图片到编辑器失败:', err);
        setState(prev => ({ ...prev, imageLoadError: true, showLoader: false }));
        if (refs.loadingTimerRef.current) {
          clearTimeout(refs.loadingTimerRef.current);
        }
        toast.error('无法加载图片进行编辑');
      });
    } catch (error) {
      console.error('初始化编辑器错误:', error);
      setState(prev => ({ ...prev, imageLoadError: true, showLoader: false }));
      if (refs.loadingTimerRef.current) {
        clearTimeout(refs.loadingTimerRef.current);
      }
      toast.error('初始化编辑器失败');
    }
  };

  const resetEditorState = () => {
    setState(prev => ({
      ...prev,
      editorMode: 'move',
      canvasInitialized: false,
      imageLoadError: false,
      showLoader: false,
      imageSaved: false,
      cropPreviewURL: null,
      currentStep: 'upload'
    }));
    
    if (refs.loadingTimerRef.current) {
      clearTimeout(refs.loadingTimerRef.current);
      refs.loadingTimerRef.current = null;
    }
    
    if (refs.fabricCanvasRef.current) {
      refs.fabricCanvasRef.current.dispose();
      refs.fabricCanvasRef.current = null;
    }
    
    refs.cropRect = null;
  };

  const addCropRect = () => {
    if (!refs.fabricCanvasRef.current || !refs.imageRef.current) return;
    
    const canvas = refs.fabricCanvasRef.current;
    
    // 移除已有的裁剪矩形
    if (refs.cropRect) {
      canvas.remove(refs.cropRect);
      refs.cropRect = null;
    }
    
    const img = refs.imageRef.current;
    
    // 根据16:9比例计算裁剪矩形尺寸
    const imgWidth = img.getScaledWidth();
    const imgHeight = img.getScaledHeight();
    
    let rectWidth, rectHeight;
    
    // 根据图片比例决定裁剪框大小
    const imgRatio = imgWidth / imgHeight;
    const targetRatio = 16 / 9;
    
    if (imgRatio >= targetRatio) {
      // 图片更宽，以高度为基准
      rectHeight = imgHeight * 0.9;
      rectWidth = rectHeight * targetRatio;
    } else {
      // 图片更高，以宽度为基准
      rectWidth = imgWidth * 0.9;
      rectHeight = rectWidth / targetRatio;
    }
    
    // 确保裁剪框不超出图片范围
    rectWidth = Math.min(rectWidth, imgWidth);
    rectHeight = Math.min(rectHeight, imgHeight);
    
    // 创建裁剪矩形
    const rect = new Rect({
      left: canvas.width! / 2 - rectWidth / 2,
      top: canvas.height! / 2 - rectHeight / 2,
      width: rectWidth,
      height: rectHeight,
      fill: 'rgba(0,0,0,0.15)',
      stroke: '#2563EB', // 边框颜色
      strokeWidth: 2,
      strokeUniform: true,
      strokeDashArray: [5, 5], // 虚线
      cornerColor: '#2563EB',
      transparentCorners: false,
      borderColor: '#2563EB',
      cornerSize: 10,
      hasRotatingPoint: false,
      lockRotation: true,
      selectable: true,
      evented: true,
    });
    
    // 锁定图片，使其不可选择
    if (refs.imageRef.current) {
      refs.imageRef.current.set({
        selectable: false,
        evented: false,
      });
    }
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    refs.cropRect = rect;
  };

  const handleToggleCropMode = () => {
    setState(prev => ({
      ...prev,
      editorMode: 'crop',
      currentStep: 'crop'
    }));
    addCropRect();
  };

  const handleApplyCrop = () => {
    if (!refs.fabricCanvasRef.current || !refs.cropRect || !refs.imageRef.current) return;
    
    const canvas = refs.fabricCanvasRef.current;
    const img = refs.imageRef.current;
    
    try {
      setState(prev => ({ ...prev, showLoader: true }));
      
      // 获取图片和裁剪矩形的位置和尺寸
      const imgLeft = img.left!;
      const imgTop = img.top!;
      const imgWidth = img.getScaledWidth();
      const imgHeight = img.getScaledHeight();
      const imgScaleX = img.scaleX!;
      const imgScaleY = img.scaleY!;
      
      const rectLeft = refs.cropRect.left!;
      const rectTop = refs.cropRect.top!;
      const rectWidth = refs.cropRect.getScaledWidth();
      const rectHeight = refs.cropRect.getScaledHeight();
      
      // 设置预览canvas大小为裁剪尺寸
      refs.previewCanvasRef.current.width = 1280; // 输出16:9标准尺寸
      refs.previewCanvasRef.current.height = 720;
      
      const ctx = refs.previewCanvasRef.current.getContext('2d');
      if (!ctx) {
        throw new Error('无法获取预览画布的上下文');
      }
      
      // 清空预览画布
      ctx.clearRect(0, 0, refs.previewCanvasRef.current.width, refs.previewCanvasRef.current.height);
      
      // 计算相对裁剪坐标
      const offsetX = rectLeft - (imgLeft - imgWidth/2);
      const offsetY = rectTop - (imgTop - imgHeight/2);
      
      // 计算源图像的坐标和尺寸
      const sourceX = (offsetX / imgScaleX);
      const sourceY = (offsetY / imgScaleY);
      const sourceWidth = (rectWidth / imgScaleX);
      const sourceHeight = (rectHeight / imgScaleY);
      
      // 获取原始图片
      const imgElement = img.getElement() as HTMLImageElement;
      
      // 在预览画布上绘制
      ctx.drawImage(
        imgElement,
        sourceX, 
        sourceY, 
        sourceWidth, 
        sourceHeight,
        0, 
        0, 
        refs.previewCanvasRef.current.width, 
        refs.previewCanvasRef.current.height
      );
      
      // 转换为数据URL并应用
      const croppedImageUrl = refs.previewCanvasRef.current.toDataURL('image/png', 0.95);
      
      setState(prev => ({
        ...prev,
        cropPreviewURL: croppedImageUrl,
        currentStep: 'preview',
        showLoader: false
      }));
      
      // 预加载裁剪后的图片确保显示正常
      refs.previewImageRef.current.src = croppedImageUrl;
      refs.previewImageRef.current.onload = () => {
        toast.success('图片裁剪成功，请检查预览效果');
      };
      
    } catch (error) {
      console.error('应用裁剪时出错:', error);
      setState(prev => ({ ...prev, showLoader: false }));
      toast.error('裁剪图片时出错');
    }
  };

  const handleSaveEditedImage = async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      // 使用裁剪后的图像或编辑后的图像
      let dataUrl;
      
      // 如果有裁剪预览，直接使用裁剪后的图像
      if (state.cropPreviewURL) {
        dataUrl = state.cropPreviewURL;
      } else if (refs.fabricCanvasRef.current && refs.imageRef.current) {
        // 将图片置于画布中心
        refs.fabricCanvasRef.current.centerObject(refs.imageRef.current);
        refs.fabricCanvasRef.current.renderAll();
      
        // 转换画布为数据URL
        dataUrl = refs.fabricCanvasRef.current.toDataURL({
          format: 'png',
          quality: 0.9,
          multiplier: 1.5, // 增加导出图像分辨率
        });
      } else {
        throw new Error('编辑器未准备好');
      }
      
      // 将数据URL转换为Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      // 检查blob是否有效
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
      setState(prev => ({ ...prev, isSaving: false }));
      toast.error('保存图片失败，请重试');
    }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // 初始化编辑器
  useEffect(() => {
    if (state.showImageEditor && state.editingImage && !state.canvasInitialized && state.currentStep === 'edit') {
      // 设置短暂延迟让对话框有时间渲染
      const timerId = setTimeout(() => {
        initializeEditor(state.editingImage);
      }, 150);
      
      return () => clearTimeout(timerId);
    }
  }, [state.showImageEditor, state.editingImage, state.canvasInitialized, state.currentStep]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (refs.fabricCanvasRef.current) {
        refs.fabricCanvasRef.current.dispose();
        refs.fabricCanvasRef.current = null;
      }
      
      if (refs.loadingTimerRef.current) {
        clearTimeout(refs.loadingTimerRef.current);
      }
      
      if (state.editingImage && state.editingImage.startsWith('blob:')) {
        URL.revokeObjectURL(state.editingImage);
      }
      
      if (state.cropPreviewURL && state.cropPreviewURL.startsWith('blob:')) {
        URL.revokeObjectURL(state.cropPreviewURL);
      }
    };
  }, []);

  return {
    state,
    setState,
    refs,
    handlers: {
      handleCoverImageUpload,
      handleToggleCropMode,
      handleApplyCrop,
      handleSaveEditedImage,
      resetEditorState
    }
  };
};
