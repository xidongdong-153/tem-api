#!/bin/bash

# TEM API 开发环境基础设施一键部署脚本
# 版本: 2.0
# 描述: 提供一键部署开发环境所需的基础服务

set -e

# ===================================
# 配置定义
# ===================================

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[0;37m'
readonly BOLD='\033[1m'
readonly UNDERLINE='\033[4m'
readonly NC='\033[0m' # No Color

# 状态图标定义
readonly SUCCESS="${GREEN}✅${NC}"
readonly ERROR="${RED}❌${NC}"
readonly WARNING="${YELLOW}⚠️${NC}"
readonly INFO="${BLUE}ℹ️${NC}"
readonly ROCKET="${CYAN}🚀${NC}"
readonly HAMMER="${YELLOW}🔨${NC}"
readonly STOP="${RED}⏹️${NC}"
readonly BUILD="${BLUE}🏗️${NC}"
readonly WAIT="${YELLOW}⏳${NC}"
readonly CHECK="${GREEN}🔍${NC}"
readonly GLOBE="${BLUE}🌐${NC}"
readonly TEST="${CYAN}🧪${NC}"
readonly PARTY="${GREEN}🎉${NC}"
readonly BULB="${YELLOW}💡${NC}"
readonly DOCKER="${CYAN}🐳${NC}"
readonly BOOK="${CYAN}📋${NC}"
readonly STOP_SIGN="${RED}🚫${NC}"
readonly DATABASE="${BLUE}🗄️${NC}"
readonly WEB="${GREEN}🌐${NC}"

# 服务配置
readonly COMPOSE_FILE="docker-compose.dev-services.yml"
readonly DOCKER_DIR="docker"
readonly MYSQL_CONF_DIR="${DOCKER_DIR}/mysql/conf.d"
readonly POSTGRESQL_INIT_DIR="${DOCKER_DIR}/postgresql/init"

# 服务选择变量
MYSQL=false
PHPMYADMIN=false
POSTGRESQL=false
ADMINER=false

# ===================================
# 工具函数
# ===================================

# 输出带格式的消息
print_header() {
    echo -e "${ROCKET} ${BOLD}${CYAN}TEM API 开发环境基础设施部署${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo -e "${INFO} ${BLUE}此脚本将帮助您快速搭建开发环境所需的基础服务${NC}"
    echo ""
}

# 输出错误信息并退出
error_exit() {
    local message="$1"
    echo -e "${ERROR} ${RED}${message}${NC}" >&2
    exit 1
}

# 输出成功信息
print_success() {
    local message="$1"
    echo -e "${SUCCESS} ${GREEN}${message}${NC}"
}

# 输出警告信息
print_warning() {
    local message="$1"
    echo -e "${WARNING} ${YELLOW}${message}${NC}"
}

# 输出信息
print_info() {
    local message="$1"
    echo -e "${INFO} ${BLUE}${message}${NC}"
}

# 输出处理中状态
print_processing() {
    local message="$1"
    echo -e "${HAMMER} ${BLUE}${message}${NC}"
}

# ===================================
# 环境检查函数
# ===================================

# 检查 Docker 环境
check_docker_environment() {
    echo -e "${CHECK} ${CYAN}检查环境依赖...${NC}"
    
    # 检查 Docker 是否安装
    if ! command -v docker &> /dev/null; then
        error_exit "Docker 未安装或未启动\n${INFO} ${BLUE}请先安装 Docker: https://docs.docker.com/get-docker/${NC}"
    fi

    # 检查 Docker Compose 是否安装
    if ! command -v docker-compose &> /dev/null; then
        error_exit "Docker Compose 未安装\n${INFO} ${BLUE}请先安装 Docker Compose${NC}"
    fi

    # 检查 Docker 服务状态
    if ! docker info &> /dev/null; then
        error_exit "Docker 服务未启动\n${INFO} ${BLUE}请启动 Docker 服务${NC}"
    fi

    print_success "环境检查通过"
    echo ""
}

# ===================================
# 服务选择函数
# ===================================

# 显示服务选择菜单
show_service_menu() {
    echo -e "${HAMMER} ${BOLD}请选择要部署的开发服务:${NC}"
    echo -e "${DATABASE} ${BLUE}1)${NC} ${GREEN}MySQL 8.0${NC} ${CYAN}(数据库)${NC}"
    echo -e "${WEB} ${BLUE}2)${NC} ${YELLOW}MySQL + phpMyAdmin${NC} ${CYAN}(数据库 + 管理界面)${NC}"
    echo -e "${DATABASE} ${BLUE}3)${NC} ${GREEN}PostgreSQL 15${NC} ${CYAN}(数据库)${NC}"
    echo -e "${WEB} ${BLUE}4)${NC} ${YELLOW}PostgreSQL + Adminer${NC} ${CYAN}(数据库 + 管理界面)${NC}"
    echo ""
}

# 处理服务选择
handle_service_selection() {
    show_service_menu
    
    read -p "$(echo -e "${YELLOW}请输入选择 (1-4): ${NC}")" service_choice

    case $service_choice in
        1)
            MYSQL=true
            ;;
        2)
            MYSQL=true
            PHPMYADMIN=true
            ;;
        3)
            POSTGRESQL=true
            ;;
        4)
            POSTGRESQL=true
            ADMINER=true
            ;;
        *)
            error_exit "无效选择"
            ;;
    esac
}

