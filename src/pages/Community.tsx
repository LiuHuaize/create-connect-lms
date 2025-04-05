
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Plus, Users } from 'lucide-react';
import { communityService, Discussion, Topic } from '@/services/communityService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import NewDiscussionDialog from '@/components/community/NewDiscussionDialog';
import DiscussionItem from '@/components/community/DiscussionItem';

const Community = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'popular' | 'following'>('trending');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
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
      
      const topicsData = await communityService.getTopics();
      setTopics(topicsData);
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
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">社区</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="搜索讨论..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue transition-all w-64"
            />
          </div>
          <Button 
            className="bg-connect-blue hover:bg-blue-600"
            onClick={handleNewDiscussion}
          >
            <Plus size={16} className="mr-2" /> 新讨论
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
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
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">正在加载讨论...</p>
                </div>
              ) : filteredDiscussions.length > 0 ? (
                filteredDiscussions.map(discussion => (
                  <DiscussionItem 
                    key={discussion.id} 
                    discussion={discussion} 
                    onLike={loadData}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchQuery ? '没有找到匹配的讨论' : '暂无讨论'}
                  </p>
                  <Button 
                    onClick={handleNewDiscussion} 
                    variant="outline" 
                    className="mt-4"
                  >
                    发起第一个讨论
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="latest" className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">正在加载最新讨论...</p>
                </div>
              ) : filteredDiscussions.length > 0 ? (
                filteredDiscussions.map(discussion => (
                  <DiscussionItem 
                    key={discussion.id} 
                    discussion={discussion} 
                    onLike={loadData}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchQuery ? '没有找到匹配的讨论' : '暂无最新讨论'}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="popular" className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">正在加载热门讨论...</p>
                </div>
              ) : filteredDiscussions.length > 0 ? (
                filteredDiscussions.map(discussion => (
                  <DiscussionItem 
                    key={discussion.id} 
                    discussion={discussion} 
                    onLike={loadData}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchQuery ? '没有找到匹配的讨论' : '暂无热门讨论'}
                  </p>
                </div>
              )}
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
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <h3 className="font-bold mb-4">热门话题</h3>
            <div className="space-y-3">
              {topics.map(topic => (
                <button 
                  key={topic.id}
                  className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
                >
                  {topic.name}
                </button>
              ))}
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
      
      <NewDiscussionDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onDiscussionCreated={loadData}
      />
    </div>
  );
};

export default Community;
