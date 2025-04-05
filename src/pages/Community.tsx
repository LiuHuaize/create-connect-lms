
import React, { useState, useEffect } from 'react';
import { communityService, Discussion } from '@/services/community';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import NewDiscussionDialog from '@/components/community/NewDiscussionDialog';
import SearchBar from '@/components/community/SearchBar';
import CommunityTabs from '@/components/community/CommunityTabs';

const Community = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'popular' | 'following'>('trending');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const discussionsData = await communityService.getDiscussions(activeTab);
      setDiscussions(discussionsData);
    } catch (error) {
      console.error('加载社区数据失败:', error);
      toast({
        title: "加载失败",
        description: "获取社区数据时出错，请稍后再试。",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和标签切换时重新加载
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 处理点赞更新 - 不立即刷新，延迟2秒后再更新列表
  const handleLike = () => {
    // We don't need to immediately refresh, let the local state update first
    // This avoids the jarring experience of the page refreshing on every like
    // After 2 seconds we'll refresh in the background
    setTimeout(() => {
      loadData();
    }, 2000);
  };

  // 处理发布新讨论
  const handleNewDiscussion = () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "您需要登录才能发布讨论。",
        variant: "destructive"
      });
      return;
    }
    setIsDialogOpen(true);
  };

  // 搜索框过滤
  const filteredDiscussions = searchQuery
    ? discussions.filter(d => 
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : discussions;

  return (
    <div className="animate-fade-in p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">社区</h1>
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewDiscussion={handleNewDiscussion}
        />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <CommunityTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          discussions={filteredDiscussions}
          loading={loading}
          searchQuery={searchQuery}
          onLike={handleLike}
          onNewDiscussion={handleNewDiscussion}
        />
      </div>
      
      <NewDiscussionDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onDiscussionCreated={loadData}
      />
    </div>
  );
};

export default Community;
