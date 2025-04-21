import { Course } from '@/types/course';
import { Crop, PixelCrop } from 'react-image-crop';

export interface CourseImageUploaderProps {
  course: Course;
  setCourse: React.Dispatch<React.SetStateAction<Course>>;
  coverImageURL: string | null;
  setCoverImageURL: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface ImageEditorState {
  isUploading: boolean;
  showImageEditor: boolean;
  editingImage: string | null;
  isSaving: boolean;
  imageSaved: boolean;
  currentStep: 'upload' | 'edit' | 'crop' | 'preview';
  cropPreviewURL: string | null;
}

export interface CropperRefs {
  imgRef: React.RefObject<HTMLImageElement>;
  previewCanvasRef: React.RefObject<HTMLCanvasElement>;
}

export interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editingImage: string | null;
  onSaveImage: (blob: Blob) => Promise<void>;
  aspect?: number;
}
