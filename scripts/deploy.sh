#!/bin/bash

# 一键部署脚本
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

echo -e "${ROCKET} ${BOLD}${CYAN}NestJS 一键部署脚本${NC}"
echo -e "${CYAN}======================${NC}"

# 检查必要文件
if [ ! -f "Dockerfile" ]; then
    echo -e "${ERROR} ${RED}未找到 Dockerfile 文件${NC}"
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${ERROR} ${RED}未找到 docker-compose.prod.yml 文件${NC}"
    exit 1
fi

if [ ! -f ".env.docker" ]; then
    echo -e "${ERROR} ${RED}未找到 .env.docker 文件${NC}"
    echo -e "${INFO} ${BLUE}请先运行${NC}: ${CYAN}bash scripts/setup-env.sh${NC} ${BLUE}选择 Docker 环境${NC}"
    exit 1
fi

# 选择部署方式
echo -e "${HAMMER} ${BOLD}请选择部署方式:${NC}"
echo -e "${BLUE}1)${NC} ${GREEN}开发环境部署${NC}"
echo -e "${BLUE}2)${NC} ${RED}生产环境部署${NC}"
echo -e "${BLUE}3)${NC} ${YELLOW}仅构建镜像${NC}"
read -p "$(echo -e "${YELLOW}请输入选择 (1-3): ${NC}")" deploy_choice

case $deploy_choice in
    1)
        COMPOSE_FILE="docker-compose.yml"
        ENV_NAME="${GREEN}开发环境${NC}"
        ;;
    2)
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_NAME="${RED}生产环境${NC}"
        ;;
    3)
        echo -e "${HAMMER} ${BLUE}开始构建镜像...${NC}"
        docker build -t tem-api:latest .
        echo -e "${SUCCESS} ${GREEN}镜像构建完成${NC}"
        exit 0
        ;;
    *)
        echo -e "${ERROR} ${RED}无效选择${NC}"
        exit 1
        ;;
esac

echo -e "${BOOK} ${BOLD}部署信息:${NC}"
echo -e "- ${BOLD}环境${NC}: ${ENV_NAME}"
echo -e "- ${BOLD}配置文件${NC}: ${PURPLE}$COMPOSE_FILE${NC}"
echo ""

# 确认部署
read -p "$(echo -e "${YELLOW}是否继续部署? (y/N): ${NC}")" confirm
if [[ $confirm != [yY] ]]; then
    echo -e "${STOP_SIGN} ${YELLOW}部署已取消${NC}"
    exit 0
fi

echo -e "${HAMMER} ${BOLD}${BLUE}开始部署...${NC}"

# 停止现有容器
echo -e "${STOP} ${YELLOW}停止现有容器...${NC}"
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# 构建并启动容器
echo -e "${BUILD} ${BLUE}构建并启动容器...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d --build

# 等待服务启动
echo -e "${WAIT} ${YELLOW}等待服务启动...${NC}"
sleep 10

# 健康检查
echo -e "${CHECK} ${CYAN}检查服务状态...${NC}"
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    echo -e "${SUCCESS} ${BOLD}${GREEN}服务启动成功!${NC}"
    
    # 显示服务信息
    echo ""
    echo -e "${INFO} ${BOLD}服务信息:${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo -e "${GLOBE} ${BOLD}${BLUE}访问地址:${NC}"
    echo -e "- ${BOLD}API${NC}: ${CYAN}http://localhost:3000/api${NC}"
    echo -e "- ${BOLD}文档${NC}: ${CYAN}http://localhost:3000/api-docs${NC}"
    
    # 测试API
    echo ""
    echo -e "${TEST} ${CYAN}测试API连通性...${NC}"
    sleep 5
    if curl -s http://localhost:3000/api > /dev/null; then
        echo -e "${SUCCESS} ${GREEN}API连通性测试通过${NC}"
    else
        echo -e "${WARNING} ${YELLOW}API连通性测试失败，请检查日志${NC}"
        echo -e "${INFO} ${BLUE}查看日志${NC}: ${CYAN}docker-compose -f $COMPOSE_FILE logs -f${NC}"
    fi
    
else
    echo -e "${ERROR} ${RED}服务启动失败${NC}"
    echo -e "${INFO} ${BLUE}查看日志${NC}: ${CYAN}docker-compose -f $COMPOSE_FILE logs${NC}"
    exit 1
fi

echo ""
echo -e "${PARTY} ${BOLD}${GREEN}部署完成!${NC}"
echo ""
echo -e "${BULB} ${BOLD}${YELLOW}常用命令:${NC}"
echo -e "- ${BOLD}查看日志${NC}: ${CYAN}docker-compose -f $COMPOSE_FILE logs -f${NC}"
echo -e "- ${BOLD}重启服务${NC}: ${CYAN}docker-compose -f $COMPOSE_FILE restart${NC}"
echo -e "- ${BOLD}停止服务${NC}: ${CYAN}docker-compose -f $COMPOSE_FILE down${NC}"
echo -e "- ${BOLD}进入容器${NC}: ${CYAN}docker-compose -f $COMPOSE_FILE exec tem-api sh${NC}" 