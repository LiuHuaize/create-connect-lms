
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, FolderKanban, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from '../../assets/Logo';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/learning', icon: <BookOpen size={20} />, label: 'My Learning' },
    { to: '/events', icon: <Calendar size={20} />, label: 'Events' },
    { to: '/projects', icon: <FolderKanban size={20} />, label: 'Projects' },
    { to: '/workspaces', icon: <Layers size={20} />, label: 'Workspaces' },
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
                `sidebar-link ${isActive ? 'active' : ''} ${
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

      <div className="p-4 mt-auto">
        {!collapsed && (
          <div className="rounded-xl bg-connect-cream p-4 shadow-sm">
            <h3 className="font-medium text-sm">Try Pro with a 7-day free trial</h3>
            <p className="text-xs text-gray-600 mt-1 mb-3">Go deeper and learn through real-world projects</p>
            <button className="w-full py-2 px-3 rounded bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
              Try for free
            </button>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-connect-cream flex items-center justify-center">
              <span className="text-xs font-bold">PRO</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
