
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Index = () => {
  // 推荐的儿童课程
  const featuredCourses = [
    {
      id: "math-adventure",
      title: "数学冒险",
      description: "通过有趣的游戏和活动学习基础数学概念",
      imageUrl: "https://placehold.co/600x400/9BBDFC/333333?text=数学冒险",
      ageRange: "6-8岁"
    },
    {
      id: "science-discovery",
      title: "科学发现之旅",
      description: "探索自然世界的奇妙现象和基本科学概念",
      imageUrl: "https://placehold.co/600x400/A3E4D7/333333?text=科学发现之旅",
      ageRange: "8-10岁"
    },
    {
      id: "creative-writing",
      title: "创意写作启蒙",
      description: "培养孩子的写作兴趣和表达能力",
      imageUrl: "https://placehold.co/600x400/FADBD8/333333?text=创意写作启蒙",
      ageRange: "9-12岁"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">儿童趣味学习平台</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          为6-12岁儿童打造的互动学习平台，
          通过有趣的课程、游戏和活动激发孩子的学习兴趣
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="bg-connect-blue hover:bg-blue-600">
            <Link to="/explore-courses">探索课程</Link>
          </Button>
          <Button asChild size="lg" className="bg-connect-blue hover:bg-blue-600">
            <Link to="/learning">我的学习</Link>
          </Button>
          <Button variant="outline" size="lg">
            <Link to="/dashboard">家长控制台</Link>
          </Button>
        </div>
      </div>

      {/* 特色课程 */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">特色课程</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <Link to={`/course/${course.id}`} key={course.id} className="no-underline">
              <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="aspect-video w-full">
                  <img 
                    src={course.imageUrl} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                    适合 {course.ageRange} 儿童
                  </div>
                  <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">查看课程</Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 平台特色 */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">为什么选择我们？</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-connect-lightBlue rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-connect-blue">
                <path d="M17 6.1H3"></path>
                <path d="M21 12.1H3"></path>
                <path d="M15.1 18H3"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">量身定制的课程</h3>
            <p className="text-gray-600">
              针对6-12岁儿童的认知水平和兴趣特点，精心设计有趣且有教育意义的内容
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-connect-lightBlue rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-connect-blue">
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"></path>
                <path d="M16 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"></path>
                <path d="M10 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"></path>
                <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">互动学习体验</h3>
            <p className="text-gray-600">
              通过游戏化元素和互动练习，让孩子在玩中学，学中玩，增强学习积极性
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-connect-lightBlue rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-connect-blue">
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M8 16a2 2 0 1 1 4 0"></path>
                <path d="M18 16a2 2 0 1 0-4 0"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">智能学习助手</h3>
            <p className="text-gray-600">
              内置智能学习助手，随时为孩子解答问题，提供个性化指导，让学习更高效
            </p>
          </div>
        </div>
      </section>

      {/* 号召行动 */}
      <section className="bg-blue-50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">准备好开始学习冒险了吗？</h2>
        <p className="text-gray-600 mb-6">加入我们，让孩子在快乐中成长</p>
        <Button asChild size="lg" className="bg-connect-blue hover:bg-blue-600">
          <Link to="/explore-courses">探索课程</Link>
        </Button>
      </section>
    </div>
  );
};

export default Index;
