import React from 'react';
import { Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Events = () => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">活动</h1>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-sm">
            <Filter size={16} className="mr-2" /> 筛选
          </Button>
          <Button variant="default" size="sm" className="bg-connect-blue hover:bg-blue-600 text-sm">
            <Calendar size={16} className="mr-2" /> 添加到日历
          </Button>
        </div>
      </div>
      
      {/* Month navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button className="p-1 rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">2024年2月</h2>
          <button className="p-1 rounded-full hover:bg-gray-100">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">工作坊</Badge>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">网络讲座</Badge>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">会议</Badge>
        </div>
      </div>
      
      <div className="space-y-6 mb-8">
        {/* Upcoming event */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover-scale">
          <div className="flex">
            <div className="w-24 bg-connect-blue text-white flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold">15</span>
              <span className="text-sm">2月</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-green-100 text-green-700 mb-2">工作坊</Badge>
                  <h3 className="text-xl font-bold mb-2">商业模式画布工作坊</h3>
                  <p className="text-gray-600 mb-4">学习如何创建全面的商业模式画布，以可视化您的业务战略。</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">2024年2月15日 • 上午10:00 - 下午12:00</span>
                    </div>
                  </div>
                </div>
                
                <Button className="bg-connect-blue hover:bg-blue-600">报名</Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Second event */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover-scale">
          <div className="flex">
            <div className="w-24 bg-connect-purple text-white flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold">22</span>
              <span className="text-sm">2月</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-blue-100 text-blue-700 mb-2">网络讲座</Badge>
                  <h3 className="text-xl font-bold mb-2">游戏设计：从概念到原型</h3>
                  <p className="text-gray-600 mb-4">加入行业专家，学习将游戏创意从概念转变为可玩原型的过程。</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">2024年2月22日 • 下午3:00 - 下午4:30</span>
                    </div>
                  </div>
                </div>
                
                <Button className="bg-connect-blue hover:bg-blue-600">报名</Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Third event */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover-scale">
          <div className="flex">
            <div className="w-24 bg-gray-900 text-white flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold">28</span>
              <span className="text-sm">2月</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-purple-100 text-purple-700 mb-2">会议</Badge>
                  <h3 className="text-xl font-bold mb-2">2024创业峰会</h3>
                  <p className="text-gray-600 mb-4">一个虚拟会议，汇集成功企业家分享业务增长战略的见解。</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">2024年2月28日 • 上午9:00 - 下午5:00</span>
                    </div>
                  </div>
                </div>
                
                <Button className="bg-connect-blue hover:bg-blue-600">报名</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <Button variant="outline" className="text-sm">
          加载更多活动
        </Button>
      </div>
    </div>
  );
};

export default Events;
