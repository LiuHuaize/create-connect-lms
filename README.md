# Create Connect LMS

一个专为7-14岁学生设计的学习管理系统。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 常见问题解决

### 网络连接问题 (ERR_QUIC_PROTOCOL_ERROR)

如果遇到网络连接错误，可以尝试以下解决方案：

1. **禁用Chrome的QUIC协议** (推荐)：
   - 在Chrome地址栏输入：`chrome://flags/#enable-quic`
   - 将"Experimental QUIC protocol"设置为"Disabled"
   - 重启Chrome浏览器

2. **或者使用其他浏览器**：
   - Firefox
   - Safari
   - Edge

3. **检查网络连接**：
   - 确保网络连接稳定
   - 尝试切换网络环境

### 页面加载缓慢

如果页面加载缓慢，系统已经进行了以下优化：
- 减少重复的API请求
- 优化缓存策略
- 使用更稳定的HTTP协议

## 技术栈

- **前端**: React + TypeScript + Vite
- **UI组件**: Shadcn UI + Tailwind CSS
- **后端**: Supabase
- **状态管理**: Zustand + React Context
- **路由**: React Router DOM

## 项目结构

```
src/
├── components/     # 组件
├── pages/         # 页面
├── hooks/         # 自定义Hooks
├── services/      # API服务
├── stores/        # 状态管理
├── types/         # 类型定义
└── utils/         # 工具函数
```
