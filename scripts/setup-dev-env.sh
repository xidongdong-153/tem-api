#!/bin/bash

# 开发环境基础设施一键部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
BOLD='\033[1m'
UNDERLINE='\033[4m'
NC='\033[0m' # No Color

# 状态标识颜色
SUCCESS="${GREEN}✅${NC}"
ERROR="${RED}❌${NC}"
WARNING="${YELLOW}⚠️${NC}"
INFO="${BLUE}ℹ️${NC}"
ROCKET="${CYAN}🚀${NC}"
HAMMER="${YELLOW}🔨${NC}"
STOP="${RED}⏹️${NC}"
BUILD="${BLUE}🏗️${NC}"
WAIT="${YELLOW}⏳${NC}"
CHECK="${GREEN}🔍${NC}"
GLOBE="${BLUE}🌐${NC}"
TEST="${CYAN}🧪${NC}"
PARTY="${GREEN}🎉${NC}"
BULB="${YELLOW}💡${NC}"
DOCKER="${CYAN}🐳${NC}"
BOOK="${CYAN}📋${NC}"
STOP_SIGN="${RED}🚫${NC}"
DATABASE="${BLUE}🗄️${NC}"
WEB="${GREEN}🌐${NC}"

echo -e "${ROCKET} ${BOLD}${CYAN}TEM API 开发环境基础设施部署${NC}"
echo -e "${CYAN}======================================${NC}"
echo -e "${INFO} ${BLUE}此脚本将帮助您快速搭建开发环境所需的基础服务${NC}"
echo ""

# 检查 Docker 和 Docker Compose
echo -e "${CHECK} ${CYAN}检查环境依赖...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${ERROR} ${RED}Docker 未安装或未启动${NC}"
    echo -e "${INFO} ${BLUE}请先安装 Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${ERROR} ${RED}Docker Compose 未安装${NC}"
    echo -e "${INFO} ${BLUE}请先安装 Docker Compose${NC}"
    exit 1
fi

# 检查 Docker 服务状态
if ! docker info &> /dev/null; then
    echo -e "${ERROR} ${RED}Docker 服务未启动${NC}"
    echo -e "${INFO} ${BLUE}请启动 Docker 服务${NC}"
    exit 1
fi

echo -e "${SUCCESS} ${GREEN}环境检查通过${NC}"
echo ""

# 服务选择
echo -e "${HAMMER} ${BOLD}请选择要部署的开发服务:${NC}"
echo -e "${DATABASE} ${BLUE}1)${NC} ${GREEN}MySQL 8.0${NC} ${CYAN}(数据库)${NC}"
echo -e "${WEB} ${BLUE}2)${NC} ${YELLOW}MySQL + phpMyAdmin${NC} ${CYAN}(数据库 + 管理界面)${NC}"
echo ""
read -p "$(echo -e "${YELLOW}请输入选择 (1-2): ${NC}")" service_choice

# 初始化服务选择
MYSQL=false
PHPMYADMIN=false

case $service_choice in
    1)
        MYSQL=true
        ;;
    2)
        MYSQL=true
        PHPMYADMIN=true
        ;;
    *)
        echo -e "${ERROR} ${RED}无效选择${NC}"
        exit 1
        ;;
esac

# 显示选择的服务
echo ""
echo -e "${BOOK} ${BOLD}将部署以下服务:${NC}"
[ "$MYSQL" = true ] && echo -e "- ${DATABASE} ${GREEN}MySQL 8.0${NC} ${CYAN}(端口: 3306)${NC}"
[ "$PHPMYADMIN" = true ] && echo -e "- ${WEB} ${YELLOW}phpMyAdmin${NC} ${CYAN}(端口: 8080)${NC}"

# 确认部署
echo ""
read -p "$(echo -e "${YELLOW}是否继续部署? (y/N): ${NC}")" confirm
if [[ $confirm != [yY] ]]; then
    echo -e "${STOP_SIGN} ${YELLOW}部署已取消${NC}"
    exit 0
fi

# 生成 Docker Compose 文件
echo -e "${BUILD} ${BLUE}生成配置文件...${NC}"

