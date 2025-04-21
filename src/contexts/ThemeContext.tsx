import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 从localStorage读取主题设置，默认为system
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme;
      return storedTheme || 'system';
    }
    return 'system';
  });

  // 监听主题变化并更新根元素类和localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    
    // 移除所有主题类
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // 根据系统偏好设置主题
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      // 根据用户选择设置主题
      root.classList.add(theme);
    }
    
    // 保存主题设置到localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 添加系统主题变化监听
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 当系统主题变化时更新
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}; 