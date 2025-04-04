
import React from 'react';
import { Video, HelpCircle, Play, FileText, BookOpen } from 'lucide-react';

interface ContentTypeIconProps {
  type: string;
}

const ContentTypeIcon: React.FC<ContentTypeIconProps> = ({ type }) => {
  switch (type) {
    case 'video':
      return <Video size={18} className="mr-2 text-blue-500" />;
    case 'quiz':
      return <HelpCircle size={18} className="mr-2 text-purple-500" />;
    case 'interactive':
      return <Play size={18} className="mr-2 text-green-500" />;
    case 'game':
      return <Play size={18} className="mr-2 text-orange-500" />;
    case 'activity':
      return <FileText size={18} className="mr-2 text-indigo-500" />;
    case 'text':
      return <BookOpen size={18} className="mr-2 text-gray-500" />;
    default:
      return <BookOpen size={18} className="mr-2 text-gray-500" />;
  }
};

export default ContentTypeIcon;
