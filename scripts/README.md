# Base64图片转换工具

## 🎯 目标
将数据库中存储的base64图片转换为Supabase Storage URL，以减少数据库大小和提高性能。

## 📊 当前问题
- `lessons`表大小：98MB
- `course_backups`表大小：102MB  
- 单个lesson包含28MB的base64图片数据
- 导致课程加载缓慢和数据库性能问题

## 🚀 使用方法

### 1. 获取Service Role Key
1. 访问 [Supabase项目设置](https://supabase.com/dashboard/project/ooyklqqgnphynyrziqyh/settings/api)
2. 复制 `service_role` key（不是anon key）
3. 在 `convert-base64-simple.js` 中替换 `YOUR_SERVICE_ROLE_KEY_HERE`

### 2. 运行转换脚本
```bash
cd scripts
node convert-base64-simple.js
```

### 3. 预期结果
- 将28MB的base64图片转换为Storage URL
- 数据库大小减少约90%
- 课程加载速度提升显著

## 📋 转换步骤

### 第一阶段：处理最大的lesson
- 目标：`be1a07c6-0c7b-413b-9aa9-4466b036fbc4` (28MB)
- 预计节省：~25MB

### 第二阶段：处理其他大lessons
- 3个其他大lessons，每个3-4MB
- 预计节省：~10MB

### 第三阶段：清理course_backups
- 删除重复的备份数据
- 预计节省：~70MB

## ⚠️ 注意事项
1. 运行前请备份数据库
2. 确保Storage bucket `course_media` 存在且可写
3. 转换过程中请勿修改相关课程
4. 建议在低峰期执行

## 🔧 故障排除
- 如果上传失败，检查Storage权限
- 如果内存不足，减少批处理大小
- 如果网络超时，增加重试机制

## 📈 性能监控
转换后检查：
- 数据库大小变化
- 课程加载时间
- Storage使用量
- 图片显示是否正常 