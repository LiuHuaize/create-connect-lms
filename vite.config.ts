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
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-toast', '@radix-ui/react-tooltip', '@radix-ui/react-tabs'],
          'blocknote': ['@blocknote/react', '@blocknote/core', '@blocknote/mantine'],
        },
      }
    },
    // 减少文件大小
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
}));
