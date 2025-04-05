import React from 'react';
import { toast } from 'sonner';
import { Course } from '@/types/course';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Upload, Image as ImageIcon, PenLine, Trash2 } from 'lucide-react';
import UploadPlaceholder from './image-uploader/UploadPlaceholder';
import ExistingImage from './image-uploader/ExistingImage';
import ImageEditor from './image-uploader/ImageEditor';
import { useImageEditor } from './image-uploader/useImageEditor';
import { CourseImageUploaderProps } from './image-uploader/types';

const CourseImageUploader: React.FC<CourseImageUploaderProps> = ({ 
  course, 
  setCourse, 
  coverImageURL, 
  setCoverImageURL 
}) => {
  // Use the custom hook for image editor functionality
  const { 
    state, 
    setState, 
    refs,
    handlers
  } = useImageEditor({ course, setCourse, setCoverImageURL });

  // Handler for editing existing image
  const handleEditExistingImage = () => {
    if (coverImageURL || course.cover_image) {
      handlers.resetEditorState();
      // 添加时间戳防止缓存
      const imageUrl = `${coverImageURL || course.cover_image}?t=${Date.now()}`;
      setState(prev => ({
        ...prev,
        editingImage: imageUrl,
        showImageEditor: true,
        currentStep: 'edit'
      }));
    }
  };

  // 生成随机封面背景渐变色
  const randomGradient = () => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-orange-400 to-pink-600',
      'from-pink-500 to-rose-600',
      'from-purple-500 to-indigo-600',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">课程封面</h2>
        <div className="text-xs text-gray-500">推荐尺寸: 1280 × 720px</div>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg overflow-hidden">
        <AspectRatio ratio={16 / 9} className="relative">
          {(coverImageURL || course.cover_image) ? (
            <div className="w-full h-full relative group">
              <img 
                src={coverImageURL || course.cover_image!} 
                alt="课程封面" 
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-3">
                  <button 
                    onClick={handleEditExistingImage}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 hover:shadow-md transition-all"
                    aria-label="编辑图片"
                  >
                    <PenLine size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      setCoverImageURL(null);
                      setCourse(prev => ({ ...prev, cover_image: null }));
                      toast.success('已移除封面图片');
                    }}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 hover:shadow-md transition-all"
                    aria-label="删除图片"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${randomGradient()} flex flex-col items-center justify-center text-white p-6 cursor-pointer`}
                 onClick={() => handlers.handleCoverImageUpload()}>
              <div className="mb-4 p-4 bg-white/20 backdrop-blur-sm rounded-full">
                <Upload size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">上传课程封面</h3>
              <p className="text-center text-white/80 max-w-md">
                添加精美的封面图片能够吸引更多学生，提高课程点击率
              </p>
              <div className="mt-4 py-2 px-4 bg-white/30 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/40 transition-colors">
                选择图片
              </div>
              
              {state.isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white">上传中...</div>
                </div>
              )}
            </div>
          )}
        </AspectRatio>
      </div>
      
      <div className="mt-3 text-sm text-gray-500">
        <div className="flex items-center">
          <ImageIcon size={14} className="mr-1.5" />
          <span>添加高质量的封面图片将显著提高课程吸引力</span>
        </div>
      </div>
      
      <ImageEditor 
        isOpen={state.showImageEditor}
        onClose={() => setState(prev => ({ ...prev, showImageEditor: false }))}
        editorState={state}
        setEditorState={setState}
        editorRefs={refs}
        onSaveImage={handlers.handleSaveEditedImage}
        resetEditor={handlers.resetEditorState}
        handleToggleCropMode={handlers.handleToggleCropMode}
        handleApplyCrop={handlers.handleApplyCrop}
      />
    </div>
  );
};

export default CourseImageUploader;
