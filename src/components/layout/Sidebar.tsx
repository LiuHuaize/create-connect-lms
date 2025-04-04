
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Users,
  FolderKanban,
  Monitor,
  PenTool,
  User,
  Settings,
  X,
  LogOut,
  UserCog,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/assets/Logo";
import UserProfile from "./UserProfile";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile = false }) => {
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const links = [
    {
      label: "仪表板",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/dashboard",
    },
    {
      label: "课程",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/learning",
    },
    {
      label: "活动",
      icon: <CalendarDays className="h-5 w-5" />,
      href: "/events",
    },
    {
      label: "社区",
      icon: <Users className="h-5 w-5" />,
      href: "/community",
    },
    {
      label: "项目",
      icon: <FolderKanban className="h-5 w-5" />,
      href: "/projects",
    },
    {
      label: "工作空间",
      icon: <Monitor className="h-5 w-5" />,
      href: "/workspaces",
    },
  ];

  const teacherLinks = [
    {
      label: "创建课程",
      icon: <PenTool className="h-5 w-5" />,
      href: "/course-selection", // 更新为课程选择页面
    },
  ];

  const adminLinks = [
    {
      label: "用户管理",
      icon: <UserCog className="h-5 w-5" />,
      href: "/admin/users",
    },
  ];

  const profileLinks = [
    {
      label: "个人资料",
      icon: <User className="h-5 w-5" />,
      href: "/profile",
    },
    {
      label: "设置",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
    },
  ];

  // Sidebar content component
  const SidebarContent = () => (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <Logo className="h-8 w-8" />
          <span className="ml-2 text-xl font-bold">亿小步</span>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-6">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium",
                  isActive(link.href)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={isMobile ? onClose : undefined}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {(role === "teacher" || role === "admin") && (
            <div className="space-y-1">
              <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                教学管理
              </div>
              {teacherLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium",
                    isActive(link.href)
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={isMobile ? onClose : undefined}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          {role === "admin" && (
            <div className="space-y-1">
              <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                管理员
              </div>
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium",
                    isActive(link.href)
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={isMobile ? onClose : undefined}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              个人
            </div>
            {profileLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium",
                  isActive(link.href)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={isMobile ? onClose : undefined}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="p-4 border-t">
        <UserProfile />
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </Button>
      </div>
    </div>
  );

  // Render for mobile or desktop
  if (isMobile) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-64 h-full">
          <SidebarContent />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block w-64 border-r h-full bg-white">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;
