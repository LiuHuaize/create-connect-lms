
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Clock } from 'lucide-react';

interface UploadPlaceholderProps {
  isUploading: boolean;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadPlaceholder: React.FC<UploadPlaceholderProps> = ({ 
  isUploading, 
  onImageUpload 
}) => {
  return (
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
            onChange={onImageUpload}
            disabled={isUploading}
          />
        </Button>
      </label>
    </>
  );
};

export default UploadPlaceholder;
