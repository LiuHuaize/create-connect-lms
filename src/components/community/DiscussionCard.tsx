
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MessageSquare, ThumbsUp, Share2 } from 'lucide-react';
import { DiscussionWithProfile } from '@/types/community';
import { getInitials, getRandomColorClass, likeDiscussion } from '@/services/communityService';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DiscussionCardProps {
  discussion: DiscussionWithProfile;
  onLike: (discussionId: string) => void;
}

const DiscussionCard: React.FC<DiscussionCardProps> = ({ discussion, onLike }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止点赞时触发导航
    if (!user) {
      navigate('/auth');
      return;
    }
    await onLike(discussion.id);
  };
  
  const navigateToDetail = () => {
    navigate(`/community/discussion/${discussion.id}`);
  };
  
  const colorClass = getRandomColorClass(discussion.user_id);
  const formattedDate = formatDistanceToNow(new Date(discussion.created_at), { 
    addSuffix: true, 
    locale: zhCN 
  });

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={navigateToDetail}
    >
      <div className="flex items-start gap-4">
        <div className={`h-10 w-10 rounded-full ${colorClass} flex items-center justify-center text-sm font-medium flex-shrink-0`}>
          {getInitials(discussion.profile?.username || '')}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{discussion.profile?.username || '未知用户'}</h3>
            <span className="text-gray-500 text-sm">• {formattedDate}</span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {discussion.tags && discussion.tags.length > 0 ? discussion.tags[0] : '讨论'}
            </span>
          </div>
          
          <h4 className="text-lg font-bold mb-2">{discussion.title}</h4>
          <p className="text-gray-600 mb-4 whitespace-pre-line line-clamp-4">{discussion.content}</p>
          
          <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike} 
              className={`flex items-center gap-1 ${discussion.is_liked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600 hover:bg-blue-50 transition-colors`}
            >
              <ThumbsUp size={16} className={discussion.is_liked ? 'fill-blue-600' : ''} />
              <span className="text-sm">{discussion.likes_count}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                navigateToDetail();
              }}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <MessageSquare size={16} />
              <span className="text-sm">{discussion.comments_count}条评论</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Share2 size={16} />
              <span className="text-sm">分享</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionCard;
