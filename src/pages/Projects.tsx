
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, FileText, BarChart, AlertCircle } from 'lucide-react';

const Projects = () => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        
        <Button className="bg-connect-blue hover:bg-blue-600">
          <Plus size={16} className="mr-2" /> New Project
        </Button>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-6">
          {/* Project card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover-scale shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-amber-100 text-amber-700">In Progress</Badge>
                  <span className="text-sm text-gray-500">Last updated: 2 days ago</span>
                </div>
                <h3 className="text-xl font-bold">Mobile Card Game Business Plan</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <FileText size={16} className="mr-2" /> Export
                </Button>
                <Button size="sm" className="bg-connect-blue hover:bg-blue-600">
                  Continue
                </Button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">A comprehensive business plan for launching a mobile card game, including market analysis, monetization strategy, and development roadmap.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-4">
              <div className="flex items-center">
                <Clock size={18} className="text-gray-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">Deadline</p>
                  <p className="text-sm text-gray-500">March 15, 2024</p>
                </div>
              </div>
              <div className="flex items-center">
                <BarChart size={18} className="text-gray-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">Progress</p>
                  <p className="text-sm text-gray-500">65% completed</p>
                </div>
              </div>
              <div className="flex items-center">
                <AlertCircle size={18} className="text-amber-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">Action needed</p>
                  <p className="text-sm text-gray-500">Financial projections</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Second project */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover-scale shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-connect-lightBlue text-connect-blue">Just Started</Badge>
                  <span className="text-sm text-gray-500">Last updated: Today</span>
                </div>
                <h3 className="text-xl font-bold">Educational Board Game Concept</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <FileText size={16} className="mr-2" /> Export
                </Button>
                <Button size="sm" className="bg-connect-blue hover:bg-blue-600">
                  Continue
                </Button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">Design document for an educational board game targeting middle school students, focusing on STEM concepts through engaging gameplay.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-4">
              <div className="flex items-center">
                <Clock size={18} className="text-gray-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">Deadline</p>
                  <p className="text-sm text-gray-500">April 10, 2024</p>
                </div>
              </div>
              <div className="flex items-center">
                <BarChart size={18} className="text-gray-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">Progress</p>
                  <p className="text-sm text-gray-500">20% completed</p>
                </div>
              </div>
              <div className="flex items-center">
                <AlertCircle size={18} className="text-amber-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">Action needed</p>
                  <p className="text-sm text-gray-500">Prototype design</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-700">Completed</Badge>
                  <span className="text-sm text-gray-500">Completed: Jan 15, 2024</span>
                </div>
                <h3 className="text-xl font-bold">Retail Store Business Plan</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <FileText size={16} className="mr-2" /> Export
                </Button>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
            
            <p className="text-gray-600">A comprehensive business plan for a specialty retail store, including market analysis, financial projections, and operational strategy.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover-scale shadow-sm">
              <h3 className="text-lg font-bold mb-2">Business Plan Template</h3>
              <p className="text-gray-600 text-sm mb-4">A structured template for creating comprehensive business plans with all essential sections.</p>
              <Button className="w-full bg-connect-blue hover:bg-blue-600">Use Template</Button>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover-scale shadow-sm">
              <h3 className="text-lg font-bold mb-2">Game Design Document</h3>
              <p className="text-gray-600 text-sm mb-4">Template for creating detailed game design documents with mechanics, artwork, and development plans.</p>
              <Button className="w-full bg-connect-blue hover:bg-blue-600">Use Template</Button>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover-scale shadow-sm">
              <h3 className="text-lg font-bold mb-2">Product Development Plan</h3>
              <p className="text-gray-600 text-sm mb-4">Structured template for planning and tracking the development of physical or digital products.</p>
              <Button className="w-full bg-connect-blue hover:bg-blue-600">Use Template</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Projects;
