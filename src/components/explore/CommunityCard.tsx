
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommunityCard: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl p-10 text-center shadow-sm border border-blue-100">
      <div className="flex justify-center gap-8 mb-8">
        <div className="inline-flex items-center justify-center p-4 bg-white/70 rounded-full shadow-md border border-blue-100">
          <Users className="h-9 w-9 text-blue-600" />
        </div>
        <div className="inline-flex items-center justify-center p-4 bg-white/70 rounded-full shadow-md border border-blue-100">
          <BookOpen className="h-9 w-9 text-indigo-600" />
        </div>
        <div className="inline-flex items-center justify-center p-4 bg-white/70 rounded-full shadow-md border border-blue-100">
          <MessageSquare className="h-9 w-9 text-purple-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">想要获取更多学习资源？</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">加入我们的学习社区，与其他学习者交流分享，获取更多学习资源和支持</p>
      <div className="flex justify-center gap-4">
        <Button 
          onClick={() => navigate('/community')} 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 font-medium px-8 py-6 h-auto"
        >
          查看社区
        </Button>
        <Button 
          onClick={() => navigate('/events')} 
          size="lg" 
          variant="outline" 
          className="font-medium px-8 py-6 h-auto border-blue-200 hover:bg-blue-50"
        >
          参加活动
        </Button>
      </div>
    </div>
  );
};

export default CommunityCard;
