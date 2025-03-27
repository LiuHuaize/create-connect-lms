import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, MessageSquare, PenSquare, ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react';
import Logo from '../../assets/Logo';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, isMobile = false }) => {
  const [collapsed, setCollapsed] = useState(false);

  // 如果在桌面模式下，使用本地state，如果在移动模式下，使用传入的isOpen
  const isVisible = isMobile ? isOpen : true;
  const actuallyCollapsed = isMobile ? false : collapsed;

  // 点击遮罩层关闭侧边栏
  const handleOverlayClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: '仪表板' },
    { to: '/learning', icon: <BookOpen size={20} />, label: '课程' },
    { to: '/events', icon: <Calendar size={20} />, label: '活动' },
    { to: '/community', icon: <MessageSquare size={20} />, label: '社区' },
    { to: '/course-creator', icon: <PenSquare size={20} />, label: '创建课程' },
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* 移动设备上的遮罩层 */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={handleOverlayClick}
        />
      )}
      
      <div 
        className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
          actuallyCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobile ? 'fixed left-0 top-0 z-40 shadow-xl' : ''
        }`}
      >
        <div className="p-4 flex justify-between items-center">
          {!actuallyCollapsed && <Logo />}
          {actuallyCollapsed && <div className="h-8 w-8 mx-auto rounded-md bg-gradient-to-br from-connect-blue to-connect-purple flex items-center justify-center text-white font-bold">C</div>}
          
          {isMobile ? (
            // 移动设备上显示关闭按钮
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="关闭菜单"
            >
              <X size={18} />
            </button>
          ) : (
            // 桌面设备上显示折叠按钮
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={collapsed ? "展开菜单" : "折叠菜单"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>
        
        <div className="mt-6 flex-1 px-3">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={isMobile && onClose ? onClose : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''
                  } ${
                    actuallyCollapsed ? 'justify-center px-2' : ''
                  }`
                }
              >
                {item.icon}
                {!actuallyCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            className={`flex items-center gap-3 py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors w-full ${
              actuallyCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut size={20} />
            {!actuallyCollapsed && <span>登出</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