# 显示选择的服务
show_selected_services() {
    echo ""
    echo -e "${BOOK} ${BOLD}将部署以下服务:${NC}"
    [ "$MYSQL" = true ] && echo -e "- ${DATABASE} ${GREEN}MySQL 8.0${NC} ${CYAN}(端口: 3306)${NC}"
    [ "$PHPMYADMIN" = true ] && echo -e "- ${WEB} ${YELLOW}phpMyAdmin${NC} ${CYAN}(端口: 8080)${NC}"
    [ "$POSTGRESQL" = true ] && echo -e "- ${DATABASE} ${GREEN}PostgreSQL 15${NC} ${CYAN}(端口: 5432)${NC}"
    [ "$ADMINER" = true ] && echo -e "- ${WEB} ${YELLOW}Adminer${NC} ${CYAN}(端口: 8081)${NC}"
}

# 确认部署
confirm_deployment() {
    echo ""
    read -p "$(echo -e "${YELLOW}是否继续部署? (y/N): ${NC}")" confirm
    if [[ $confirm != [yY] ]]; then
        print_warning "部署已取消"
        exit 0
    fi
}

# ===================================
# Docker Compose 配置生成函数
# ===================================

# 初始化 Docker Compose 文件
init_compose_file() {
    cat > "$COMPOSE_FILE" << EOF
services:
EOF
}

# 添加 MySQL 服务配置
add_mysql_service() {
    cat >> "$COMPOSE_FILE" << EOF
  mysql:
    image: mysql:8.0
    container_name: tem-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root123456
      MYSQL_DATABASE: tem_dev
      MYSQL_USER: tem_user
      MYSQL_PASSWORD: tem123456
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./${MYSQL_CONF_DIR}:/etc/mysql/conf.d
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - tem-dev-network

EOF
}

# 添加 PostgreSQL 服务配置
add_postgresql_service() {
    cat >> "$COMPOSE_FILE" << EOF
  postgresql:
    image: postgres:15
    container_name: tem-postgresql
    restart: unless-stopped
    environment:
      POSTGRES_DB: tem_dev
      POSTGRES_USER: tem_user
      POSTGRES_PASSWORD: tem123456
    ports:
      - "5432:5432"
    volumes:
      - postgresql_data:/var/lib/postgresql/data
      - ./${POSTGRESQL_INIT_DIR}:/docker-entrypoint-initdb.d
    networks:
      - tem-dev-network

EOF
}

# 添加 phpMyAdmin 服务配置
add_phpmyadmin_service() {
    cat >> "$COMPOSE_FILE" << EOF
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: tem-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: root123456
    ports:
      - "8080:80"
    depends_on:
      - mysql
    networks:
      - tem-dev-network

EOF
}

