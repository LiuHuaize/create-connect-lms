import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar'; // Assuming Sidebar is in the same directory or adjust path

interface AppLayoutProps {
  children: React.ReactNode;
  isCoursePage?: boolean; // Pass this if needed for layout adjustments
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, isCoursePage = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar rendered within the layout */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isMobile={isMobile} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        {isMobile && !isCoursePage && (
          <header className="bg-sidebar border-b border-sidebar-border p-4 flex items-center flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-md hover:bg-sidebar-accent/50"
              aria-label="打开菜单"
            >
              <Menu size={24} />
            </button>
            <div className="ml-4 text-lg font-semibold text-sidebar-foreground">菜单</div>
          </header>
        )}
        
        {/* Main content area where page content will be rendered */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout; 