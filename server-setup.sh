#!/bin/bash

echo "🚀 开始配置云服务器环境..."

# 更新系统
echo "📦 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
echo "🔧 安装基础工具..."
sudo apt install -y curl wget git unzip

# 安装 Node.js
echo "📦 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
echo "✅ Node.js 版本: $(node --version)"
echo "✅ NPM 版本: $(npm --version)"

# 安装 Nginx
echo "🌐 安装 Nginx..."
sudo apt install -y nginx

# 启动并启用 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 创建项目目录
echo "📁 创建项目目录..."
sudo mkdir -p /var/www/lms-project
sudo chown -R $USER:$USER /var/www/lms-project

# 配置 Nginx
echo "⚙️ 配置 Nginx..."
sudo tee /etc/nginx/sites-available/lms-project > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    root /var/www/lms-project/current;
    index index.html index.htm;
    
    # 处理前端路由
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
EOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/lms-project /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 配置防火墙
echo "🔒 配置防火墙..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "✅ 服务器配置完成！"
echo ""
echo "📋 接下来需要在 GitHub 中添加以下 Secrets："
echo "   HOST: $(curl -s ifconfig.me)"
echo "   USERNAME: $USER"
echo "   SSH_PRIVATE_KEY: ~/.ssh/id_rsa 的内容"
echo "   TARGET_DIR: /var/www/lms-project"
echo "   VITE_SUPABASE_URL: 你的 Supabase URL"
echo "   VITE_SUPABASE_ANON_KEY: 你的 Supabase 匿名密钥"
echo ""
echo "🌐 你的服务器IP: $(curl -s ifconfig.me)"
echo "🔗 默认可通过 http://$(curl -s ifconfig.me) 访问" 