cat > docker-compose.dev-services.yml << EOF
services:
EOF

# 添加 MySQL 服务
cat >> docker-compose.dev-services.yml << EOF
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
      - ./docker/mysql/conf.d:/etc/mysql/conf.d
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - tem-dev-network

EOF

# 添加 phpMyAdmin 服务
if [ "$PHPMYADMIN" = true ]; then
    cat >> docker-compose.dev-services.yml << EOF
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
fi

# 添加网络和卷定义
cat >> docker-compose.dev-services.yml << EOF

volumes:
  mysql_data:

networks:
  tem-dev-network:
    driver: bridge
EOF

# 创建必要的目录
echo -e "${HAMMER} ${BLUE}创建必要的目录...${NC}"
mkdir -p docker/mysql/conf.d

# 创建 MySQL 配置文件
cat > docker/mysql/conf.d/my.cnf << EOF
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

# 停止现有的开发服务
echo -e "${STOP} ${YELLOW}停止现有的开发服务...${NC}"
docker-compose -f docker-compose.dev-services.yml down 2>/dev/null || true

# 启动服务
echo -e "${BUILD} ${BLUE}启动开发服务...${NC}"
docker-compose -f docker-compose.dev-services.yml up -d

# 等待服务启动
echo -e "${WAIT} ${YELLOW}等待服务启动...${NC}"
sleep 15

# 健康检查
echo -e "${CHECK} ${CYAN}检查服务状态...${NC}"
if docker-compose -f docker-compose.dev-services.yml ps | grep -q "Up"; then
    echo -e "${SUCCESS} ${BOLD}${GREEN}开发环境部署成功!${NC}"
    
    # 显示服务信息
    echo ""
    echo -e "${INFO} ${BOLD}服务状态:${NC}"
    docker-compose -f docker-compose.dev-services.yml ps
    
    echo ""
    echo -e "${GLOBE} ${BOLD}${BLUE}服务访问信息:${NC}"
    
    echo -e "${DATABASE} ${BOLD}MySQL:${NC}"
    echo -e "  - ${CYAN}地址${NC}: localhost:3306"
    echo -e "  - ${CYAN}Root密码${NC}: root123456"
    echo -e "  - ${CYAN}数据库${NC}: tem_dev"
    echo -e "  - ${CYAN}用户名/密码${NC}: tem_user/tem123456"
    
    if [ "$PHPMYADMIN" = true ]; then
        echo -e "${WEB} ${BOLD}phpMyAdmin:${NC}"
        echo -e "  - ${CYAN}访问地址${NC}: http://localhost:8080"
        echo -e "  - ${CYAN}用户名/密码${NC}: root/root123456"
    fi
    
else
    echo -e "${ERROR} ${RED}部分服务启动失败${NC}"
    echo -e "${INFO} ${BLUE}查看日志${NC}: ${CYAN}docker-compose -f docker-compose.dev-services.yml logs${NC}"
fi

echo ""
echo -e "${PARTY} ${BOLD}${GREEN}开发环境搭建完成!${NC}"
echo ""
echo -e "${BULB} ${BOLD}${YELLOW}常用命令:${NC}"
echo -e "- ${BOLD}查看服务状态${NC}: ${CYAN}docker-compose -f docker-compose.dev-services.yml ps${NC}"
echo -e "- ${BOLD}查看日志${NC}: ${CYAN}docker-compose -f docker-compose.dev-services.yml logs -f${NC}"
echo -e "- ${BOLD}重启服务${NC}: ${CYAN}docker-compose -f docker-compose.dev-services.yml restart${NC}"
echo -e "- ${BOLD}停止服务${NC}: ${CYAN}docker-compose -f docker-compose.dev-services.yml down${NC}"
echo -e "- ${BOLD}清理数据${NC}: ${CYAN}docker-compose -f docker-compose.dev-services.yml down -v${NC}"
echo ""
echo -e "${INFO} ${BLUE}配置文件已保存到${NC}: ${PURPLE}docker-compose.dev-services.yml${NC}" 