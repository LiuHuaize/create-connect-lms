import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
  isCoursePage?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, isCoursePage = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Effect to handle mobile sidebar behavior on course pages
  useEffect(() => {
    if (isCoursePage && isMobile) {
      setSidebarOpen(false);
    }
  }, [isCoursePage, isMobile]);

  // Effect to detect screen size for mobile layout
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false); // Ensure sidebar is closed on larger screens
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Effect to detect scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧背景装饰 */}
      <div className="fixed left-0 top-0 bottom-0 w-1/4 opacity-20 bg-gradient-to-br from-primary/40 via-transparent to-transparent pointer-events-none z-0"></div>
      
      {/* 右侧背景装饰 */}
      <div className="fixed right-0 bottom-0 w-1/3 h-1/3 opacity-10 bg-gradient-to-tl from-accent/60 via-transparent to-transparent pointer-events-none z-0"></div>
      
      {/* 顶部背景装饰 */}
      <div className="fixed left-0 top-0 right-0 h-1/4 opacity-10 bg-gradient-to-b from-secondary/30 via-transparent to-transparent pointer-events-none z-0"></div>
      
      {/* Sidebar rendered within the layout */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={isMobile} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Global Header - 只保留移动端菜单按钮 */}
        {!isCoursePage && isMobile && (
          <header 
            className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-all duration-300 ${
              scrolled ? 'bg-background/80 shadow-sm' : 'bg-background/50'
            }`}
          >
            <div className="h-16 px-4 flex items-center">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="rounded-full hover:bg-primary/10"
                aria-label="打开菜单"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </header>
        )}
        
        {/* Main content area with animated transitions */}
        <main className="flex-1 overflow-y-auto bg-background/80 custom-scrollbar animate-fade-in">
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout; 