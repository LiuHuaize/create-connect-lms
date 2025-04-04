
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, MessageSquare } from 'lucide-react';

const CommunityCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl p-8 text-center shadow-sm border border-blue-100">
      <div className="flex justify-center space-x-6 mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-white/60 rounded-full shadow-inner border border-blue-100">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <div className="inline-flex items-center justify-center p-3 bg-white/60 rounded-full shadow-inner border border-blue-100">
          <BookOpen className="h-8 w-8 text-indigo-600" />
        </div>
        <div className="inline-flex items-center justify-center p-3 bg-white/60 rounded-full shadow-inner border border-blue-100">
          <MessageSquare className="h-8 w-8 text-purple-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">想要获取更多学习资源？</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">加入我们的学习社区，与其他学习者交流分享，获取更多学习资源和支持</p>
      <div className="flex justify-center space-x-4">
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 font-medium px-8">
          <a href="/community">查看社区</a>
        </Button>
        <Button asChild size="lg" variant="outline" className="font-medium px-8 border-blue-200">
          <a href="/events">参加活动</a>
        </Button>
      </div>
    </div>
  );
};

export default CommunityCard;
