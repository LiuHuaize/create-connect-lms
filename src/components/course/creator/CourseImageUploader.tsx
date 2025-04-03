import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Crop, Clock, Image as ImageIcon, Move, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Course } from '@/types/course';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Canvas, Point, Image as FabricImage, loadSVGFromURL } from 'fabric';

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
  const [cropRect, setCropRect] = useState<any | null>(null);
  const imageRef = useRef<FabricImage | null>(null);

  const initializeEditor = async (imageUrl: string) => {
    if (!canvasRef.current) return;
    
    // Clear any existing canvas
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    // Create a new fabric canvas
    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 450, // 16:9 aspect ratio
      backgroundColor: '#f9f9f9',
      preserveObjectStacking: true,
    });
    fabricCanvasRef.current = canvas;

    try {
      // Create and add the image
      FabricImage.fromURL(imageUrl, (img) => {
        // Set image options
        img.set({
          originX: 'center',
          originY: 'center',
          left: canvas.width! / 2,
          top: canvas.height! / 2,
        });

        // Scale the image to fit within the canvas
        const scaleX = canvas.width! / img.width!;
        const scaleY = canvas.height! / img.height!;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of the canvas size
        img.scale(scale);

        imageRef.current = img;
        canvas.add(img);
        canvas.renderAll();
      }, { crossOrigin: 'anonymous' });

    } catch (error) {
      console.error('Error loading image into editor:', error);
      toast.error('无法加载图片进行编辑');
    }
  };

  const addCropRect = () => {
    if (!fabricCanvasRef.current || !imageRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    
    // Remove existing crop rectangle if any
    if (cropRect) {
      canvas.remove(cropRect);
      setCropRect(null);
    }
    
    const img = imageRef.current;
    
    // Calculate rect dimensions based on 16:9 aspect ratio
    const rectWidth = img.getScaledWidth() * 0.8;
    const rectHeight = rectWidth * (9/16); // 16:9 aspect ratio
    
    const rect = new fabric.Rect({
      left: img.left! - rectWidth / 2,
      top: img.top! - rectHeight / 2,
      width: rectWidth,
      height: rectHeight,
      fill: 'rgba(0,0,0,0.2)',
      stroke: '#2563EB', // border color
      strokeWidth: 2,
      strokeUniform: true,
      strokeDashArray: [5, 5], // dashed line
      cornerColor: '#2563EB',
      transparentCorners: false,
      borderColor: '#2563EB',
      cornerSize: 10,
      hasRotatingPoint: false,
      lockRotation: true,
      maxWidth: img.getScaledWidth() * 0.95,
      maxHeight: img.getScaledHeight() * 0.95,
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setCropRect(rect);
  };

  const handleToggleCropMode = () => {
    if (!fabricCanvasRef.current) return;
    
    if (editorMode === 'crop') {
      // Switching from crop to move
      setEditorMode('move');
      if (cropRect && fabricCanvasRef.current) {
        fabricCanvasRef.current.remove(cropRect);
        setCropRect(null);
      }
    } else {
      // Switching to crop mode
      setEditorMode('crop');
      addCropRect();
    }
  };

  const handleApplyCrop = () => {
    if (!fabricCanvasRef.current || !cropRect || !imageRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const img = imageRef.current;
    
    try {
      // Calculate image and crop rectangle positions
      const imgLeft = img.left!;
      const imgTop = img.top!;
      const imgWidth = img.getScaledWidth();
      const imgHeight = img.getScaledHeight();
      
      const rectLeft = cropRect.left!;
      const rectTop = cropRect.top!;
      const rectWidth = cropRect.getScaledWidth();
      const rectHeight = cropRect.getScaledHeight();
      
      // Calculate relative crop coordinates
      const cropX = (rectLeft - (imgLeft - imgWidth/2)) / imgWidth;
      const cropY = (rectTop - (imgTop - imgHeight/2)) / imgHeight;
      const cropWidthRatio = rectWidth / imgWidth;
      const cropHeightRatio = rectHeight / imgHeight;
      
      // Create a temporary canvas to extract the cropped image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width! * cropWidthRatio;
      tempCanvas.height = img.height! * cropHeightRatio;
      
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('无法创建临时画布上下文');
      
      // Draw the cropped portion of the image
      const imgElement = img.getElement() as HTMLImageElement;
      tempCtx.drawImage(
        imgElement, 
        img.width! * cropX, 
        img.height! * cropY, 
        img.width! * cropWidthRatio, 
        img.height! * cropHeightRatio, 
        0, 
        0, 
        tempCanvas.width, 
        tempCanvas.height
      );
      
      // Convert to data URL and update the editor
      const croppedImageUrl = tempCanvas.toDataURL('image/png');
      setEditingImage(croppedImageUrl);
      
      // Reset the canvas and reload with the cropped image
      canvas.clear();
      initializeEditor(croppedImageUrl);
      
      // Reset editor mode
      setEditorMode('move');
      setCropRect(null);
      
      toast.success('图片裁剪成功');
      
    } catch (error) {
      console.error('Error applying crop:', error);
      toast.error('裁剪图片时出错');
    }
  };

  const handleSaveEditedImage = async () => {
    if (!fabricCanvasRef.current || !imageRef.current) return;
    
    try {
      setIsUploading(true);
      
      // Convert canvas to data URL
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 0.8,
      });
      
      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `course-cover-${Date.now()}.png`, { type: 'image/png' });
      
      const fileExt = 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `course-covers/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('course-assets')
        .upload(filePath, file);
        
      if (error) {
        throw error;
      }
      
      const { data: publicURL } = supabase.storage
        .from('course-assets')
        .getPublicUrl(filePath);
        
      setCoverImageURL(publicURL.publicUrl);
      setCourse(prev => ({ ...prev, cover_image: publicURL.publicUrl }));
      
      setShowImageEditor(false);
      toast.success('封面图片已保存');
      
    } catch (error) {
      console.error('保存编辑后的图片失败:', error);
      toast.error('保存图片失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Create a temporary URL for the uploaded file
      const localImageUrl = URL.createObjectURL(file);
      setEditingImage(localImageUrl);
      setShowImageEditor(true);
      
    } catch (error) {
      console.error('上传图片失败:', error);
      toast.error('上传图片失败，请重试');
      setIsUploading(false);
    }
  };

  const handleEditExistingImage = () => {
    if (coverImageURL || course.cover_image) {
      setEditingImage(coverImageURL || course.cover_image || '');
      setShowImageEditor(true);
    }
  };

  useEffect(() => {
    if (showImageEditor && editingImage) {
      initializeEditor(editingImage);
    }
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [showImageEditor, editingImage]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4">课程封面</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {(coverImageURL || course.cover_image) ? (
          <div className="mb-4">
            <div className="relative mb-4 overflow-hidden rounded-md">
              <AspectRatio ratio={16 / 9}>
                <img 
                  src={coverImageURL || course.cover_image!} 
                  alt="课程封面" 
                  className="absolute inset-0 w-full h-full object-cover"
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
          URL.revokeObjectURL(editingImage || '');
          setEditingImage(null);
          setShowImageEditor(false);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>编辑课程封面</DialogTitle>
          </DialogHeader>
          
          <div className="p-4">
            <div className="flex justify-center gap-3 mb-4">
              <Button 
                variant={editorMode === 'move' ? 'default' : 'outline'}
                size="sm" 
                onClick={() => setEditorMode('move')}
              >
                <Move size={16} className="mr-2" /> 移动
              </Button>
              <Button 
                variant={editorMode === 'crop' ? 'default' : 'outline'}
                size="sm" 
                onClick={handleToggleCropMode}
              >
                <Crop size={16} className="mr-2" /> 裁剪
              </Button>
              {editorMode === 'crop' && cropRect && (
                <Button 
                  variant="default"
                  size="sm" 
                  onClick={handleApplyCrop}
                >
                  <Check size={16} className="mr-2" /> 应用裁剪
                </Button>
              )}
            </div>
            
            <div className="border rounded-md overflow-hidden shadow-sm">
              <canvas ref={canvasRef} className="w-full h-auto" />
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              提示：您可以通过拖动调整图片位置，使用裁剪工具确保16:9的完美比例
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowImageEditor(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleSaveEditedImage} 
              disabled={isUploading}
              className="bg-connect-blue hover:bg-blue-600"
            >
              {isUploading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">
                    <Clock size={16} />
                  </span>
                  保存中...
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
