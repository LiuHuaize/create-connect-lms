import React from 'react';
import { toast } from 'sonner';
import { Course } from '@/types/course';
import { AspectRatio } from '@/components/ui/aspect-ratio';
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
  // 使用图片编辑器功能的自定义钩子
  const { 
    state, 
    setState,
    handlers
  } = useImageEditor({ course, setCourse, setCoverImageURL });

  // 处理编辑现有图片
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4">课程封面</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {(coverImageURL || course.cover_image) ? (
          <ExistingImage 
            imageUrl={coverImageURL || course.cover_image!}
            onEditImage={handleEditExistingImage}
            onRemoveImage={() => {
              setCoverImageURL(null);
              setCourse(prev => ({ ...prev, cover_image: null }));
              toast.success('已移除封面图片');
            }}
          />
        ) : (
          <UploadPlaceholder 
            isUploading={state.isUploading}
            onImageUpload={handlers.handleCoverImageUpload}
          />
        )}
      </div>
      
      <ImageEditor 
        isOpen={state.showImageEditor}
        onClose={() => setState(prev => ({ ...prev, showImageEditor: false }))}
        editingImage={state.editingImage}
        onSaveImage={handlers.handleSaveEditedImage}
        aspect={16 / 9}
      />
    </div>
  );
};

export default CourseImageUploader;
