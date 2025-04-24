import React from 'react';
import { Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Events = () => {
  return (
    <div className="animate-fade-in p-6 pt-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">活动</h1>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-sm">
            <Filter size={16} className="mr-2" /> 筛选
          </Button>
          <Button variant="default" size="sm" className="text-sm">
            <Calendar size={16} className="mr-2" /> 添加到日历
          </Button>
        </div>
      </div>
      
      {/* Month navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button className="month-nav-btn">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">2024年2月</h2>
          <button className="month-nav-btn">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-ghibli-lightTeal text-ghibli-deepTeal hover:bg-ghibli-teal/20">工作坊</Badge>
          <Badge className="bg-ghibli-skyBlue/30 text-ghibli-deepTeal hover:bg-ghibli-skyBlue/40">网络讲座</Badge>
          <Badge className="bg-ghibli-lavender/30 text-ghibli-deepTeal hover:bg-ghibli-lavender/40">会议</Badge>
        </div>
      </div>
      
      <div className="space-y-6 mb-8">
        {/* Upcoming event */}
        <div className="event-card">
          <div className="flex">
            <div className="event-date-block w-24 flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold">15</span>
              <span className="text-sm">2月</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <span className="event-tag">工作坊</span>
                  <h3 className="text-xl font-bold mb-2">商业模式画布工作坊</h3>
                  <p className="text-gray-600 mb-4">学习如何创建全面的商业模式画布，以可视化您的业务战略。</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">2024年2月15日 • 上午10:00 - 下午12:00</span>
                    </div>
                  </div>
                </div>
                
                <Button className="event-register-btn">报名</Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Second event */}
        <div className="event-card">
          <div className="flex">
            <div className="event-date-block w-24 bg-ghibli-skyBlue flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold">22</span>
              <span className="text-sm">2月</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <span className="event-tag bg-ghibli-skyBlue/30 text-ghibli-deepTeal">网络讲座</span>
                  <h3 className="text-xl font-bold mb-2">游戏设计：从概念到原型</h3>
                  <p className="text-gray-600 mb-4">加入行业专家，学习将游戏创意从概念转变为可玩原型的过程。</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">2024年2月22日 • 下午3:00 - 下午4:30</span>
                    </div>
                  </div>
                </div>
                
                <Button className="event-register-btn">报名</Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Third event */}
        <div className="event-card">
          <div className="flex">
            <div className="event-date-block w-24 bg-ghibli-lavender flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold">28</span>
              <span className="text-sm">2月</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <span className="event-tag bg-ghibli-lavender/30 text-ghibli-deepTeal">会议</span>
                  <h3 className="text-xl font-bold mb-2">2024创业峰会</h3>
                  <p className="text-gray-600 mb-4">一个虚拟会议，汇集成功企业家分享业务增长战略的见解。</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">2024年2月28日 • 上午9:00 - 下午5:00</span>
                    </div>
                  </div>
                </div>
                
                <Button className="event-register-btn">报名</Button>
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
