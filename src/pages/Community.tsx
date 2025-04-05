
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Users } from 'lucide-react';
import { 
  fetchDiscussions, fetchTopics, 
  likeDiscussion, checkDiscussionLiked 
} from '@/services/communityService';
import { Discussion, DiscussionWithProfile, Topic } from '@/types/community';
import DiscussionCard from '@/components/community/DiscussionCard';
import NewDiscussionDialog from '@/components/community/NewDiscussionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const Community = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'popular' | 'following'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  
  // 获取讨论列表
  const { 
    data: discussions, 
    isLoading: isLoadingDiscussions, 
    refetch: refetchDiscussions 
  } = useQuery({
    queryKey: ['discussions', activeTab],
    queryFn: () => fetchDiscussions(activeTab),
    refetchOnWindowFocus: false,
  });
  
  // 获取话题列表
  const {
    data: topics,
    isLoading: isLoadingTopics
  } = useQuery({
    queryKey: ['topics'],
    queryFn: fetchTopics,
    refetchOnWindowFocus: false,
  });
  
  // 处理点赞
  const handleLike = async (discussionId: string) => {
    if (!user) return;
    await likeDiscussion(discussionId);
    refetchDiscussions();
  };
  
  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 实现搜索功能 - 后续添加
    console.log('Searching for:', searchQuery);
  };
  
  // 检查讨论是否已点赞
  useEffect(() => {
    const checkLikes = async () => {
      if (!discussions || !user) return;
      
      const discussionsWithLikes = await Promise.all(
        discussions.map(async (discussion: Discussion) => {
          const isLiked = await checkDiscussionLiked(discussion.id);
          return { ...discussion, is_liked: isLiked };
        })
      );
      
      // 这里我们不重新设置state，因为会触发无限循环
      // 实际项目中应该使用React Query的状态管理或其他状态管理工具
    };
    
    checkLikes();
  }, [discussions, user]);
  
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">社区</h1>
        
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="搜索讨论..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue transition-all w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <NewDiscussionDialog onDiscussionCreated={refetchDiscussions} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Tabs defaultValue="trending" className="w-full" onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="trending">热门</TabsTrigger>
              <TabsTrigger value="latest">最新</TabsTrigger>
              <TabsTrigger value="popular">最受欢迎</TabsTrigger>
              <TabsTrigger value="following">关注中</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trending" className="space-y-6">
              {isLoadingDiscussions ? (
                // 加载骨架屏
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-20 w-full" />
                        <div className="flex gap-4">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : discussions && discussions.length > 0 ? (
                discussions.map((discussion: DiscussionWithProfile) => (
                  <DiscussionCard 
                    key={discussion.id} 
                    discussion={discussion} 
                    onLike={handleLike} 
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">还没有讨论，来发布第一个吧！</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="latest" className="space-y-6">
              {isLoadingDiscussions ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">正在加载最新讨论...</p>
                </div>
              ) : discussions && discussions.length > 0 ? (
                discussions.map((discussion: DiscussionWithProfile) => (
                  <DiscussionCard 
                    key={discussion.id} 
                    discussion={discussion} 
                    onLike={handleLike} 
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">还没有讨论，来发布第一个吧！</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="popular" className="space-y-6">
              {isLoadingDiscussions ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">正在加载热门讨论...</p>
                </div>
              ) : discussions && discussions.length > 0 ? (
                discussions.map((discussion: DiscussionWithProfile) => (
                  <DiscussionCard 
                    key={discussion.id} 
                    discussion={discussion} 
                    onLike={handleLike} 
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">还没有讨论，来发布第一个吧！</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="following" className="space-y-6">
              <div className="text-center py-12">
                <p className="text-gray-500">关注功能即将上线，敬请期待！</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <h3 className="font-bold mb-4">热门话题</h3>
            <div className="space-y-3">
              {isLoadingTopics ? (
                // 加载骨架屏
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-10" />
                ))
              ) : topics && topics.length > 0 ? (
                topics.map((topic: Topic) => (
                  <button 
                    key={topic.id} 
                    className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
                  >
                    {topic.name} {topic.posts_count > 0 && <span className="text-xs text-gray-500">({topic.posts_count})</span>}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">暂无热门话题</p>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <h3 className="font-bold mb-4">活跃成员</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">
                  TK
                </div>
                <div>
                  <p className="font-medium text-sm">汤姆·凯勒</p>
                  <p className="text-xs text-gray-500">游戏设计师</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-medium">
                  JD
                </div>
                <div>
                  <p className="font-medium text-sm">简·多伊</p>
                  <p className="text-xs text-gray-500">创业者</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-medium">
                  MS
                </div>
                <div>
                  <p className="font-medium text-sm">迈克·史密斯</p>
                  <p className="text-xs text-gray-500">产品经理</p>
                </div>
              </div>
            </div>
            
            <button className="w-full text-center mt-4 text-connect-blue text-sm hover:underline">
              查看所有成员
            </button>
          </div>
          
          <div className="bg-connect-cream rounded-xl p-5 shadow-sm">
            <h3 className="font-bold mb-2">加入我们的每周讨论</h3>
            <p className="text-sm text-gray-700 mb-4">每周四与专家和同行在实时讨论中交流。</p>
            <Button className="w-full bg-black hover:bg-gray-800 text-white">
              立即注册
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
