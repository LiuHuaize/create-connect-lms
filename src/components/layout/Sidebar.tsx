
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, MessageSquare, PenSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from '../../assets/Logo';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/learning', icon: <BookOpen size={20} />, label: 'Courses' },
    { to: '/events', icon: <Calendar size={20} />, label: 'Events' },
    { to: '/community', icon: <MessageSquare size={20} />, label: 'Community' },
    { to: '/course-creator', icon: <PenSquare size={20} />, label: 'Create Course' },
  ];

  return (
    <div 
      className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4 flex justify-between items-center">
        {!collapsed && <Logo />}
        {collapsed && <div className="h-8 w-8 mx-auto rounded-md bg-gradient-to-br from-connect-blue to-connect-purple flex items-center justify-center text-white font-bold">C</div>}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <div className="mt-6 flex-1 px-3">
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''
                } ${
                  collapsed ? 'justify-center px-2' : ''
                }`
              }
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
