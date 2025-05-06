import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'pinyin': path.resolve(__dirname, './node_modules/pinyin-pro')
    },
  },
  optimizeDeps: {
    exclude: ['pinyin-pro'], // 排除pinyin-pro以避免依赖优化问题
    esbuildOptions: {
      platform: 'browser', // 确保构建平台是浏览器
      define: {
        global: 'window' // 将global定义为window以避免Node.js特定代码的问题
      }
    }
  },
  build: {
    // 出于更好的缓存考虑，启用长期缓存
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // 为每个chunk生成带有内容哈希的文件名
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // 将常用库分组到单独的chunk中
        manualChunks: (id) => {
          // React核心库
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }
          
          // 路由相关
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run')) {
            return 'routing';
          }
          
          // UI组件基础库
          if (id.includes('node_modules/@radix-ui/')) {
            return 'ui-primitives';
          }
          
          // 编辑器组件（较大，适合单独分块）
          if (id.includes('node_modules/@blocknote/') ||
              id.includes('node_modules/lexical')) {
            return 'editor';
          }
          
          // 绘图和图形相关库
          if (id.includes('node_modules/@excalidraw/') || 
              id.includes('node_modules/fabric')) {
            return 'graphics';
          }
          
          // 动画库（可延迟加载）
          if (id.includes('node_modules/framer-motion')) {
            return 'animations';
          }
          
          // 数据状态管理库
          if (id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/zustand')) {
            return 'state-management';
          }
          
          // Supabase相关
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }
          
          // 工具库
          if (id.includes('node_modules/date-fns') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'utils';
          }
          
          // 其他公共依赖
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        }
      }
    },
    // 减少文件大小
    minify: false,
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true,
    //   },
    // },
  },
}));
