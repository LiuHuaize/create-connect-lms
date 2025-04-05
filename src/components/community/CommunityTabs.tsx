
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Discussion } from '@/services/community/types';
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
      <div className="border-b border-gray-100">
        <TabsList className="h-14 bg-transparent justify-start px-6">
          <TabsTrigger value="trending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-medium">热门</TabsTrigger>
          <TabsTrigger value="latest" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-medium">最新</TabsTrigger>
          <TabsTrigger value="popular" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-medium">最受欢迎</TabsTrigger>
          <TabsTrigger value="following" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:font-medium">关注中</TabsTrigger>
        </TabsList>
      </div>
      
      <div className="p-6">
        <TabsContent value="trending" className="mt-0">
          <DiscussionList 
            discussions={discussions}
            loading={loading}
            searchQuery={searchQuery}
            onLike={onLike}
            onNewDiscussion={onNewDiscussion}
          />
        </TabsContent>
        
        <TabsContent value="latest" className="mt-0">
          <DiscussionList 
            discussions={discussions}
            loading={loading}
            searchQuery={searchQuery}
            onLike={onLike}
            onNewDiscussion={onNewDiscussion}
          />
        </TabsContent>
        
        <TabsContent value="popular" className="mt-0">
          <DiscussionList 
            discussions={discussions}
            loading={loading}
            searchQuery={searchQuery}
            onLike={onLike}
            onNewDiscussion={onNewDiscussion}
          />
        </TabsContent>
        
        <TabsContent value="following" className="mt-0">
          {!user ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">请登录后查看您关注的讨论</p>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">正在加载您关注的讨论...</p>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">关注功能即将上线</p>
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default CommunityTabs;
