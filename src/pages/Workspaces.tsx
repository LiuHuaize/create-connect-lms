
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Users, FileText, Settings, Star, MoreHorizontal } from 'lucide-react';

const Workspaces = () => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
        
        <Button className="bg-connect-blue hover:bg-blue-600">
          <Plus size={16} className="mr-2" /> New Workspace
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Workspace card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover-scale shadow-sm">
          <div className="h-3 bg-connect-blue"></div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Business Planning Workspace</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">Collaborative workspace for developing business plans and strategies.</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                <span>Updated 2 days ago</span>
              </div>
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                <span>3 members</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-medium border-2 border-white">JD</div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium border-2 border-white">TK</div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-medium border-2 border-white">AS</div>
              </div>
              
              <Button variant="outline" size="sm">Open</Button>
            </div>
          </div>
        </div>
        
        {/* Second workspace */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover-scale shadow-sm">
          <div className="h-3 bg-amber-500"></div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Game Design Workspace</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">Collaborative workspace for designing and prototyping card and board games.</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                <span>Updated yesterday</span>
              </div>
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                <span>5 members</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-xs font-medium border-2 border-white">KL</div>
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-medium border-2 border-white">MR</div>
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium border-2 border-white">+3</div>
              </div>
              
              <Button variant="outline" size="sm">Open</Button>
            </div>
          </div>
        </div>
        
        {/* Third workspace */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover-scale shadow-sm">
          <div className="h-3 bg-green-500"></div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Product Development</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={18} />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">Workspace for planning and tracking physical and digital product development.</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                <span>Updated 5 days ago</span>
              </div>
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                <span>2 members</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-medium border-2 border-white">JD</div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium border-2 border-white">TK</div>
              </div>
              
              <Button variant="outline" size="sm">Open</Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-bold mb-4">Workspace Tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg mr-3">
              <FileText size={20} className="text-gray-700" />
            </div>
            <div>
              <h3 className="font-medium">Document Library</h3>
              <p className="text-xs text-gray-500">Store and share files</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg mr-3">
              <Users size={20} className="text-gray-700" />
            </div>
            <div>
              <h3 className="font-medium">Team Management</h3>
              <p className="text-xs text-gray-500">Invite and manage members</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg mr-3">
              <Settings size={20} className="text-gray-700" />
            </div>
            <div>
              <h3 className="font-medium">Workspace Settings</h3>
              <p className="text-xs text-gray-500">Customize your workspace</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspaces;
