
import React from 'react';
import { Discussion } from '@/services/community';
import { cn } from '@/lib/utils';
import { formatDate, getAvatarInitials, getAvatarBgColor } from '../utils/formatUtils';

interface DiscussionDetailsProps {
  discussion: Discussion;
}

export const DiscussionDetails: React.FC<DiscussionDetailsProps> = ({ discussion }) => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-start gap-4">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
          getAvatarBgColor(discussion.user_id)
        )}>
          {getAvatarInitials(discussion.username)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{discussion.username || '未知用户'}</h3>
            <span className="text-gray-500 text-sm">• {formatDate(discussion.created_at)}</span>
            {discussion.tags && discussion.tags.length > 0 && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {discussion.tags[0]}
              </span>
            )}
          </div>
          
          <h4 className="text-lg font-bold mb-2">{discussion.title}</h4>
          <p className="text-gray-600 mb-2 break-words whitespace-pre-line">{discussion.content}</p>
        </div>
      </div>
    </div>
  );
};
