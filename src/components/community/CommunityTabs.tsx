
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Discussion } from '@/services/communityService';
import { useAuth } from '@/contexts/AuthContext';
import DiscussionList from './DiscussionList';

interface CommunityTabsProps {
  activeTab: 'trending' | 'latest' | 'popular' | 'following';
  setActiveTab: (tab: 'trending' | 'latest' | 'popular' | 'following') => void;
  discussions: Discussion[];
  loading: boolean;
  searchQuery: string;
  onLike: () => void;
  onNewDiscussion: () => void;
}

const CommunityTabs: React.FC<CommunityTabsProps> = ({
  activeTab,
  setActiveTab,
  discussions,
  loading,
  searchQuery,
  onLike,
  onNewDiscussion
}) => {
  const { user } = useAuth();

  return (
    <Tabs 
      defaultValue="trending" 
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as any)}
      className="w-full"
    >
      <TabsList className="mb-6">
        <TabsTrigger value="trending">热门</TabsTrigger>
        <TabsTrigger value="latest">最新</TabsTrigger>
        <TabsTrigger value="popular">最受欢迎</TabsTrigger>
        <TabsTrigger value="following">关注中</TabsTrigger>
      </TabsList>
      
      <TabsContent value="trending" className="space-y-6">
        <DiscussionList 
          discussions={discussions}
          loading={loading}
          searchQuery={searchQuery}
          onLike={onLike}
          onNewDiscussion={onNewDiscussion}
        />
      </TabsContent>
      
      <TabsContent value="latest" className="space-y-6">
        <DiscussionList 
          discussions={discussions}
          loading={loading}
          searchQuery={searchQuery}
          onLike={onLike}
          onNewDiscussion={onNewDiscussion}
        />
      </TabsContent>
      
      <TabsContent value="popular" className="space-y-6">
        <DiscussionList 
          discussions={discussions}
          loading={loading}
          searchQuery={searchQuery}
          onLike={onLike}
          onNewDiscussion={onNewDiscussion}
        />
      </TabsContent>
      
      <TabsContent value="following" className="space-y-6">
        {!user ? (
          <div className="text-center py-12">
            <p className="text-gray-500">请登录后查看您关注的讨论</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">正在加载您关注的讨论...</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">关注功能即将上线</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default CommunityTabs;
