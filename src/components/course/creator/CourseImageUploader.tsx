
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
