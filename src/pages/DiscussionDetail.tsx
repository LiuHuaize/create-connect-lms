
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  fetchDiscussions, createComment, 
  fetchComments, likeDiscussion, 
  checkDiscussionLiked, getInitials, 
  getRandomColorClass 
} from '@/services/communityService';
import { DiscussionWithProfile, CommentWithProfile } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const DiscussionDetail = () => {
  const { discussionId } = useParams<{ discussionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 获取讨论详情
  const { 
    data: discussionsData, 
    isLoading: isLoadingDiscussion,
    refetch: refetchDiscussion,
  } = useQuery({
    queryKey: ['discussion', discussionId],
    queryFn: () => fetchDiscussions(),
    refetchOnWindowFocus: false,
  });
  
  // 过滤出当前讨论
  const discussion: DiscussionWithProfile | undefined = discussionsData?.find(
    (d: DiscussionWithProfile) => d.id === discussionId
  );
  
  // 检查是否已点赞
  const [isLiked, setIsLiked] = useState(false);
  
  useEffect(() => {
    const checkLike = async () => {
      if (discussionId && user) {
        const liked = await checkDiscussionLiked(discussionId);
        setIsLiked(liked);
      }
    };
    
    checkLike();
  }, [discussionId, user]);
  
  // 获取评论列表
  const { 
    data: comments, 
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['comments', discussionId],
    queryFn: () => fetchComments(discussionId || ''),
    enabled: !!discussionId,
    refetchOnWindowFocus: false,
  });
  
  // 处理点赞
  const handleLike = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "点赞前需要登录账号",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    if (discussionId) {
      await likeDiscussion(discussionId);
      setIsLiked(!isLiked);
      refetchDiscussion();
    }
  };
  
  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "请先登录",
        description: "发表评论前需要登录账号",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    if (!comment.trim()) {
      toast({
        title: "评论内容不能为空",
        variant: "destructive"
      });
      return;
    }
    
    if (discussionId) {
      setIsSubmitting(true);
      try {
        await createComment(discussionId, comment);
        setComment('');
        refetchComments();
        refetchDiscussion();
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  if (!discussionId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">讨论不存在</p>
        <Button variant="outline" onClick={() => navigate('/community')} className="mt-4">
          返回社区
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate('/community')} 
        className="mb-4 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} className="mr-1" /> 返回社区
      </Button>
      
      {isLoadingDiscussion ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : discussion ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className={`h-12 w-12 rounded-full ${getRandomColorClass(discussion.user_id)} flex items-center justify-center text-sm font-medium flex-shrink-0`}>
              {getInitials(discussion.profile?.username || '')}
            </div>
            
            <div>
              <h3 className="font-semibold">{discussion.profile?.username || '未知用户'}</h3>
              <p className="text-gray-500 text-sm">
                {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true, locale: zhCN })}
              </p>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">{discussion.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {discussion.tags && discussion.tags.map((tag, index) => (
              <span 
                key={index} 
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="text-gray-700 mb-6 whitespace-pre-line">{discussion.content}</div>
          
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike} 
              className={`flex items-center gap-1 ${isLiked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600 hover:bg-blue-50 transition-colors`}
            >
              <ThumbsUp size={16} className={isLiked ? 'fill-blue-600' : ''} />
              <span className="text-sm">{discussion.likes_count}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
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
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">讨论不存在或已被删除</p>
          <Button variant="outline" onClick={() => navigate('/community')} className="mt-4">
            返回社区
          </Button>
        </div>
      )}
      
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4">评论 ({discussion?.comments_count || 0})</h2>
        
        <form onSubmit={handleSubmitComment} className="mb-6">
          <Textarea
            placeholder="写下你的评论..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] mb-3"
          />
          <Button 
            type="submit" 
            className="bg-connect-blue hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? '发布中...' : '发表评论'}
          </Button>
        </form>
        
        <Separator className="my-6" />
        
        {isLoadingComments ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment: CommentWithProfile) => (
              <div key={comment.id} className="flex gap-4">
                <div className={`h-10 w-10 rounded-full ${getRandomColorClass(comment.user_id)} flex items-center justify-center text-sm font-medium flex-shrink-0`}>
                  {getInitials(comment.profile?.username || '')}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{comment.profile?.username || '未知用户'}</h3>
                    <span className="text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: zhCN })}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>
                  
                  <div className="mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 text-gray-500 hover:text-blue-600 text-xs"
                    >
                      <ThumbsUp size={14} />
                      <span>{comment.likes_count}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">暂无评论，成为第一个评论的人吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionDetail;