# 添加 Adminer 服务配置
add_adminer_service() {
    cat >> "$COMPOSE_FILE" << EOF
  adminer:
    image: adminer:latest
    container_name: tem-adminer
    restart: unless-stopped
    environment:
      ADMINER_DEFAULT_SERVER: postgresql
    ports:
      - "8081:8080"
    depends_on:
      - postgresql
    networks:
      - tem-dev-network

EOF
}

# 添加卷和网络配置
add_volumes_and_networks() {
    cat >> "$COMPOSE_FILE" << EOF

volumes:
EOF

    [ "$MYSQL" = true ] && echo "  mysql_data:" >> "$COMPOSE_FILE"
    [ "$POSTGRESQL" = true ] && echo "  postgresql_data:" >> "$COMPOSE_FILE"

    cat >> "$COMPOSE_FILE" << EOF

networks:
  tem-dev-network:
    driver: bridge
EOF
}

# 生成完整的 Docker Compose 配置
generate_compose_config() {
    print_processing "生成配置文件..."
    
    init_compose_file
    
    [ "$MYSQL" = true ] && add_mysql_service
    [ "$POSTGRESQL" = true ] && add_postgresql_service
    [ "$PHPMYADMIN" = true ] && add_phpmyadmin_service
    [ "$ADMINER" = true ] && add_adminer_service
    
    add_volumes_and_networks
}

# ===================================
# 配置文件创建函数
# ===================================

# 创建必要的目录
create_directories() {
    print_processing "创建必要的目录..."
    [ "$MYSQL" = true ] && mkdir -p "$MYSQL_CONF_DIR"
    [ "$POSTGRESQL" = true ] && mkdir -p "$POSTGRESQL_INIT_DIR"
}

# 创建 MySQL 配置文件
create_mysql_config() {
    cat > "${MYSQL_CONF_DIR}/my.cnf" << EOF
[mysqld]
# 字符集设置
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# 连接设置
max_connections=200
max_connect_errors=1000

# InnoDB 设置
innodb_buffer_pool_size=256M
innodb_log_file_size=64M
innodb_file_per_table=1

# 日志设置
log_error=/var/lib/mysql/error.log
slow_query_log=1
slow_query_log_file=/var/lib/mysql/slow.log
long_query_time=2

# MySQL 8.0 兼容设置
default_authentication_plugin=mysql_native_password

# 性能优化
key_buffer_size=32M
table_open_cache=2000
sort_buffer_size=2M
read_buffer_size=2M
read_rnd_buffer_size=8M
thread_cache_size=8

[client]
default-character-set=utf8mb4

[mysql]
default-character-set=utf8mb4
EOF
}

# 创建 PostgreSQL 初始化脚本
create_postgresql_config() {
    cat > "${POSTGRESQL_INIT_DIR}/01-init.sql" << EOF
-- 创建额外的数据库
CREATE DATABASE tem_test;

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 优化设置
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;
EOF
}

# 创建所有配置文件
create_config_files() {
    create_directories
    [ "$MYSQL" = true ] && create_mysql_config
    [ "$POSTGRESQL" = true ] && create_postgresql_config
}

# ===================================
# 服务部署函数
# ===================================

# 停止现有服务
stop_existing_services() {
    print_processing "停止现有的开发服务..."
    docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
}

# 启动服务
start_services() {
    print_processing "启动开发服务..."
    docker-compose -f "$COMPOSE_FILE" up -d
}

# 等待服务启动
wait_for_services() {
    echo -e "${WAIT} ${YELLOW}等待服务启动...${NC}"
    sleep 15
}

