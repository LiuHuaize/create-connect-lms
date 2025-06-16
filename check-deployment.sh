#!/bin/bash

# 🔍 部署状态检查脚本
# 用途: 检查各种部署方式的状态和配置

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🔍 部署状态检查"
echo "=================="
echo ""

# 检查项目基本信息
log "检查项目基本信息..."
if [ -f "package.json" ]; then
    PROJECT_NAME=$(grep '"name"' package.json | cut -d'"' -f4)
    success "项目名称: $PROJECT_NAME"
else
    error "未找到 package.json 文件"
fi

# 检查 Git 状态
log "检查 Git 状态..."
if git status >/dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current)
    LAST_COMMIT=$(git log --oneline -1)
    success "当前分支: $CURRENT_BRANCH"
    success "最新提交: $LAST_COMMIT"
    
    # 检查是否有未推送的更改
    if git status --porcelain | grep -q .; then
        warning "有未提交的更改"
        git status --short
    else
        success "工作目录干净"
    fi
    
    # 检查是否与远程同步
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
    if [ "$LOCAL" = "$REMOTE" ]; then
        success "与远程仓库同步"
    elif [ -z "$REMOTE" ]; then
        warning "无法获取远程分支信息"
    else
        warning "与远程仓库不同步，请推送或拉取"
    fi
else
    error "不是 Git 仓库"
fi

echo ""

# 检查部署配置文件
log "检查部署配置文件..."

if [ -f ".github/workflows/deploy.yml" ]; then
    success "GitHub Actions 配置文件存在"
    
    # 检查工作流是否启用
    if grep -q "^#.*name:" .github/workflows/deploy.yml; then
        warning "GitHub Actions 工作流被注释，可能未启用"
    else
        success "GitHub Actions 工作流已启用"
    fi
else
    error "GitHub Actions 配置文件不存在"
fi

if [ -f ".github/workflows/vercel-deploy.yml" ]; then
    if grep -q "^#.*name:" .github/workflows/vercel-deploy.yml; then
        success "Vercel 部署已正确停用"
    else
        warning "Vercel 部署仍然启用，可能会冲突"
    fi
fi

if [ -f "manual-deploy.sh" ]; then
    if [ -x "manual-deploy.sh" ]; then
        success "手动部署脚本存在且可执行"
    else
        warning "手动部署脚本存在但不可执行"
    fi
else
    error "手动部署脚本不存在"
fi

if [ -f "deploy-server.sh" ]; then
    if [ -x "deploy-server.sh" ]; then
        success "服务器部署脚本存在且可执行"
    else
        warning "服务器部署脚本存在但不可执行"
    fi
else
    error "服务器部署脚本不存在"
fi

echo ""

# 检查构建状态
log "检查构建状态..."

if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    success "构建目录存在，大小: $DIST_SIZE"
    
    # 检查关键文件
    if [ -f "dist/index.html" ]; then
        success "index.html 存在"
    else
        error "index.html 不存在"
    fi
    
    if [ -d "dist/assets" ]; then
        ASSETS_COUNT=$(ls dist/assets | wc -l)
        success "assets 目录存在，包含 $ASSETS_COUNT 个文件"
    else
        warning "assets 目录不存在"
    fi
else
    warning "构建目录不存在，需要运行 npm run build"
fi

echo ""

# 检查环境变量
log "检查环境变量..."

if [ -f ".env.local" ]; then
    success ".env.local 文件存在"
    
    if grep -q "VITE_SUPABASE_URL" .env.local; then
        success "Supabase URL 已配置"
    else
        error "Supabase URL 未配置"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
        success "Supabase 匿名密钥已配置"
    else
        error "Supabase 匿名密钥未配置"
    fi
else
    warning ".env.local 文件不存在"
fi

echo ""

# 检查依赖
log "检查依赖状态..."

if [ -d "node_modules" ]; then
    success "node_modules 存在"
else
    warning "node_modules 不存在，需要运行 npm install"
fi

if [ -f "package-lock.json" ]; then
    success "package-lock.json 存在"
else
    warning "package-lock.json 不存在"
fi

echo ""

# 提供建议
log "部署建议..."

echo "📋 可用的部署方式:"
echo ""
echo "1. 🤖 GitHub Actions 自动部署 (推荐)"
echo "   - 推送代码到 main 分支即可自动部署"
echo "   - 需要在 GitHub 仓库设置中配置 Secrets"
echo "   - 查看状态: https://github.com/LiuHuaize/create-connect-lms/actions"
echo ""
echo "2. 🖱️  手动部署"
echo "   - 运行: ./manual-deploy.sh"
echo "   - 需要 SSH 访问云服务器权限"
echo ""
echo "3. 🖥️  服务器端部署"
echo "   - 将 deploy-server.sh 上传到服务器"
echo "   - 在服务器上运行: ./deploy-server.sh"
echo ""

# 检查网站状态
log "检查网站状态..."

if command -v curl >/dev/null 2>&1; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://103.231.12.246 || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        success "网站可访问 (HTTP 200)"
    elif [ "$HTTP_STATUS" = "000" ]; then
        error "无法连接到服务器"
    else
        warning "网站返回状态码: $HTTP_STATUS"
    fi
else
    warning "curl 命令不可用，无法检查网站状态"
fi

echo ""
echo "🔗 相关链接:"
echo "   - 网站地址: http://103.231.12.246"
echo "   - GitHub Actions: https://github.com/LiuHuaize/create-connect-lms/actions"
echo "   - GitHub 仓库: https://github.com/LiuHuaize/create-connect-lms"
echo ""
echo "✨ 检查完成！"
