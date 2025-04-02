
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Course } from '@/types/course';

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

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
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
      
      toast.success('封面图片上传成功');
    } catch (error) {
      console.error('上传图片失败:', error);
      toast.error('上传图片失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4">课程封面</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {(coverImageURL || course.cover_image) ? (
          <div className="mb-4">
            <div className="relative aspect-video mb-4 overflow-hidden rounded-md">
              <img 
                src={coverImageURL || course.cover_image} 
                alt="课程封面" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
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
    </div>
  );
};

export default CourseImageUploader;
