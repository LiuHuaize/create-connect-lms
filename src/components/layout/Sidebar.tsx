
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, MessageSquare, PenSquare, ChevronLeft, ChevronRight, X, Users } from 'lucide-react';
import Logo from '../../assets/Logo';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from './UserProfile';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, isMobile = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();
  const location = useLocation();

  // 如果在桌面模式下，使用本地state，如果在移动模式下，使用传入的isOpen
  const isVisible = isMobile ? isOpen : true;
  const actuallyCollapsed = isMobile ? false : collapsed;

  // 点击遮罩层关闭侧边栏
  const handleOverlayClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // 基于用户角色的导航项
  const commonSidebarItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: '仪表板' },
    { to: '/learning', icon: <BookOpen size={20} />, label: '课程' },
    { to: '/events', icon: <Calendar size={20} />, label: '活动' },
    { to: '/community', icon: <MessageSquare size={20} />, label: '社区' },
  ];

  // 仅对教师和管理员显示的项目
  const teacherItems = [
    { to: '/course-creator', icon: <PenSquare size={20} />, label: '创建课程' },
  ];

  // 仅对管理员显示的项目
  const adminItems = [
    { to: '/admin/users', icon: <Users size={20} />, label: '用户管理' },
  ];

  // 根据用户角色确定要显示哪些项目
  const sidebarItems = [
    ...commonSidebarItems,
    ...(role === 'teacher' || role === 'admin' ? teacherItems : []),
    ...(role === 'admin' ? adminItems : []),
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
        className={`h-screen bg-white flex flex-col transition-all duration-300 ease-in-out ${
          actuallyCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobile ? 'fixed left-0 top-0 z-40 shadow-xl' : 'border-r border-gray-200'
        }`}
      >
        <div className="p-4 flex justify-between items-center">
          {!actuallyCollapsed && <Logo />}
          {actuallyCollapsed && <div className="h-8 w-8 mx-auto rounded-md bg-gradient-to-br from-connect-blue to-connect-purple flex items-center justify-center text-white font-bold">亿</div>}
          
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
        
        <div className="flex-1 px-3 overflow-y-auto">
          <nav className="space-y-1 mt-6">
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
                <div className={`${location.pathname === item.to ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.icon}
                </div>
                {!actuallyCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* 用户资料信息 - 替换之前的退出登录按钮 */}
        {!actuallyCollapsed ? (
          <UserProfile />
        ) : (
          <div className="p-4 border-t border-gray-200 flex justify-center">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600"
              onClick={() => setCollapsed(false)}
              aria-label="查看用户资料"
            >
              <User size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
