import React, { useState, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageEditorProps } from './types';
import StepsIndicator from './StepsIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Spinner } from '@/components/ui/spinner';

const ImageEditor: React.FC<ImageEditorProps> = ({
  isOpen,
  onClose,
  editingImage,
  onSaveImage,
  aspect = 16 / 9
}) => {
  // 状态
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [currentStep, setCurrentStep] = useState<'edit' | 'preview'>('edit');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 引用
  const imgRef = React.useRef<HTMLImageElement>(null);
  const previewCanvasRef = React.useRef<HTMLCanvasElement>(null);

  // 描述
  const renderStepDescription = () => {
    switch (currentStep) {
      case 'edit':
        return '调整蓝色框的位置和大小，框内区域将作为封面图片。完成后点击"应用裁剪"';
      case 'preview':
        return '预览您裁剪后的图片效果。如果满意，点击"保存并使用"完成';
      default:
        return '您可以通过调整裁剪框确保16:9的完美比例';
    }
  };

  // 图片加载完成
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // 创建居中的裁剪区域
    const newCrop: Crop = {
      unit: '%',
      width: 90,
      height: (90 / aspect) * (width / height),
      x: 5,
      y: 5
    };
    
    setCrop(newCrop);
  }, [aspect]);

  // 将裁剪区域绘制到Canvas
  const generatePreview = useCallback(async () => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      setIsLoading(true);
      
      try {
        // 计算缩放比例
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        
        // 设置canvas的尺寸
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('无法获取Canvas上下文');
        }
        
        // 使用16:9比例
        canvas.width = 1280;
        canvas.height = 720;
        
        // 清空canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制裁剪区域
        ctx.drawImage(
          imgRef.current,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height
        );
        
        // 将canvas转换为Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              toast.error('生成预览图片失败');
              setIsLoading(false);
              return;
            }
            
            // 创建URL并设置预览
            const croppedImageUrl = URL.createObjectURL(blob);
            setPreviewUrl(croppedImageUrl);
            setPreviewBlob(blob);
            setCurrentStep('preview');
            setIsLoading(false);
            toast.success('图片裁剪成功，请检查预览效果');
          },
          'image/png',
          0.95
        );
      } catch (error) {
        console.error('生成预览图片失败:', error);
        toast.error('生成预览图片失败');
        setIsLoading(false);
      }
    }
  }, [completedCrop]);

  // 应用裁剪
  const handleApplyCrop = () => {
    if (!completedCrop?.width || !completedCrop?.height) {
      toast.error('请先选择裁剪区域');
      return;
    }
    
    generatePreview();
  };

  // 保存图片
  const handleSaveImage = async () => {
    if (!previewBlob) {
      toast.error('预览图片数据未生成');
      return;
    }
    
    try {
      setIsLoading(true);
      // 不需要再 fetch blob，因为我们已经有了 previewBlob
      // const res = await fetch(previewUrl);
      // const blob = await res.blob();
      // if (!blob || blob.size === 0) { throw new Error('生成的图片数据无效'); }
      
      // 调用父组件的保存函数，直接传递 Blob
      await onSaveImage(previewBlob);
      
      // 关闭对话框
      handleDialogClose(false);
    } catch (error) {
      console.error('保存图片失败:', error);
      toast.error('保存图片失败，请重试');
      setIsLoading(false);
    }
  };

  // 关闭对话框
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // 清理URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // 重置状态
      setCrop(undefined);
      setCompletedCrop(undefined);
      setPreviewUrl(null);
      setPreviewBlob(null);
      setCurrentStep('edit');
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>编辑课程封面</DialogTitle>
          <DialogDescription>
            {renderStepDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <StepsIndicator currentStep={currentStep === 'edit' ? 'crop' : 'preview'} />
        
        <div className="p-4">
          {currentStep === 'edit' && (
            <>
              <div className="border rounded-md overflow-hidden shadow-sm relative min-h-[450px]">
                {editingImage && (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    ruleOfThirds
                    className="max-h-[450px] mx-auto"
                  >
                    <img
                      ref={imgRef}
                      src={editingImage}
                      alt="编辑图片"
                      onLoad={onImageLoad}
                      className="max-h-[450px] mx-auto"
                      crossOrigin="anonymous"
                    />
                  </ReactCrop>
                )}
              </div>
              
              <div className="flex justify-center mt-4">
                <Button 
                  className="bg-connect-blue hover:bg-blue-600"
                  onClick={handleApplyCrop}
                  disabled={isLoading || !completedCrop?.width || !completedCrop?.height}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Spinner size="sm" className="mr-2" />
                      处理中...
                    </span>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" /> 应用裁剪 <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
          
          {currentStep === 'preview' && previewUrl && (
            <div className="flex flex-col items-center w-full">
              <div className="border rounded-md overflow-hidden shadow-sm mb-4 w-5/6">
                <AspectRatio ratio={16 / 9}>
                  <img 
                    src={previewUrl} 
                    alt="裁剪预览" 
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // 清理预览URL
                    if (previewUrl && previewUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setPreviewUrl(null);
                    setPreviewBlob(null);
                    setCurrentStep('edit');
                  }}
                  disabled={isLoading}
                >
                  返回裁剪
                </Button>
                
                <Button 
                  className="bg-connect-blue hover:bg-blue-600"
                  onClick={handleSaveImage}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Spinner size="sm" className="mr-2" />
                      保存中...
                    </span>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" /> 保存并使用
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* 隐藏的Canvas用于生成预览 */}
          <canvas
            ref={previewCanvasRef}
            style={{
              display: 'none',
              width: 0,
              height: 0,
            }}
          />
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleDialogClose(false)}
            disabled={isLoading}
          >
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditor; 