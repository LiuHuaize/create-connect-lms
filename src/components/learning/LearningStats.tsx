import React from 'react';
import { Clock, Award, BookOpen, CheckCircle } from 'lucide-react';

interface LearningStatsProps {
  totalTimeSpent?: number; // 学习总时长，单位:分钟
  coursesInProgress?: number; // 在学课程数
  coursesCompleted?: number; // 完成课程数
  streakDays?: number; // 连续学习天数
}

/**
 * 学习数据统计和成就展示组件
 * 显示在"我的学习"页面底部，填充空白区域
 */
const LearningStats: React.FC<LearningStatsProps> = ({
  totalTimeSpent = 120,
  coursesInProgress = 1,
  coursesCompleted = 0,
  streakDays = 3
}) => {
  // 将分钟数转换为小时和分钟
  const hours = Math.floor(totalTimeSpent / 60);
  const minutes = totalTimeSpent % 60;
  
  // 根据学习时长计算等级
  let level = 1;
  if (totalTimeSpent > 600) level = 5;
  else if (totalTimeSpent > 300) level = 4;
  else if (totalTimeSpent > 180) level = 3;
  else if (totalTimeSpent > 60) level = 2;
  
  return (
    <div className="mt-12 space-y-8">
      {/* 学习统计卡片 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-indigo-100">
        <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
          <Award className="mr-2 h-5 w-5 text-indigo-500" />
          学习概览
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center text-indigo-600 mb-2">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">学习时长</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {hours > 0 ? `${hours}小时` : ''} {minutes}分钟
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center text-purple-600 mb-2">
              <BookOpen className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">在学课程</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{coursesInProgress}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center text-green-600 mb-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">已完成</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{coursesCompleted}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center text-orange-600 mb-2">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
              </svg>
              <span className="text-sm font-medium">连续学习</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{streakDays}天</p>
          </div>
        </div>
      </div>
      
      {/* 成就徽章区域 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Award className="mr-2 h-5 w-5 text-yellow-500" />
          我的成就
        </h3>
        
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {/* 等级徽章 */}
          <div className="relative w-20 h-20 flex flex-col items-center">
            <div className="absolute w-full h-full bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full opacity-15 animate-pulse"></div>
            <div className="z-10 w-16 h-16 bg-gradient-to-b from-blue-500 to-indigo-700 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xl font-bold">{level}</span>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">学习等级</span>
          </div>
          
          {/* 连续学习徽章 */}
          <div className="relative w-20 h-20 flex flex-col items-center">
            <div className={`absolute w-full h-full rounded-full ${streakDays >= 7 ? 'bg-orange-400 opacity-15 animate-pulse' : 'bg-gray-200'}`}></div>
            <div className={`z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-md ${streakDays >= 7 ? 'bg-gradient-to-b from-orange-400 to-orange-600' : 'bg-gray-300'}`}>
              <span className={`text-2xl ${streakDays >= 7 ? 'text-white' : 'text-gray-500'}`}>🔥</span>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">连续7天</span>
          </div>
          
          {/* 完成课程徽章 */}
          <div className="relative w-20 h-20 flex flex-col items-center">
            <div className={`absolute w-full h-full rounded-full ${coursesCompleted > 0 ? 'bg-green-400 opacity-15 animate-pulse' : 'bg-gray-200'}`}></div>
            <div className={`z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-md ${coursesCompleted > 0 ? 'bg-gradient-to-b from-green-400 to-green-600' : 'bg-gray-300'}`}>
              <span className={`text-2xl ${coursesCompleted > 0 ? 'text-white' : 'text-gray-500'}`}>📚</span>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">完成课程</span>
          </div>
          
          {/* 长时间学习徽章 */}
          <div className="relative w-20 h-20 flex flex-col items-center">
            <div className={`absolute w-full h-full rounded-full ${totalTimeSpent > 180 ? 'bg-purple-400 opacity-15 animate-pulse' : 'bg-gray-200'}`}></div>
            <div className={`z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-md ${totalTimeSpent > 180 ? 'bg-gradient-to-b from-purple-400 to-purple-600' : 'bg-gray-300'}`}>
              <span className={`text-2xl ${totalTimeSpent > 180 ? 'text-white' : 'text-gray-500'}`}>⏱️</span>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">学习达3小时</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningStats; 