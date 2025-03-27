
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock, Award } from 'lucide-react';

const Learning = () => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Learning</h1>
      
      <Tabs defaultValue="inProgress" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="inProgress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inProgress" className="space-y-6">
          {/* Course in progress */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="bg-connect-lightBlue text-connect-blue inline-block px-3 py-1 rounded-full text-xs font-medium mb-3">
                    Business Planning
                  </div>
                  <h3 className="font-bold text-xl mb-2">Creating a Successful Business Plan</h3>
                  <p className="text-gray-600 mb-4">Complete your business plan with industry-specific insights and financial projections.</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center text-gray-500">
                      <BookOpen size={16} className="mr-1" />
                      <span className="text-sm">7 modules</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Clock size={16} className="mr-1" />
                      <span className="text-sm">15 hours total</span>
                    </div>
                  </div>
                </div>
                
                <button className="bg-connect-blue text-white p-3 rounded-full hover:bg-blue-600 transition-colors">
                  <Play size={20} fill="white" />
                </button>
              </div>
              
              <div className="mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-500">65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            </div>
            
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Next: Financial Projections</h4>
                  <p className="text-sm text-gray-500">Create detailed financial forecasts for your business plan</p>
                </div>
                <button className="py-2 px-4 bg-connect-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                  Continue
                </button>
              </div>
            </div>
          </div>
          
          {/* Card Game Course */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="bg-amber-100 text-amber-700 inline-block px-3 py-1 rounded-full text-xs font-medium mb-3">
                    Game Design
                  </div>
                  <h3 className="font-bold text-xl mb-2">Card Game Design Workshop</h3>
                  <p className="text-gray-600 mb-4">Learn the principles of engaging card game design and prototyping.</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center text-gray-500">
                      <BookOpen size={16} className="mr-1" />
                      <span className="text-sm">5 modules</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Clock size={16} className="mr-1" />
                      <span className="text-sm">10 hours total</span>
                    </div>
                  </div>
                </div>
                
                <button className="bg-connect-blue text-white p-3 rounded-full hover:bg-blue-600 transition-colors">
                  <Play size={20} fill="white" />
                </button>
              </div>
              
              <div className="mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-500">30%</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
            </div>
            
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Next: Game Mechanics</h4>
                  <p className="text-sm text-gray-500">Explore core mechanics and player engagement strategies</p>
                </div>
                <button className="py-2 px-4 bg-connect-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                  Continue
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 text-green-700 inline-block px-3 py-1 rounded-full text-xs font-medium mr-3">
                    Product Design
                  </div>
                  <div className="flex items-center text-amber-500">
                    <Award size={16} className="mr-1" />
                    <span className="text-xs font-medium">Certificate Earned</span>
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-2">Product Development Fundamentals</h3>
                <p className="text-gray-600">A comprehensive guide to creating successful physical and digital products.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  Review
                </button>
                <button className="py-2 px-4 bg-connect-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                  Certificate
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="saved">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't saved any courses yet</p>
            <button className="py-2 px-4 bg-connect-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
              Browse Courses
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Learning;
