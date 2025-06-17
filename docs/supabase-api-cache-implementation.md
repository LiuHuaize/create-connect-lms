# Supabase API 缓存实施指南 - HTTPS云服务器版

## 🎯 项目概述

**域名**: `https://yixiaobu.top`  
**Supabase项目**: `https://ooyklqqgnphynyrziqyh.supabase.co`  
**服务器**: 103.231.12.246 (已配置HTTPS)

## 📋 当前状态检查

### ✅ 已完成配置
- HTTPS证书 (Let's Encrypt)
- 基础静态文件缓存
- HTML页面缓存
- Nginx配置文件: `/etc/nginx/sites-available/yixiaobu.top`

### 🎯 本次目标
为您的LMS系统的Supabase API调用添加服务器端缓存，提升数据加载性能。

## 🚀 第一步：配置Supabase API缓存

### 1.1 修改Nginx主配置

编辑 `/etc/nginx/nginx.conf`，在 `http` 块中添加Supabase API缓存配置：

```bash
sudo nano /etc/nginx/nginx.conf
```

在 `include /etc/nginx/sites-enabled/*;` **之前** 添加：

```nginx
# Supabase API缓存配置
proxy_cache_path /var/cache/nginx/supabase_api
                 levels=1:2
                 keys_zone=supabase_cache:20m
                 max_size=500m
                 inactive=60m
                 use_temp_path=off;

# 缓存锁配置
proxy_cache_lock on;
proxy_cache_lock_timeout 5s;
```

### 1.2 修改站点配置

编辑您的站点配置文件：

```bash
sudo nano /etc/nginx/sites-available/yixiaobu.top
```

在HTTPS server块中（`listen 443 ssl` 部分），在现有location块之后添加：

```nginx
# ===========================================
# Supabase API 缓存配置
# ===========================================

# 课程列表API (公共数据，缓存时间较长)
location ~ ^/api/supabase/courses$ {
    proxy_pass https://ooyklqqgnphynyrziqyh.supabase.co/rest/v1/courses;
    proxy_cache supabase_cache;
    proxy_cache_valid 200 302 10m;     # 课程列表缓存10分钟
    proxy_cache_valid 404 2m;          # 404错误缓存2分钟
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    
    # 缓存键配置 - 包含查询参数但排除认证信息
    proxy_cache_key "$scheme$request_method$host$request_uri";
    
    # 添加缓存状态头
    add_header X-Cache-Status $upstream_cache_status;
    add_header X-Cache-Type "supabase-courses";
    add_header X-Cache-TTL "10m";
    
    # 传递必要的头部
    proxy_set_header Host ooyklqqgnphynyrziqyh.supabase.co;
    proxy_set_header apikey $http_apikey;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Content-Type $http_content_type;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# 课程详情API (带查询参数)
location ~ ^/api/supabase/courses\?(.*)$ {
    proxy_pass https://ooyklqqgnphynyrziqyh.supabase.co/rest/v1/courses?$1;
    proxy_cache supabase_cache;
    proxy_cache_valid 200 302 5m;      # 课程详情缓存5分钟
    proxy_cache_valid 404 1m;
    proxy_cache_use_stale error timeout updating;
    
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
    add_header X-Cache-Type "supabase-course-details";
    add_header X-Cache-TTL "5m";
    
    proxy_set_header Host ooyklqqgnphynyrziqyh.supabase.co;
    proxy_set_header apikey $http_apikey;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Content-Type $http_content_type;
}

# 模块数据API (教学内容，变化较少)
location ~ ^/api/supabase/modules(.*)$ {
    proxy_pass https://ooyklqqgnphynyrziqyh.supabase.co/rest/v1/modules$1;
    proxy_cache supabase_cache;
    proxy_cache_valid 200 302 15m;     # 模块数据缓存15分钟
    proxy_cache_valid 404 2m;
    proxy_cache_use_stale error timeout updating;
    
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
    add_header X-Cache-Type "supabase-modules";
    add_header X-Cache-TTL "15m";
    
    proxy_set_header Host ooyklqqgnphynyrziqyh.supabase.co;
    proxy_set_header apikey $http_apikey;
    proxy_set_header Authorization $http_authorization;
}

# 课时数据API (教学内容，变化较少)
location ~ ^/api/supabase/lessons(.*)$ {
    proxy_pass https://ooyklqqgnphynyrziqyh.supabase.co/rest/v1/lessons$1;
    proxy_cache supabase_cache;
    proxy_cache_valid 200 302 15m;     # 课时数据缓存15分钟
    proxy_cache_valid 404 2m;
    proxy_cache_use_stale error timeout updating;
    
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
    add_header X-Cache-Type "supabase-lessons";
    add_header X-Cache-TTL "15m";
    
    proxy_set_header Host ooyklqqgnphynyrziqyh.supabase.co;
    proxy_set_header apikey $http_apikey;
    proxy_set_header Authorization $http_authorization;
}

# ⚠️ 注意：以下API涉及用户特定数据，缓存时间较短或不缓存

# 用户注册信息API (用户特定，短时间缓存)
location ~ ^/api/supabase/course_enrollments(.*)$ {
    proxy_pass https://ooyklqqgnphynyrziqyh.supabase.co/rest/v1/course_enrollments$1;
    proxy_cache supabase_cache;
    proxy_cache_valid 200 302 2m;      # 注册信息缓存2分钟
    proxy_cache_valid 404 30s;
    proxy_cache_use_stale error timeout updating;
    
    # 缓存键包含用户标识
    proxy_cache_key "$scheme$request_method$host$request_uri$http_authorization";
    add_header X-Cache-Status $upstream_cache_status;
    add_header X-Cache-Type "supabase-enrollments";
    add_header X-Cache-TTL "2m";
    
    proxy_set_header Host ooyklqqgnphynyrziqyh.supabase.co;
    proxy_set_header apikey $http_apikey;
    proxy_set_header Authorization $http_authorization;
}

# 用户档案API (不缓存，实时性要求高)
location ~ ^/api/supabase/profiles(.*)$ {
    proxy_pass https://ooyklqqgnphynyrziqyh.supabase.co/rest/v1/profiles$1;
    # 不使用缓存，直接代理
    add_header X-Cache-Status "BYPASS";
    add_header X-Cache-Type "supabase-profiles-nocache";
    
    proxy_set_header Host ooyklqqgnphynyrziqyh.supabase.co;
    proxy_set_header apikey $http_apikey;
    proxy_set_header Authorization $http_authorization;
}
```

### 1.3 创建缓存目录

```bash
# 创建缓存目录
sudo mkdir -p /var/cache/nginx/supabase_api

# 设置权限
sudo chown -R www-data:www-data /var/cache/nginx/supabase_api
sudo chmod -R 755 /var/cache/nginx/supabase_api
```

### 1.4 测试并应用配置

```bash
# 测试配置
sudo nginx -t

# 如果测试通过，重启Nginx
sudo systemctl restart nginx

# 检查状态
sudo systemctl status nginx
```

## 🧪 第二步：测试API缓存功能

### 2.1 基础连通性测试

```bash
# 测试课程API (第一次请求 - 应该是MISS)
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE" \
     -I "https://yixiaobu.top/api/supabase/courses"

# 测试课程API (第二次请求 - 应该是HIT)
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE" \
     -I "https://yixiaobu.top/api/supabase/courses"
```

### 2.2 查看缓存状态

```bash
# 检查缓存目录
sudo ls -la /var/cache/nginx/supabase_api/

# 查看缓存大小
sudo du -sh /var/cache/nginx/supabase_api/

# 实时监控访问日志
sudo tail -f /var/log/nginx/access.log | grep "supabase"
```

### 2.3 预期结果

正确配置后，您应该看到：

```
HTTP/1.1 200 OK
X-Cache-Status: MISS    # 第一次请求
X-Cache-Type: supabase-courses
X-Cache-TTL: 10m

HTTP/1.1 200 OK  
X-Cache-Status: HIT     # 第二次请求
X-Cache-Type: supabase-courses
X-Cache-TTL: 10m
```

## 🔧 第三步：修改前端代码使用缓存API

### 3.1 修改Supabase客户端配置

编辑 `src/integrations/supabase/client.ts`：

```typescript
// 生产环境使用缓存代理
const SUPABASE_URL = isDevelopment 
  ? `http://localhost:${getCurrentPort()}/supabase-proxy`  
  : "https://yixiaobu.top/api/supabase";  // 使用您的缓存代理

// 其他配置保持不变...
```

### 3.2 验证前端调用

在浏览器开发者工具中检查：

1. **Network面板**: 确认API请求指向 `https://yixiaobu.top/api/supabase/*`
2. **Response Headers**: 查看 `X-Cache-Status` 头部
3. **Console**: 观察React Query缓存日志

## 📊 第四步：性能监控和优化

### 4.1 缓存命中率监控

```bash
# 创建监控脚本
sudo nano /usr/local/bin/cache-monitor.sh
```

```bash
#!/bin/bash
echo "=== Supabase API 缓存统计 ==="
echo "时间: $(date)"
echo ""

# 分析访问日志中的缓存状态
echo "缓存命中率统计:"
sudo tail -1000 /var/log/nginx/access.log | grep "supabase" | \
awk '{
    if ($0 ~ /X-Cache-Status: HIT/) hit++
    else if ($0 ~ /X-Cache-Status: MISS/) miss++
    total++
}
END {
    if (total > 0) {
        printf "总请求: %d\n", total
        printf "缓存命中: %d (%.1f%%)\n", hit, (hit/total)*100
        printf "缓存未命中: %d (%.1f%%)\n", miss, (miss/total)*100
    }
}'

echo ""
echo "缓存目录大小:"
sudo du -sh /var/cache/nginx/supabase_api/

echo ""
echo "最近10个API请求:"
sudo tail -10 /var/log/nginx/access.log | grep "supabase" | \
awk '{print $4, $7, "Status:", $9}'
```

```bash
# 设置执行权限
sudo chmod +x /usr/local/bin/cache-monitor.sh

# 运行监控
sudo /usr/local/bin/cache-monitor.sh
```

### 4.2 缓存清理脚本

```bash
# 创建缓存清理脚本
sudo nano /usr/local/bin/clear-supabase-cache.sh
```

```bash
#!/bin/bash
echo "清理Supabase API缓存..."

# 清理缓存目录
sudo rm -rf /var/cache/nginx/supabase_api/*

# 重新加载Nginx配置
sudo nginx -s reload

echo "缓存清理完成！"
echo "缓存目录大小: $(sudo du -sh /var/cache/nginx/supabase_api/)"
```

```bash
# 设置执行权限
sudo chmod +x /usr/local/bin/clear-supabase-cache.sh
```

## 🎯 预期性能提升

### 缓存命中后的效果：
- **API响应时间**: 从 200-500ms 降至 10-50ms
- **服务器负载**: 减少 60-80% 的Supabase请求
- **用户体验**: 页面加载速度提升 40-60%
- **缓存命中率**: 预期达到 70-85%

### 各API端点缓存策略：
- **courses**: 10分钟 (课程信息变化不频繁)
- **modules**: 15分钟 (教学内容相对稳定)  
- **lessons**: 15分钟 (课时内容相对稳定)
- **course_enrollments**: 2分钟 (用户数据，需要相对实时)
- **profiles**: 不缓存 (用户档案，实时性要求高)

## ⚠️ 重要注意事项

1. **认证数据不缓存**: 用户登录、注册等认证相关API不应缓存
2. **用户特定数据谨慎缓存**: 注册信息等用户相关数据缓存时间较短
3. **缓存键包含认证信息**: 用户特定数据的缓存键包含Authorization头
4. **定期清理缓存**: 建议每天清理一次过期缓存
5. **监控缓存效果**: 定期检查缓存命中率和性能提升

## 🔧 故障排除

### 如果缓存不工作：
1. 检查Nginx配置语法: `sudo nginx -t`
2. 查看错误日志: `sudo tail -f /var/log/nginx/error.log`
3. 确认缓存目录权限: `ls -la /var/cache/nginx/`
4. 检查API密钥是否正确传递

### 如果出现认证问题：
1. 确认 `proxy_set_header apikey` 配置正确
2. 检查 `Authorization` 头部是否正确传递
3. 验证Supabase项目URL和密钥

## 🚀 第五步：实际部署和测试

### 5.1 一键部署脚本

创建自动化部署脚本：

```bash
# 创建部署脚本
sudo nano /usr/local/bin/deploy-supabase-cache.sh
```

```bash
#!/bin/bash
set -e

echo "🚀 开始部署Supabase API缓存..."

# 1. 备份现有配置
echo "📋 备份现有配置..."
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
sudo cp /etc/nginx/sites-available/yixiaobu.top /etc/nginx/sites-available/yixiaobu.top.backup.$(date +%Y%m%d_%H%M%S)

# 2. 创建缓存目录
echo "📁 创建缓存目录..."
sudo mkdir -p /var/cache/nginx/supabase_api
sudo chown -R www-data:www-data /var/cache/nginx/supabase_api
sudo chmod -R 755 /var/cache/nginx/supabase_api

# 3. 测试配置
echo "🔍 测试Nginx配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ 配置测试通过，重启Nginx..."
    sudo systemctl restart nginx
    echo "🎉 部署完成！"

    echo ""
    echo "📊 测试缓存功能..."
    sleep 2

    # 测试API缓存
    echo "第一次请求 (应该是MISS):"
    curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE" \
         -I "https://yixiaobu.top/api/supabase/courses" | grep -E "(HTTP|X-Cache)"

    echo ""
    echo "第二次请求 (应该是HIT):"
    curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE" \
         -I "https://yixiaobu.top/api/supabase/courses" | grep -E "(HTTP|X-Cache)"

    echo ""
    echo "🎯 缓存状态检查:"
    sudo ls -la /var/cache/nginx/supabase_api/ | head -5

else
    echo "❌ 配置测试失败，请检查配置文件"
    exit 1
fi
```

```bash
# 设置执行权限
sudo chmod +x /usr/local/bin/deploy-supabase-cache.sh
```

### 5.2 前端代码适配测试

创建测试脚本验证前端是否正确使用缓存API：

```bash
# 创建前端测试脚本
nano ~/test-frontend-cache.js
```

```javascript
// 测试前端是否正确使用缓存API
const testAPIs = [
    'https://yixiaobu.top/api/supabase/courses',
    'https://yixiaobu.top/api/supabase/modules',
    'https://yixiaobu.top/api/supabase/lessons'
];

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE';

async function testCacheAPI(url) {
    console.log(`\n🧪 测试: ${url}`);

    try {
        // 第一次请求
        const start1 = Date.now();
        const response1 = await fetch(url, {
            headers: { 'apikey': apiKey }
        });
        const time1 = Date.now() - start1;
        const cacheStatus1 = response1.headers.get('X-Cache-Status');

        console.log(`第一次请求: ${time1}ms, 缓存状态: ${cacheStatus1}`);

        // 等待1秒后第二次请求
        await new Promise(resolve => setTimeout(resolve, 1000));

        const start2 = Date.now();
        const response2 = await fetch(url, {
            headers: { 'apikey': apiKey }
        });
        const time2 = Date.now() - start2;
        const cacheStatus2 = response2.headers.get('X-Cache-Status');

        console.log(`第二次请求: ${time2}ms, 缓存状态: ${cacheStatus2}`);
        console.log(`性能提升: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);

        return {
            url,
            firstRequest: { time: time1, cache: cacheStatus1 },
            secondRequest: { time: time2, cache: cacheStatus2 },
            improvement: ((time1 - time2) / time1 * 100).toFixed(1)
        };
    } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
        return null;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🚀 开始API缓存测试...\n');

    const results = [];
    for (const url of testAPIs) {
        const result = await testCacheAPI(url);
        if (result) results.push(result);
    }

    console.log('\n📊 测试总结:');
    console.table(results);
}

