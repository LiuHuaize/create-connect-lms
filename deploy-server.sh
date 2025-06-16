#!/bin/bash

# 🚀 LMS 项目自动部署脚本
# 作者: Augment Agent
# 用途: 自动化部署到云服务器

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_DIR="/var/www/lms-project"
BACKUP_DIR="/var/backups/lms-project"
LOG_FILE="/var/log/lms-deploy.log"
NGINX_CONFIG="/etc/nginx/sites-available/lms-project"
REPO_URL="https://github.com/LiuHuaize/create-connect-lms.git"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a $LOG_FILE
}

# 创建备份
create_backup() {
    log "创建备份..."
    sudo mkdir -p $BACKUP_DIR

    if [ -d "$PROJECT_DIR/current" ]; then
        backup_name="backup-$(date +%Y%m%d-%H%M%S)"
        sudo cp -r $PROJECT_DIR/current $BACKUP_DIR/$backup_name
        success "备份创建完成: $backup_name"
    else
        warning "没有找到现有部署，跳过备份"
    fi
}

# 回滚函数
rollback() {
    error "部署失败，执行回滚..."

    latest_backup=$(sudo ls -t $BACKUP_DIR 2>/dev/null | head -n1)
    if [ -n "$latest_backup" ] && [ -d "$BACKUP_DIR/$latest_backup" ]; then
        sudo rm -rf $PROJECT_DIR/current
        sudo cp -r $BACKUP_DIR/$latest_backup $PROJECT_DIR/current
        sudo systemctl reload nginx
        success "回滚完成，使用备份: $latest_backup"
    else
        error "没有找到可用的备份，无法回滚"
    fi
}

# 健康检查
health_check() {
    log "执行健康检查..."

    # 检查 Nginx 配置
    if ! sudo nginx -t >/dev/null 2>&1; then
        error "Nginx 配置测试失败"
        return 1
    fi

    # 检查网站是否可访问
    if curl -f -s https://yixiaobu.top >/dev/null; then
        success "HTTPS 网站健康检查通过"
        return 0
    elif curl -f -s http://103.231.12.246 >/dev/null; then
        success "HTTP 网站健康检查通过"
        return 0
    else
        error "网站无法访问"
        return 1
    fi
}

# 主部署函数
deploy() {
    log "🚀 开始部署 LMS 项目..."

    # 创建备份
    create_backup

    # 创建项目目录
    log "创建项目目录..."
    sudo mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR

    # 克隆或更新代码
    if [ ! -d ".git" ]; then
        log "首次部署，克隆仓库..."
        sudo git clone $REPO_URL .
        sudo chown -R $USER:$USER .
    else
        log "更新代码..."
        git fetch --all
        git reset --hard origin/main
    fi

    # 检查 package.json 是否存在
    if [ ! -f "package.json" ]; then
        error "未找到 package.json 文件"
        rollback
        exit 1
    fi

    # 安装依赖
    log "安装依赖..."
    if ! npm ci; then
        error "依赖安装失败"
        rollback
        exit 1
    fi

    # 构建项目
    log "构建项目..."
    if ! npm run build; then
        error "项目构建失败"
        rollback
        exit 1
    fi

    # 检查构建结果
    if [ ! -d "dist" ]; then
        error "构建目录不存在"
        rollback
        exit 1
    fi

    # 部署文件
    log "部署文件..."
    sudo rm -rf current
    sudo mv dist current
    sudo chown -R www-data:www-data current

    # 重启 Nginx
    log "重启 Nginx..."
    if ! sudo systemctl reload nginx; then
        error "Nginx 重启失败"
        rollback
        exit 1
    fi

    # 健康检查
    if health_check; then
        success "🎉 部署成功完成！"
        success "🌐 HTTPS 访问地址: https://yixiaobu.top"
        success "🌐 HTTP 访问地址: http://103.231.12.246"

        # 清理旧备份（保留最近5个）
        log "清理旧备份..."
        sudo ls -t $BACKUP_DIR | tail -n +6 | sudo xargs -r -I {} rm -rf $BACKUP_DIR/{}

    else
        error "健康检查失败"
        rollback
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "LMS 项目部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  deploy    执行部署"
    echo "  rollback  回滚到上一个版本"
    echo "  status    检查服务状态"
    echo "  logs      查看部署日志"
    echo "  help      显示此帮助信息"
}

# 检查服务状态
check_status() {
    echo "=== 服务状态 ==="
    echo "Nginx: $(sudo systemctl is-active nginx)"
    echo "网站访问: $(curl -s -o /dev/null -w "%{http_code}" http://103.231.12.246)"
    echo ""
    echo "=== 磁盘使用 ==="
    df -h $PROJECT_DIR
    echo ""
    echo "=== 最近部署 ==="
    sudo ls -la $BACKUP_DIR 2>/dev/null | tail -5 || echo "暂无备份"
}

# 主逻辑
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        check_status
        ;;
    "logs")
        tail -f $LOG_FILE
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
