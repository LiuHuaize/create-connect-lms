import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Heart, BarChart, Users, ThumbsUp, Share2 } from 'lucide-react';

const Community = () => {
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
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue transition-all w-64"
            />
          </div>
          <Button className="bg-connect-blue hover:bg-blue-600">
            <MessageSquare size={16} className="mr-2" /> 新讨论
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Tabs defaultValue="trending" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="trending">热门</TabsTrigger>
              <TabsTrigger value="latest">最新</TabsTrigger>
              <TabsTrigger value="popular">最受欢迎</TabsTrigger>
              <TabsTrigger value="following">关注中</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trending" className="space-y-6">
              {/* Discussion post */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover-scale shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-medium flex-shrink-0">
                    JD
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">简·多伊</h3>
                      <span className="text-gray-500 text-sm">• 2小时前</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">创业者</span>
                    </div>
                    
                    <h4 className="text-lg font-bold mb-2">验证商业创意的最佳方法？</h4>
                    <p className="text-gray-600 mb-4">我正在为桌游爱好者开发一项订阅盒服务的商业计划。在启动前，您发现哪些方法最有效地验证需求？</p>
                    
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <ThumbsUp size={16} />
                        <span className="text-sm">24</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <MessageSquare size={16} />
                        <span className="text-sm">12条评论</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <Share2 size={16} />
                        <span className="text-sm">分享</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Second discussion */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover-scale shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium flex-shrink-0">
                    TK
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">汤姆·凯勒</h3>
                      <span className="text-gray-500 text-sm">• 1天前</span>
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">游戏设计师</span>
                    </div>
                    
                    <h4 className="text-lg font-bold mb-2">卡牌游戏平衡技巧？</h4>
                    <p className="text-gray-600 mb-4">我正在设计一款策略卡牌游戏，但在平衡不同卡牌能力方面遇到困难。您使用哪些技术或工具来确保游戏公平性的同时保持趣味性？</p>
                    
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <ThumbsUp size={16} />
                        <span className="text-sm">56</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <MessageSquare size={16} />
                        <span className="text-sm">35条评论</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <Share2 size={16} />
                        <span className="text-sm">分享</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Third discussion */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover-scale shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-medium flex-shrink-0">
                    MS
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">迈克·史密斯</h3>
                      <span className="text-gray-500 text-sm">• 3天前</span>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">产品经理</span>
                    </div>
                    
                    <h4 className="text-lg font-bold mb-2">产品开发路线图应该有多详细？</h4>
                    <p className="text-gray-600 mb-4">我正在为一个实体产品创建路线图。开发步骤应该多细致，您通常包含哪些关键里程碑？</p>
                    
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <ThumbsUp size={16} />
                        <span className="text-sm">32</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <MessageSquare size={16} />
                        <span className="text-sm">18条评论</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <Share2 size={16} />
                        <span className="text-sm">分享</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="latest">
              <div className="text-center py-12">
                <p className="text-gray-500">正在加载最新讨论...</p>
              </div>
            </TabsContent>
            
            <TabsContent value="popular">
              <div className="text-center py-12">
                <p className="text-gray-500">正在加载热门讨论...</p>
              </div>
            </TabsContent>
            
            <TabsContent value="following">
              <div className="text-center py-12">
                <p className="text-gray-500">正在加载您关注的人的讨论...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <h3 className="font-bold mb-4">热门话题</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                商业规划
              </button>
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                游戏设计
              </button>
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                产品开发
              </button>
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                市场研究
              </button>
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                原型制作
              </button>
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
