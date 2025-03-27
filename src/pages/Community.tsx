
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Heart, BarChart, Users, ThumbsUp, Share2 } from 'lucide-react';

const Community = () => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Community</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search discussions..."
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue transition-all w-64"
            />
          </div>
          <Button className="bg-connect-blue hover:bg-blue-600">
            <MessageSquare size={16} className="mr-2" /> New Discussion
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Tabs defaultValue="trending" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="popular">Most Popular</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
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
                      <h3 className="font-semibold">Jane Doe</h3>
                      <span className="text-gray-500 text-sm">• 2 hours ago</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Entrepreneur</span>
                    </div>
                    
                    <h4 className="text-lg font-bold mb-2">Best approach for validating a business idea?</h4>
                    <p className="text-gray-600 mb-4">I'm developing a business plan for a subscription box service for board game enthusiasts. What methods have you found most effective for validating demand before launching?</p>
                    
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <ThumbsUp size={16} />
                        <span className="text-sm">24</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <MessageSquare size={16} />
                        <span className="text-sm">12 Comments</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <Share2 size={16} />
                        <span className="text-sm">Share</span>
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
                      <h3 className="font-semibold">Tom Keller</h3>
                      <span className="text-gray-500 text-sm">• 1 day ago</span>
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Game Designer</span>
                    </div>
                    
                    <h4 className="text-lg font-bold mb-2">Card game balancing techniques?</h4>
                    <p className="text-gray-600 mb-4">I'm designing a strategy card game and struggling with balancing different card abilities. What techniques or tools do you use to ensure fair gameplay while keeping it interesting?</p>
                    
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <ThumbsUp size={16} />
                        <span className="text-sm">56</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <MessageSquare size={16} />
                        <span className="text-sm">35 Comments</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <Share2 size={16} />
                        <span className="text-sm">Share</span>
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
                      <h3 className="font-semibold">Mike Smith</h3>
                      <span className="text-gray-500 text-sm">• 3 days ago</span>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Product Manager</span>
                    </div>
                    
                    <h4 className="text-lg font-bold mb-2">How detailed should a product development roadmap be?</h4>
                    <p className="text-gray-600 mb-4">I'm creating a roadmap for a physical product. How granular should the development steps be, and what key milestones do you typically include?</p>
                    
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <ThumbsUp size={16} />
                        <span className="text-sm">32</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <MessageSquare size={16} />
                        <span className="text-sm">18 Comments</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors">
                        <Share2 size={16} />
                        <span className="text-sm">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="latest">
              <div className="text-center py-12">
                <p className="text-gray-500">Loading latest discussions...</p>
              </div>
            </TabsContent>
            
            <TabsContent value="popular">
              <div className="text-center py-12">
                <p className="text-gray-500">Loading popular discussions...</p>
              </div>
            </TabsContent>
            
            <TabsContent value="following">
              <div className="text-center py-12">
                <p className="text-gray-500">Loading discussions from people you follow...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <h3 className="font-bold mb-4">Popular Topics</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                Business Planning
              </button>
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                Game Design
              </button>
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                Product Development
              </button>
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                Market Research
              </button>
              <button className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                Prototyping
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <h3 className="font-bold mb-4">Active Members</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">
                  TK
                </div>
                <div>
                  <p className="font-medium text-sm">Tom Keller</p>
                  <p className="text-xs text-gray-500">Game Designer</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-medium">
                  JD
                </div>
                <div>
                  <p className="font-medium text-sm">Jane Doe</p>
                  <p className="text-xs text-gray-500">Entrepreneur</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-medium">
                  MS
                </div>
                <div>
                  <p className="font-medium text-sm">Mike Smith</p>
                  <p className="text-xs text-gray-500">Product Manager</p>
                </div>
              </div>
            </div>
            
            <button className="w-full text-center mt-4 text-connect-blue text-sm hover:underline">
              View All Members
            </button>
          </div>
          
          <div className="bg-connect-cream rounded-xl p-5 shadow-sm">
            <h3 className="font-bold mb-2">Join Our Weekly Discussions</h3>
            <p className="text-sm text-gray-700 mb-4">Connect with experts and peers in live discussions every Thursday.</p>
            <Button className="w-full bg-black hover:bg-gray-800 text-white">
              Register Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