# 检查服务健康状态
check_service_health() {
    echo -e "${CHECK} ${CYAN}检查服务状态...${NC}"
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# ===================================
# 结果展示函数
# ===================================

# 显示服务状态
show_service_status() {
    echo ""
    echo -e "${INFO} ${BOLD}服务状态:${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
}

# 显示 MySQL 连接信息
show_mysql_info() {
    echo -e "${DATABASE} ${BOLD}MySQL:${NC}"
    echo -e "  - ${CYAN}地址${NC}: localhost:3306"
    echo -e "  - ${CYAN}Root密码${NC}: root123456"
    echo -e "  - ${CYAN}数据库${NC}: tem_dev"
    echo -e "  - ${CYAN}用户名/密码${NC}: tem_user/tem123456"
}

# 显示 PostgreSQL 连接信息
show_postgresql_info() {
    echo -e "${DATABASE} ${BOLD}PostgreSQL:${NC}"
    echo -e "  - ${CYAN}地址${NC}: localhost:5432"
    echo -e "  - ${CYAN}数据库${NC}: tem_dev, tem_test"
    echo -e "  - ${CYAN}用户名/密码${NC}: tem_user/tem123456"
}

# 显示 phpMyAdmin 访问信息
show_phpmyadmin_info() {
    echo -e "${WEB} ${BOLD}phpMyAdmin:${NC}"
    echo -e "  - ${CYAN}访问地址${NC}: http://localhost:8080"
    echo -e "  - ${CYAN}用户名/密码${NC}: root/root123456"
}

# 显示 Adminer 访问信息
show_adminer_info() {
    echo -e "${WEB} ${BOLD}Adminer:${NC}"
    echo -e "  - ${CYAN}访问地址${NC}: http://localhost:8081"
    echo -e "  - ${CYAN}系统${NC}: PostgreSQL"
    echo -e "  - ${CYAN}服务器${NC}: postgresql"
    echo -e "  - ${CYAN}用户名/密码${NC}: tem_user/tem123456"
    echo -e "  - ${CYAN}数据库${NC}: tem_dev"
}

# 显示服务访问信息
show_access_info() {
    echo ""
    echo -e "${GLOBE} ${BOLD}${BLUE}服务访问信息:${NC}"
    
    [ "$MYSQL" = true ] && show_mysql_info
    [ "$POSTGRESQL" = true ] && show_postgresql_info
    [ "$PHPMYADMIN" = true ] && show_phpmyadmin_info
    [ "$ADMINER" = true ] && show_adminer_info
}

# 显示常用命令帮助
show_help_commands() {
    echo ""
    echo -e "${BULB} ${BOLD}${YELLOW}常用命令:${NC}"
    echo -e "- ${BOLD}查看服务状态${NC}: ${CYAN}docker-compose -f ${COMPOSE_FILE} ps${NC}"
    echo -e "- ${BOLD}查看日志${NC}: ${CYAN}docker-compose -f ${COMPOSE_FILE} logs -f${NC}"
    echo -e "- ${BOLD}重启服务${NC}: ${CYAN}docker-compose -f ${COMPOSE_FILE} restart${NC}"
    echo -e "- ${BOLD}停止服务${NC}: ${CYAN}docker-compose -f ${COMPOSE_FILE} down${NC}"
    echo -e "- ${BOLD}清理数据${NC}: ${CYAN}docker-compose -f ${COMPOSE_FILE} down -v${NC}"
}

# 显示成功信息
show_success_info() {
    print_success "部署成功! 开发环境搭建完成!"
    show_service_status
    show_access_info
    show_help_commands
    echo ""
    print_info "配置文件已保存到: ${PURPLE}${COMPOSE_FILE}${NC}"
}

# 显示失败信息
show_failure_info() {
    echo -e "${ERROR} ${RED}部分服务启动失败${NC}"
    print_info "查看日志: ${CYAN}docker-compose -f ${COMPOSE_FILE} logs${NC}"
}

# ===================================
# 主流程函数
# ===================================

# 主部署流程
main_deployment_process() {
    # 环境检查
    check_docker_environment
    
    # 服务选择
    handle_service_selection
    show_selected_services
    confirm_deployment
    
    # 生成配置
    generate_compose_config
    create_config_files
    
    # 部署服务
    stop_existing_services
    start_services
    wait_for_services
    
    # 检查结果
    if check_service_health; then
        show_success_info
    else
        show_failure_info
    fi
}

# ===================================
# 脚本入口
# ===================================

main() {
    print_header
    main_deployment_process
    echo -e "${PARTY} ${BOLD}${GREEN}感谢使用 TEM API 开发环境部署脚本!${NC}"
}

# 执行主函数
main "$@" 