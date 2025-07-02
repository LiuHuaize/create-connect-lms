import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Calendar,
  PenTool,
  User,
  Settings,
  X,
  LogOut,
  UserCog,
  Search,
  MenuIcon,
  ChevronRight,
  ChevronLeft,
  Trash2,
  FileCheck,
  Edit,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/assets/Logo";
import UserProfile from "./UserProfile";
// 导入编辑器全屏事件常量
import { EDITOR_FULLSCREEN_EVENT } from "@/components/editor/BlockNoteEditor";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile = false }) => {
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 判断当前是否在课程页面
  const isCoursePage = location.pathname.includes('/course/');
  
  // 当进入课程页面时，自动折叠侧边栏
  useEffect(() => {
    if (isCoursePage) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isCoursePage]);

  // 监听编辑器全屏状态变化事件
  useEffect(() => {
    const handleEditorFullscreenChange = (event: CustomEvent) => {
      const { isFullscreen } = event.detail;
      if (isFullscreen) {
        setIsCollapsed(true);
      }
    };

    // 添加类型断言使TypeScript知道这是一个CustomEvent
    document.addEventListener(
      EDITOR_FULLSCREEN_EVENT, 
      handleEditorFullscreenChange as EventListener
    );

    return () => {
      document.removeEventListener(
        EDITOR_FULLSCREEN_EVENT, 
        handleEditorFullscreenChange as EventListener
      );
    };
  }, []);

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
      label: "我的课程",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/learning",
    },
    {
      label: "探索课程",
      icon: <Search className="h-5 w-5" />,
      href: "/explore-courses",
    },
    {
      label: "活动",
      icon: <CalendarDays className="h-5 w-5" />,
      href: "/events",
    },
  ];

  const teacherLinks = [
    {
      label: "创建课程",
      icon: <PenTool className="h-5 w-5" />,
      href: "/course-selection",
    },
    {
      label: "作业评分",
      icon: <FileCheck className="h-5 w-5" />,
      href: "/teacher/assignments",
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
      label: "我的档案",
      icon: <User className="h-5 w-5" />,
      href: "/profile",
    },
    {
      label: "学习时间线",
      icon: <Calendar className="h-5 w-5" />,
      href: "/timeline",
    },
    {
      label: "编辑资料",
      icon: <Edit className="h-5 w-5" />,
      href: "/profile/edit",
    },
    {
      label: "设置",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
    },
  ];

  // Sidebar content component
  const SidebarContent = () => (
    <div className="h-full w-full flex flex-col bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center">
          <Logo variant="default" />
        </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
            className="rounded-full hover:bg-primary/10"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-6">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "sidebar-link",
                  isActive(link.href) ? "active" : ""
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
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                教学管理
              </div>
              {teacherLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "sidebar-link",
                    isActive(link.href) ? "active" : ""
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
              <div className="border-b border-border my-2"></div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                管理员
              </div>
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "sidebar-link",
                    isActive(link.href) ? "active" : ""
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
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              个人
            </div>
            {profileLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "sidebar-link",
                  isActive(link.href) ? "active" : ""
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

      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 py-2">
        <UserProfile />
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-destructive/10 text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Collapsed sidebar content
  const CollapsedSidebarContent = () => (
    <div className="h-full w-full flex flex-col bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex justify-center">
        <Logo variant="icon" />
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-6">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex justify-center mx-2 rounded-xl p-3",
                  isActive(link.href)
                    ? "bg-secondary/30 text-secondary-foreground"
                    : "text-foreground hover:bg-primary/10"
                )}
                onClick={isMobile ? onClose : undefined}
              >
                {link.icon}
              </Link>
            ))}
          </div>

          {(role === "teacher" || role === "admin") && (
            <div className="space-y-1">
              <div className="border-t border-border mx-3 pt-2"></div>
              {teacherLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex justify-center mx-2 rounded-xl p-3",
                    isActive(link.href)
                      ? "bg-secondary/30 text-secondary-foreground"
                      : "text-foreground hover:bg-primary/10"
                  )}
                  onClick={isMobile ? onClose : undefined}
                >
                  {link.icon}
                </Link>
              ))}
            </div>
          )}

          {role === "admin" && (
            <div className="space-y-1">
              <div className="border-b border-border mx-3 my-2"></div>
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex justify-center mx-2 rounded-xl p-3",
                    isActive(link.href)
                      ? "bg-secondary/30 text-secondary-foreground"
                      : "text-foreground hover:bg-primary/10"
                  )}
                  onClick={isMobile ? onClose : undefined}
                >
                  {link.icon}
                </Link>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <div className="border-t border-border mx-3 pt-2"></div>
            {profileLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex justify-center mx-2 rounded-xl p-3",
                  isActive(link.href)
                    ? "bg-secondary/30 text-secondary-foreground"
                    : "text-foreground hover:bg-primary/10"
                )}
                onClick={isMobile ? onClose : undefined}
              >
                {link.icon}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-border flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-destructive/10 text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
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
    <>
      {isCollapsed ? (
        <div className="w-16 border-r border-sidebar-border h-full bg-sidebar relative flex-shrink-0">
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute top-4 right-0 transform translate-x-1/2 z-20 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border shadow-sm rounded-full p-2 h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="p-4 flex justify-center">
            <Logo variant="compact" />
          </div>
          <div className="flex flex-col items-center space-y-4 mt-8">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "p-2 rounded-md",
                  isActive(link.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                title={link.label}
              >
                {link.icon}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="hidden md:block w-64 border-r border-sidebar-border h-full bg-sidebar relative">
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute top-4 right-0 transform translate-x-1/2 z-20 bg-sidebar hover:bg-sidebar-accent border border-sidebar-border shadow-sm rounded-full p-2 h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <SidebarContent />
        </div>
      )}
    </>
  );
};

export default Sidebar;
