
import React from 'react';
import { Button } from '@/components/ui/button';
import { Crop, Trash2 } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from 'sonner';

interface ExistingImageProps {
  imageUrl: string;
  onEditImage: () => void;
  onRemoveImage: () => void;
}

const ExistingImage: React.FC<ExistingImageProps> = ({ 
  imageUrl, 
  onEditImage, 
  onRemoveImage 
}) => {
  return (
    <div className="mb-4">
      <div className="relative mb-4 overflow-hidden rounded-md">
        <AspectRatio ratio={16 / 9}>
          <img 
            src={`${imageUrl}?t=${Date.now()}`}
            alt="课程封面" 
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=450&fit=crop';
              toast.error('加载封面图片失败，已显示占位图');
            }}
          />
        </AspectRatio>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEditImage}
        >
          <Crop size={16} className="mr-2" /> 编辑图片
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRemoveImage}
        >
          <Trash2 size={16} className="mr-2" /> 移除图片
        </Button>
      </div>
    </div>
  );
};

export default ExistingImage;
