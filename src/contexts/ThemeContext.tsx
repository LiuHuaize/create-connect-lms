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
    // 从localStorage读取主题设置，默认为light
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme;
      return storedTheme || 'light'; // 默认改为light而不是system
    }
    return 'light'; // 默认改为light
  });

  // 监听主题变化并更新根元素类和localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    
    // 移除所有主题类
    root.classList.remove('light', 'dark');

    // 忽略系统偏好，总是使用亮色主题，除非明确指定为dark
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      // 无论是'light'还是'system'，都使用亮色主题
      root.classList.add('light');
    }
    
    // 保存主题设置到localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 移除系统主题变化监听，因为我们现在忽略系统偏好
  // 如果想保留此功能但默认使用light主题，可以保留这段代码并修改
  useEffect(() => {
    if (theme !== 'system') return;
    
    // 即使是system设置，我们也强制使用light主题
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    
    // 不再监听系统主题变化
    // const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // const handleChange = () => {
    //   const root = window.document.documentElement;
    //   root.classList.remove('light', 'dark');
    //   root.classList.add('light'); // 总是使用light
    // };
    // mediaQuery.addEventListener('change', handleChange);
    // return () => mediaQuery.removeEventListener('change', handleChange);
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