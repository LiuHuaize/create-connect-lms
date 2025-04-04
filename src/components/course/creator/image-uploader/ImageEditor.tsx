
import React, { useEffect } from 'react';
import { Canvas, Image as FabricImage, Rect } from 'fabric';
import { Button } from '@/components/ui/button';
import { Crop, ArrowRight, Check, Clock, AlertCircle, Move } from 'lucide-react';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageEditorState, EditorRefs } from './types';
import StepsIndicator from './StepsIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editorState: ImageEditorState;
  setEditorState: React.Dispatch<React.SetStateAction<ImageEditorState>>;
  editorRefs: EditorRefs;
  onSaveImage: () => Promise<void>;
  resetEditor: () => void;
  handleToggleCropMode: () => void;
  handleApplyCrop: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  isOpen,
  onClose,
  editorState,
  setEditorState,
  editorRefs,
  onSaveImage,
  resetEditor,
  handleToggleCropMode,
  handleApplyCrop
}) => {
  // Description for each step
  const renderStepDescription = () => {
    switch(editorState.currentStep) {
      case 'edit':
        return '您可以拖动图片调整位置。需要裁剪吗？点击"进入裁剪模式"按钮继续';
      case 'crop':
        return '调整蓝色框的位置和大小，框内区域将作为封面图片。完成后点击"应用裁剪"';
      case 'preview':
        return '预览您裁剪后的图片效果。如果满意，点击"保存并使用"完成';
      default:
        return '您可以通过拖动调整图片位置，使用裁剪工具确保16:9的完美比例';
    }
  };

  // Close handler with cleanup
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // 关闭对话框时清理
      resetEditor();
      
      // 仅当是blob URL时释放
      if (editorState.editingImage && editorState.editingImage.startsWith('blob:')) {
        URL.revokeObjectURL(editorState.editingImage);
      }
      
      if (editorState.cropPreviewURL && editorState.cropPreviewURL.startsWith('blob:')) {
        URL.revokeObjectURL(editorState.cropPreviewURL);
      }
      
      setEditorState(prev => ({
        ...prev,
        editingImage: null,
        showImageEditor: false
      }));
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
        
        <StepsIndicator currentStep={editorState.currentStep} />
        
        <div className="p-4">
          {editorState.currentStep === 'edit' && (
            <div className="flex justify-center mb-4">
              <Button 
                onClick={handleToggleCropMode}
                disabled={!editorState.canvasInitialized || editorState.showLoader}
                className="bg-connect-blue hover:bg-blue-600"
              >
                <Crop size={16} className="mr-2" /> 进入裁剪模式 <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}
          
          {editorState.currentStep === 'crop' && (
            <div className="flex justify-center gap-3 mb-4">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditorState(prev => ({...prev, editorMode: 'move', currentStep: 'edit'}));
                  if (editorRefs.cropRect && editorRefs.fabricCanvasRef.current) {
                    editorRefs.fabricCanvasRef.current.remove(editorRefs.cropRect);
                    
                    // 解锁图片
                    if (editorRefs.imageRef.current) {
                      editorRefs.imageRef.current.set({
                        selectable: true,
                        evented: true,
                      });
                      editorRefs.fabricCanvasRef.current.setActiveObject(editorRefs.imageRef.current);
                      editorRefs.fabricCanvasRef.current.renderAll();
                    }
                  }
                }}
                disabled={editorState.showLoader}
              >
                返回编辑
              </Button>
              
              <Button 
                className="bg-connect-blue hover:bg-blue-600"
                onClick={handleApplyCrop}
                disabled={!editorRefs.cropRect || editorState.showLoader}
              >
                <Check size={16} className="mr-2" /> 应用裁剪 <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}
          
          {(editorState.currentStep === 'edit' || editorState.currentStep === 'crop') && (
            <div className="border rounded-md overflow-hidden shadow-sm relative min-h-[450px]">
              <canvas ref={editorRefs.canvasRef} className="w-full h-auto" />
              
              {/* 加载和错误状态 */}
              {(editorState.showLoader || !editorState.canvasInitialized) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                  <div className="bg-white p-4 rounded-md shadow flex items-center">
                    <Clock size={16} className="mr-2 animate-spin text-connect-blue" />
                    <p>正在加载图片编辑器...</p>
                  </div>
                </div>
              )}
              
              {editorState.imageLoadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="bg-white p-4 rounded-md shadow text-center max-w-md">
                    <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
                    <p className="font-medium text-red-600 mb-2">图片加载失败</p>
                    <p className="text-sm text-gray-600 mb-3">无法加载图片进行编辑，可能是图片已损坏或网络问题导致</p>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        resetEditor();
                        if (editorState.editingImage) {
                          setEditorState(prev => ({...prev, currentStep: 'edit'}));
                        }
                      }}
                    >
                      重试
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {editorState.currentStep === 'preview' && editorState.cropPreviewURL && (
            <div className="flex flex-col items-center">
              <div className="border rounded-md overflow-hidden shadow-sm mb-4 max-w-2xl">
                <AspectRatio ratio={16 / 9}>
                  <img 
                    src={editorState.cropPreviewURL} 
                    alt="裁剪预览" 
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setEditorState(prev => ({
                      ...prev,
                      cropPreviewURL: null,
                      currentStep: 'crop'
                    }));
                  }}
                  disabled={editorState.isSaving}
                >
                  返回裁剪
                </Button>
                
                <Button 
                  className="bg-connect-blue hover:bg-blue-600"
                  onClick={onSaveImage}
                  disabled={editorState.isSaving}
                >
                  {editorState.isSaving ? (
                    <span className="flex items-center">
                      <Clock size={16} className="mr-2 animate-spin" />
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
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleDialogClose(false)}
            disabled={editorState.isSaving}
          >
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditor;
