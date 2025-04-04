
import { Course } from '@/types/course';
import { Rect, Canvas, Image as FabricImage } from 'fabric';

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
  canvasInitialized: boolean;
  showLoader: boolean;
  isSaving: boolean;
  imageSaved: boolean;
  imageLoadError: boolean;
  currentStep: 'upload' | 'edit' | 'crop' | 'preview';
  cropPreviewURL: string | null;
  editorMode: 'crop' | 'move';
}

export interface EditorRefs {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fabricCanvasRef: React.MutableRefObject<Canvas | null>;
  cropRect: Rect | null;
  imageRef: React.MutableRefObject<FabricImage | null>;
  previewCanvasRef: React.RefObject<HTMLCanvasElement>;
  previewImageRef: React.RefObject<HTMLImageElement>;
  loadingTimerRef: React.MutableRefObject<number | null>;
}
