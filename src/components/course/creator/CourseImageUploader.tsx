
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Crop, Clock, Image as ImageIcon, Move, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Course } from '@/types/course';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Canvas, Image as FabricImage, Rect } from 'fabric';

interface CourseImageUploaderProps {
  course: Course;
  setCourse: React.Dispatch<React.SetStateAction<Course>>;
  coverImageURL: string | null;
  setCoverImageURL: React.Dispatch<React.SetStateAction<string | null>>;
}

const CourseImageUploader: React.FC<CourseImageUploaderProps> = ({ 
  course, 
  setCourse, 
  coverImageURL, 
  setCoverImageURL 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [editorMode, setEditorMode] = useState<'crop' | 'move'>('move');
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const imageRef = useRef<FabricImage | null>(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSaved, setImageSaved] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const loadingTimerRef = useRef<number | null>(null);

  // 更优化的预加载图片函数
  const preloadImage = async (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => {
        setImageLoadError(true);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  };

  const initializeEditor = async (imageUrl: string) => {
    if (!canvasRef.current) return;
    
    try {
      setShowLoader(true);
      
      // 设置加载超时保护
      loadingTimerRef.current = window.setTimeout(() => {
        if (!canvasInitialized) {
          setImageLoadError(true);
          setShowLoader(false);
          toast.error('图片加载超时，请重试');
        }
      }, 15000); // 15秒超时
      
      // 预加载图片
      try {
        await preloadImage(imageUrl);
      } catch (error) {
        console.error('预加载图片失败:', error);
        setImageLoadError(true);
        setShowLoader(false);
        clearTimeout(loadingTimerRef.current!);
        toast.error('无法加载图片，请重试');
        return;
      }
      
      // 清理现有画布
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }

      // 创建新画布并设置尺寸
      const canvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 450, // 16:9 比例
        backgroundColor: '#f0f0f0',
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = canvas;

      // 加载并添加图片
      FabricImage.fromURL(imageUrl, {
        crossOrigin: 'anonymous'
      }).then(img => {
        imageRef.current = img;
        
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
          selectable: editorMode === 'move',
          evented: editorMode === 'move',
        });
        
        // 添加到画布
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        setCanvasInitialized(true);
        setShowLoader(false);
        clearTimeout(loadingTimerRef.current!);
        setImageLoadError(false);
      }).catch(err => {
        console.error('加载图片到编辑器失败:', err);
        setImageLoadError(true);
        setShowLoader(false);
        clearTimeout(loadingTimerRef.current!);
        toast.error('无法加载图片进行编辑');
      });
    } catch (error) {
      console.error('初始化编辑器错误:', error);
      setImageLoadError(true);
      setShowLoader(false);
      clearTimeout(loadingTimerRef.current!);
      toast.error('初始化编辑器失败');
    }
  };

  const resetEditorState = () => {
    setEditorMode('move');
    setCropRect(null);
    setCanvasInitialized(false);
    setImageLoadError(false);
    setShowLoader(false);
    setImageSaved(false);
    
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }
  };

  const addCropRect = () => {
    if (!fabricCanvasRef.current || !imageRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    
    // 移除已有的裁剪矩形
    if (cropRect) {
      canvas.remove(cropRect);
      setCropRect(null);
    }
    
    const img = imageRef.current;
    
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
      left: img.left! - (rectWidth / 2) + (imgWidth / 2 - rectWidth / 2) / 2,
      top: img.top! - (rectHeight / 2) + (imgHeight / 2 - rectHeight / 2) / 2,
      width: rectWidth,
      height: rectHeight,
      fill: 'rgba(0,0,0,0.2)',
      stroke: '#2563EB', // 边框颜色
      strokeWidth: 2,
      strokeUniform: true,
      strokeDashArray: [5, 5], // 虚线
      cornerColor: '#2563EB',
      transparentCorners: false,
      borderColor: '#2563EB',
      cornerSize: 12,
      hasRotatingPoint: false,
      lockRotation: true,
      selectable: true,
      evented: true,
    });
    
    // 锁定图片，使其不可选择
    if (imageRef.current) {
      imageRef.current.set({
        selectable: false,
        evented: false,
      });
    }
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    setCropRect(rect);
  };

  const handleToggleCropMode = () => {
    if (!fabricCanvasRef.current) return;
    
    if (editorMode === 'crop') {
      // 从裁剪模式切换到移动模式
      setEditorMode('move');
      if (cropRect && fabricCanvasRef.current) {
        fabricCanvasRef.current.remove(cropRect);
        setCropRect(null);
      }
      
      // 解锁图片
      if (imageRef.current) {
        imageRef.current.set({
          selectable: true,
          evented: true,
        });
        fabricCanvasRef.current.setActiveObject(imageRef.current);
      }
      
      fabricCanvasRef.current.renderAll();
    } else {
      // 切换到裁剪模式
      setEditorMode('crop');
      addCropRect();
    }
  };

  const handleApplyCrop = () => {
    if (!fabricCanvasRef.current || !cropRect || !imageRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const img = imageRef.current;
    
    try {
      setShowLoader(true);
      
      // 计算图片和裁剪矩形的位置和尺寸
      const imgLeft = img.left!;
      const imgTop = img.top!;
      const imgWidth = img.getScaledWidth();
      const imgHeight = img.getScaledHeight();
      const imgScaleX = img.scaleX!;
      const imgScaleY = img.scaleY!;
      
      const rectLeft = cropRect.left!;
      const rectTop = cropRect.top!;
      const rectWidth = cropRect.getScaledWidth();
      const rectHeight = cropRect.getScaledHeight();
      
      // 计算相对裁剪坐标
      const relX = (rectLeft - (imgLeft - imgWidth/2)) / imgWidth;
      const relY = (rectTop - (imgTop - imgHeight/2)) / imgHeight;
      const relWidth = rectWidth / imgWidth;
      const relHeight = rectHeight / imgHeight;
      
      // 限制在0到1范围内
      const cropX = Math.max(0, Math.min(1, relX));
      const cropY = Math.max(0, Math.min(1, relY));
      const cropWidthRatio = Math.max(0, Math.min(1, relWidth));
      const cropHeightRatio = Math.max(0, Math.min(1, relHeight));
      
      // 创建临时画布进行裁剪
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.round(img.width! * cropWidthRatio / imgScaleX);
      tempCanvas.height = Math.round(img.height! * cropHeightRatio / imgScaleY);
      
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('无法创建临时画布上下文');
      
      // 获取原始图片元素
      const imgElement = img.getElement() as HTMLImageElement;
      
      // 在临时画布上绘制裁剪部分
      tempCtx.drawImage(
        imgElement, 
        Math.round(img.width! * cropX / imgScaleX), 
        Math.round(img.height! * cropY / imgScaleY), 
        Math.round(img.width! * cropWidthRatio / imgScaleX), 
        Math.round(img.height! * cropHeightRatio / imgScaleY), 
        0, 
        0, 
        tempCanvas.width, 
        tempCanvas.height
      );
      
      // 转换为数据URL
      const croppedImageUrl = tempCanvas.toDataURL('image/png', 1.0);
      
      // 更新图片并重置编辑器
      setEditingImage(croppedImageUrl);
      canvas.clear();
      
      // 使用新裁剪的图片重新初始化编辑器
      setTimeout(() => {
        initializeEditor(croppedImageUrl);
        setEditorMode('move');
        setCropRect(null);
      }, 100);
      
      toast.success('图片裁剪成功');
      
    } catch (error) {
      console.error('应用裁剪时出错:', error);
      setShowLoader(false);
      toast.error('裁剪图片时出错');
    }
  };

  const handleSaveEditedImage = async () => {
    if (!fabricCanvasRef.current || !imageRef.current) {
      toast.error('编辑器未准备好，请重试');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // 确保图片居中并适合16:9比例
      if (imageRef.current) {
        // 将图片置于画布中心
        fabricCanvasRef.current.centerObject(imageRef.current);
        fabricCanvasRef.current.renderAll();
      }
      
      // 转换画布为数据URL
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 0.9,
        multiplier: 1.5, // 增加导出图像分辨率
      });
      
      // 将数据URL转换为Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
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
      
      setImageSaved(true);
      
      // 短暂延迟后关闭编辑器
      setTimeout(() => {
        setShowImageEditor(false);
        setIsSaving(false);
      }, 1000);
      
      toast.success('封面图片已保存');
      
    } catch (error) {
      console.error('保存编辑后的图片失败:', error);
      setIsSaving(false);
      toast.error('保存图片失败，请重试');
    }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast.error('请上传图片文件');
        setIsUploading(false);
        return;
      }
      
      // 检查文件大小
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('图片大小不能超过5MB');
        setIsUploading(false);
        return;
      }
      
      // 创建临时URL
      const localImageUrl = URL.createObjectURL(file);
      setEditingImage(localImageUrl);
      
      // 打开编辑器
      setShowImageEditor(true);
      setIsUploading(false);
      
    } catch (error) {
      console.error('上传图片失败:', error);
      setIsUploading(false);
      toast.error('上传图片失败，请重试');
    }
  };

  const handleEditExistingImage = () => {
    if (coverImageURL || course.cover_image) {
      resetEditorState();
      // 添加时间戳防止缓存
      const imageUrl = `${coverImageURL || course.cover_image}?t=${Date.now()}`;
      setEditingImage(imageUrl);
      setShowImageEditor(true);
    }
  };

  useEffect(() => {
    // 清理函数
    return () => {
      // 清理画布资源
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
      
      // 清理定时器
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      
      // 释放Blob URL
      if (editingImage && editingImage.startsWith('blob:')) {
        URL.revokeObjectURL(editingImage);
      }
    };
  }, []);

  // 当对话框打开且有编辑图片时初始化编辑器
  useEffect(() => {
    if (showImageEditor && editingImage && !canvasInitialized) {
      // 设置短暂延迟让对话框有时间渲染
      const timerId = setTimeout(() => {
        initializeEditor(editingImage);
      }, 150);
      
      return () => clearTimeout(timerId);
    }
  }, [showImageEditor, editingImage, canvasInitialized]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4">课程封面</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {(coverImageURL || course.cover_image) ? (
          <div className="mb-4">
            <div className="relative mb-4 overflow-hidden rounded-md">
              <AspectRatio ratio={16 / 9}>
                <img 
                  src={`${coverImageURL || course.cover_image}?t=${Date.now()}`}
                  alt="课程封面" 
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&h=450&fit=crop';
                    toast.error('加载封面图片失败，已显示占位图');
                  }}
                />
              </AspectRatio>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEditExistingImage}
              >
                <Crop size={16} className="mr-2" /> 编辑图片
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setCoverImageURL(null);
                  setCourse(prev => ({ ...prev, cover_image: null }));
                  toast.success('已移除封面图片');
                }}
              >
                <Trash2 size={16} className="mr-2" /> 移除图片
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 mb-2">拖放图片至此，或点击浏览</p>
            <p className="text-xs text-gray-400 mb-4">推荐尺寸：1280x720像素（16:9比例）</p>
            <label>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isUploading}
                className="relative"
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">
                      <Clock size={16} />
                    </span>
                    上传中...
                  </span>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" /> 上传图片
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleCoverImageUpload}
                  disabled={isUploading}
                />
              </Button>
            </label>
          </>
        )}
      </div>
      
      <Dialog open={showImageEditor} onOpenChange={(open) => {
        if (!open) {
          // 关闭对话框时清理
          resetEditorState();
          
          // 仅当是blob URL时释放
          if (editingImage && editingImage.startsWith('blob:')) {
            URL.revokeObjectURL(editingImage);
          }
          
          setEditingImage(null);
          setShowImageEditor(false);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>编辑课程封面</DialogTitle>
            <DialogDescription>
              您可以通过拖动调整图片位置，使用裁剪工具确保16:9的完美比例
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4">
            <div className="flex justify-center gap-3 mb-4">
              <Button 
                variant={editorMode === 'move' ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setEditorMode('move')}
                disabled={!canvasInitialized || showLoader}
              >
                <Move size={16} className="mr-2" /> 移动
              </Button>
              <Button 
                variant={editorMode === 'crop' ? 'default' : 'outline'}
                size="sm" 
                onClick={handleToggleCropMode}
                disabled={!canvasInitialized || showLoader}
              >
                <Crop size={16} className="mr-2" /> 裁剪
              </Button>
              {editorMode === 'crop' && cropRect && (
                <Button 
                  variant="default"
                  size="sm" 
                  onClick={handleApplyCrop}
                  disabled={!canvasInitialized || showLoader}
                >
                  <Check size={16} className="mr-2" /> 应用裁剪
                </Button>
              )}
            </div>
            
            <div className="border rounded-md overflow-hidden shadow-sm relative min-h-[450px]">
              <canvas ref={canvasRef} className="w-full h-auto" />
              
              {/* 加载和错误状态 */}
              {(showLoader || !canvasInitialized) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                  <div className="bg-white p-4 rounded-md shadow flex items-center">
                    <Clock size={16} className="mr-2 animate-spin text-connect-blue" />
                    <p>正在加载图片编辑器...</p>
                  </div>
                </div>
              )}
              
              {imageLoadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="bg-white p-4 rounded-md shadow text-center max-w-md">
                    <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
                    <p className="font-medium text-red-600 mb-2">图片加载失败</p>
                    <p className="text-sm text-gray-600 mb-3">无法加载图片进行编辑，可能是图片已损坏或网络问题导致</p>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        resetEditorState();
                        if (editingImage) {
                          initializeEditor(editingImage);
                        }
                      }}
                    >
                      重试
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowImageEditor(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button 
              onClick={handleSaveEditedImage} 
              disabled={isSaving || !canvasInitialized || showLoader}
              className={`${imageSaved ? 'bg-green-600' : 'bg-connect-blue'} hover:opacity-90 transition-all text-white`}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">
                    <Clock size={16} />
                  </span>
                  保存中...
                </span>
              ) : imageSaved ? (
                <span className="flex items-center">
                  <Check size={16} className="mr-2" />
                  已保存
                </span>
              ) : (
                <>保存</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseImageUploader;
