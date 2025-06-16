#!/bin/bash

# 🚀 手动部署到云服务器脚本
# 用途: 从本地直接部署到云服务器

set -e

# 配置变量 - 请根据你的服务器信息修改
SERVER_HOST="103.231.12.246"
SERVER_USER="root"  # 或者你的用户名
SERVER_PATH="/var/www/lms-project"
SSH_KEY_PATH="~/.ssh/id_rsa"  # 你的SSH私钥路径

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
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

# 检查必要文件
check_requirements() {
    log "检查部署要求..."
    
    if [ ! -f "package.json" ]; then
        error "未找到 package.json 文件"
        exit 1
    fi
    
    if [ ! -d "node_modules" ]; then
        warning "未找到 node_modules，将安装依赖"
        npm install
    fi
    
    success "要求检查通过"
}

# 构建项目
build_project() {
    log "构建项目..."
    
    # 清理旧的构建文件
    rm -rf dist
    
    # 构建项目
    if npm run build; then
        success "项目构建成功"
    else
        error "项目构建失败"
        exit 1
    fi
    
    # 检查构建结果
    if [ ! -d "dist" ]; then
        error "构建目录不存在"
        exit 1
    fi
    
    success "构建文件准备完成"
}

# 创建部署包
create_package() {
    log "创建部署包..."
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    
    # 复制构建文件
    cp -r dist/* $TEMP_DIR/
    
    # 创建压缩包
    cd $TEMP_DIR
    tar -czf ../deploy-$(date +%Y%m%d-%H%M%S).tar.gz .
    cd - > /dev/null
    
    DEPLOY_PACKAGE="$TEMP_DIR/../deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    success "部署包创建完成: $DEPLOY_PACKAGE"
    echo $DEPLOY_PACKAGE
}

# 上传到服务器
upload_to_server() {
    local package_file=$1
    log "上传文件到服务器..."
    
    # 上传部署包
    if scp -i $SSH_KEY_PATH $package_file $SERVER_USER@$SERVER_HOST:/tmp/; then
        success "文件上传成功"
    else
        error "文件上传失败"
        exit 1
    fi
    
    # 获取文件名
    local package_name=$(basename $package_file)
    echo $package_name
}

# 在服务器上部署
deploy_on_server() {
    local package_name=$1
    log "在服务器上执行部署..."
    
    ssh -i $SSH_KEY_PATH $SERVER_USER@$SERVER_HOST << EOF
        set -e
        
        echo "🚀 开始服务器端部署..."
        
        # 创建备份
        if [ -d "$SERVER_PATH/current" ]; then
            echo "📦 创建备份..."
            sudo mkdir -p $SERVER_PATH/backups
            sudo cp -r $SERVER_PATH/current $SERVER_PATH/backups/backup-\$(date +%Y%m%d-%H%M%S)
        fi
        
        # 创建新的部署目录
        echo "📂 准备部署目录..."
        sudo mkdir -p $SERVER_PATH/new
        
        # 解压新文件
        echo "📤 解压部署文件..."
        cd $SERVER_PATH/new
        sudo tar -xzf /tmp/$package_name
        
        # 原子性替换
        echo "🔄 更新网站文件..."
        if [ -d "$SERVER_PATH/current" ]; then
            sudo mv $SERVER_PATH/current $SERVER_PATH/old
        fi
        sudo mv $SERVER_PATH/new $SERVER_PATH/current
        
        # 设置权限
        echo "🔐 设置文件权限..."
        sudo chown -R www-data:www-data $SERVER_PATH/current
        sudo chmod -R 755 $SERVER_PATH/current
        
        # 测试 Nginx 配置
        echo "🧪 测试 Nginx 配置..."
        if sudo nginx -t; then
            echo "🔄 重载 Nginx..."
            sudo systemctl reload nginx
            echo "✅ Nginx 重载成功"
        else
            echo "❌ Nginx 配置测试失败"
            # 回滚
            if [ -d "$SERVER_PATH/old" ]; then
                sudo mv $SERVER_PATH/current $SERVER_PATH/failed
                sudo mv $SERVER_PATH/old $SERVER_PATH/current
                echo "🔙 已回滚到之前版本"
            fi
            exit 1
        fi
        
        # 清理
        echo "🧹 清理临时文件..."
        sudo rm -rf $SERVER_PATH/old
        rm -f /tmp/$package_name
        
        echo "🎉 部署完成！"
        echo "🌐 访问地址: http://$SERVER_HOST"
EOF
    
    if [ $? -eq 0 ]; then
        success "服务器部署成功"
    else
        error "服务器部署失败"
        exit 1
    fi
}

# 主函数
main() {
    echo "🚀 开始手动部署到云服务器..."
    echo "📍 目标服务器: $SERVER_USER@$SERVER_HOST"
    echo "📁 部署路径: $SERVER_PATH"
    echo ""
    
    # 确认部署
    read -p "确认要部署到生产服务器吗？(y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "部署已取消"
        exit 0
    fi
    
    check_requirements
    build_project
    
    package_file=$(create_package)
    package_name=$(upload_to_server $package_file)
    deploy_on_server $package_name
    
    # 清理本地临时文件
    rm -f $package_file
    
    success "🎉 部署流程全部完成！"
    echo ""
    echo "🌐 网站地址: http://$SERVER_HOST"
    echo "📊 你可以检查网站是否正常工作"
}

# 显示帮助
show_help() {
    echo "手动部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  deploy    执行部署 (默认)"
    echo "  help      显示帮助信息"
    echo ""
    echo "部署前请确保:"
    echo "1. SSH 密钥已配置"
    echo "2. 服务器信息正确"
    echo "3. 有服务器访问权限"
}

# 处理命令行参数
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "help")
        show_help
        ;;
    *)
        echo "未知选项: $1"
        show_help
        exit 1
        ;;
esac