// 在浏览器控制台中运行
runAllTests();
```

### 5.3 生产环境监控仪表板

创建简单的监控页面：

```bash
# 创建监控页面
sudo nano /var/www/html/cache-status.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>Supabase API 缓存监控</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; }
        .error { background-color: #f8d7da; border: 1px solid #f5c6cb; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .refresh-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🚀 Supabase API 缓存监控</h1>

    <button class="refresh-btn" onclick="location.reload()">🔄 刷新状态</button>

    <div id="cache-status">
        <h2>📊 缓存统计</h2>
        <div class="status success">
            <strong>缓存目录:</strong> /var/cache/nginx/supabase_api/<br>
            <strong>更新时间:</strong> <span id="update-time"></span>
        </div>
    </div>

    <h2>🧪 API测试</h2>
    <table id="api-tests">
        <thead>
            <tr>
                <th>API端点</th>
                <th>状态</th>
                <th>响应时间</th>
                <th>缓存状态</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>/api/supabase/courses</td>
                <td><span id="courses-status">⏳ 测试中...</span></td>
                <td><span id="courses-time">-</span></td>
                <td><span id="courses-cache">-</span></td>
                <td><button onclick="testAPI('courses')">🧪 测试</button></td>
            </tr>
            <tr>
                <td>/api/supabase/modules</td>
                <td><span id="modules-status">⏳ 测试中...</span></td>
                <td><span id="modules-time">-</span></td>
                <td><span id="modules-cache">-</span></td>
                <td><button onclick="testAPI('modules')">🧪 测试</button></td>
            </tr>
            <tr>
                <td>/api/supabase/lessons</td>
                <td><span id="lessons-status">⏳ 测试中...</span></td>
                <td><span id="lessons-time">-</span></td>
                <td><span id="lessons-cache">-</span></td>
                <td><button onclick="testAPI('lessons')">🧪 测试</button></td>
            </tr>
        </tbody>
    </table>

    <script>
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE';

        document.getElementById('update-time').textContent = new Date().toLocaleString();

        async function testAPI(endpoint) {
            const url = `https://yixiaobu.top/api/supabase/${endpoint}`;
            const statusEl = document.getElementById(`${endpoint}-status`);
            const timeEl = document.getElementById(`${endpoint}-time`);
            const cacheEl = document.getElementById(`${endpoint}-cache`);

            statusEl.textContent = '⏳ 测试中...';
            timeEl.textContent = '-';
            cacheEl.textContent = '-';

            try {
                const start = Date.now();
                const response = await fetch(url, {
                    headers: { 'apikey': apiKey }
                });
                const time = Date.now() - start;

                if (response.ok) {
                    statusEl.textContent = '✅ 正常';
                    timeEl.textContent = `${time}ms`;
                    cacheEl.textContent = response.headers.get('X-Cache-Status') || '未知';
                } else {
                    statusEl.textContent = `❌ 错误 (${response.status})`;
                }
            } catch (error) {
                statusEl.textContent = '❌ 连接失败';
                console.error('API测试失败:', error);
            }
        }

        // 页面加载时自动测试所有API
        window.onload = function() {
            ['courses', 'modules', 'lessons'].forEach(endpoint => {
                setTimeout(() => testAPI(endpoint), Math.random() * 2000);
            });
        };
    </script>
</body>
</html>
```

现在您可以访问 `https://yixiaobu.top/cache-status.html` 来监控缓存状态！

## 🎯 完整实施步骤总结

1. **运行部署脚本**: `sudo /usr/local/bin/deploy-supabase-cache.sh`
2. **修改前端代码**: 更新Supabase客户端URL指向缓存代理
3. **测试缓存功能**: 访问监控页面或运行测试脚本
4. **监控性能**: 使用 `sudo /usr/local/bin/cache-monitor.sh`
5. **必要时清理缓存**: `sudo /usr/local/bin/clear-supabase-cache.sh`

这个完整的配置将为您的LMS系统提供强大的API缓存能力，显著提升用户体验！🚀
