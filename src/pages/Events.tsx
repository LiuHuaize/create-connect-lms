import React from 'react';
import { Calendar, Filter, ChevronLeft, ChevronRight, MapPin, Clock, Users, Star, BookOpen, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Events = () => {
  return (
    <div className="animate-fade-in p-6 pt-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-macaron-darkGray">趣味活动</h1>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-sm bg-macaron-lavender/30 text-macaron-deepLavender border-macaron-lavender hover:bg-macaron-lavender/50 transition-all duration-300">
            <Filter size={16} className="mr-2" /> 筛选
          </Button>
          <Button variant="default" size="sm" className="text-sm bg-macaron-coral text-white hover:bg-macaron-coral/80 transition-all duration-300">
            <Calendar size={16} className="mr-2" /> 添加到日历
          </Button>
        </div>
      </div>
      
      {/* Month navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 bg-macaron-cream hover:bg-macaron-lightGray transition-all duration-300">
            <ChevronLeft size={20} className="text-macaron-darkGray" />
          </button>
          <h2 className="text-lg font-semibold text-macaron-darkGray px-3 py-1 bg-macaron-cream rounded-full">2024年2月</h2>
          <button className="rounded-full p-2 bg-macaron-cream hover:bg-macaron-lightGray transition-all duration-300">
            <ChevronRight size={20} className="text-macaron-darkGray" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-macaron-mint text-macaron-deepMint hover:bg-macaron-mint/70 transition-all">工作坊</Badge>
          <Badge className="bg-macaron-blue text-macaron-darkGray hover:bg-macaron-blue/70 transition-all">网络讲座</Badge>
          <Badge className="bg-macaron-lavender text-macaron-deepLavender hover:bg-macaron-lavender/70 transition-all">会议</Badge>
        </div>
      </div>
      
      <div className="space-y-8 mb-8">
        {/* Upcoming event */}
        <div className="hover-card glow-card bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row">
            <div className="bg-macaron-mint sm:w-24 flex flex-col items-center justify-center p-4 sm:p-6 text-macaron-deepMint">
              <span className="text-4xl font-bold">15</span>
              <span className="text-sm font-semibold">2月</span>
              <div className="hidden sm:flex mt-4 w-12 h-12 rounded-full bg-white/30 items-center justify-center">
                <BookOpen size={24} className="text-macaron-deepMint" />
              </div>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-macaron-mint text-macaron-deepMint">工作坊</Badge>
                    <Badge variant="outline" className="bg-white border-macaron-mint/30 text-macaron-gray">
                      <Star size={12} className="mr-1 text-yellow-400" />
                      推荐
                    </Badge>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-macaron-darkGray">商业模式画布工作坊</h3>
                  <p className="text-macaron-gray mb-4">学习如何创建全面的商业模式画布，以可视化您的业务战略。</p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-macaron-gray">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-macaron-deepMint" />
                      <span className="text-sm">2024年2月15日 • 上午10:00 - 下午12:00</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={16} className="mr-2 text-macaron-coral" />
                      <span className="text-sm">已有 24 人报名</span>
                    </div>
                  </div>
                </div>
                
                <Button className="mt-4 sm:mt-0 bg-macaron-mint text-macaron-deepMint hover:bg-macaron-deepMint hover:text-white transition-all duration-300 btn-hover-effect">
                  报名参加
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Second event */}
        <div className="hover-card glow-card bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row">
            <div className="bg-macaron-blue sm:w-24 flex flex-col items-center justify-center p-4 sm:p-6 text-macaron-darkGray">
              <span className="text-4xl font-bold">22</span>
              <span className="text-sm font-semibold">2月</span>
              <div className="hidden sm:flex mt-4 w-12 h-12 rounded-full bg-white/30 items-center justify-center">
                <Trophy size={24} className="text-macaron-darkGray" />
              </div>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-macaron-blue text-macaron-darkGray">网络讲座</Badge>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-macaron-darkGray">游戏设计：从概念到原型</h3>
                  <p className="text-macaron-gray mb-4">加入行业专家，学习将游戏创意从概念转变为可玩原型的过程。</p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-macaron-gray">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-macaron-darkGray" />
                      <span className="text-sm">2024年2月22日 • 下午3:00 - 下午4:30</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={16} className="mr-2 text-macaron-coral" />
                      <span className="text-sm">已有 16 人报名</span>
                    </div>
                  </div>
                </div>
                
                <Button className="mt-4 sm:mt-0 bg-macaron-blue text-macaron-darkGray hover:bg-macaron-darkGray hover:text-white transition-all duration-300 btn-hover-effect">
                  报名参加
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Third event */}
        <div className="hover-card glow-card bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row">
            <div className="bg-macaron-lavender sm:w-24 flex flex-col items-center justify-center p-4 sm:p-6 text-macaron-deepLavender">
              <span className="text-4xl font-bold">28</span>
              <span className="text-sm font-semibold">2月</span>
              <div className="hidden sm:flex mt-4 w-12 h-12 rounded-full bg-white/30 items-center justify-center">
                <Users size={24} className="text-macaron-deepLavender" />
              </div>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-macaron-lavender text-macaron-deepLavender">会议</Badge>
                    <Badge variant="outline" className="bg-white border-macaron-lavender/30 text-macaron-gray">
                      <Star size={12} className="mr-1 text-yellow-400" />
                      推荐
                    </Badge>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-macaron-darkGray">2024创业峰会</h3>
                  <p className="text-macaron-gray mb-4">一个虚拟会议，汇集成功企业家分享业务增长战略的见解。</p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-macaron-gray">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-macaron-deepLavender" />
                      <span className="text-sm">2024年2月28日 • 上午9:00 - 下午5:00</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={16} className="mr-2 text-macaron-coral" />
                      <span className="text-sm">已有 32 人报名</span>
                    </div>
                  </div>
                </div>
                
                <Button className="mt-4 sm:mt-0 bg-macaron-lavender text-macaron-deepLavender hover:bg-macaron-deepLavender hover:text-white transition-all duration-300 btn-hover-effect">
                  报名参加
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <Button variant="outline" className="text-sm bg-macaron-pink/10 text-macaron-deepPink border-macaron-pink/30 hover:bg-macaron-pink/20 transition-all duration-300">
          加载更多活动
        </Button>
      </div>
    </div>
  );
};

export default Events;
