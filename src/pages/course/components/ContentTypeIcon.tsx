import React from 'react';
import { Video, HelpCircle, Play, FileText, BookOpen, MapPin, Target } from 'lucide-react';

interface ContentTypeIconProps {
  type: string;
  size?: number;
}

const ContentTypeIcon: React.FC<ContentTypeIconProps> = ({ type, size = 18 }) => {
  switch (type) {
    case 'video':
      return <Video size={size} className="mr-2 text-ghibli-skyBlue" />;
    case 'quiz':
      return <HelpCircle size={size} className="mr-2 text-ghibli-sunshine" />;
    case 'interactive':
      return <Play size={size} className="mr-2 text-ghibli-grassGreen" />;
    case 'game':
      return <Play size={size} className="mr-2 text-ghibli-coral" />;
    case 'activity':
      return <FileText size={size} className="mr-2 text-ghibli-lavender" />;
    case 'text':
      return <BookOpen size={size} className="mr-2 text-ghibli-teal" />;
    case 'hotspot':
      return <Target size={size} className="mr-2 text-ghibli-coral" />;
    default:
      return <BookOpen size={size} className="mr-2 text-ghibli-brown" />;
  }
};

export default ContentTypeIcon;
