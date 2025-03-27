
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  return (
    <nav className="h-16 border-b border-gray-200 bg-white flex items-center px-6">
      <div className="flex-1 flex items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search courses, projects..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <Link to="/community" className="text-gray-600 hover:text-gray-900 font-medium text-sm">Community</Link>
        <Link to="/course-creator" className="text-gray-600 hover:text-gray-900 font-medium text-sm">Create Course</Link>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" className="shadow-sm">
            Start free trial
          </Button>
          
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          <div className="h-9 w-9 rounded-full bg-connect-purple/20 flex items-center justify-center text-connect-purple font-medium">
            <User size={18} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
