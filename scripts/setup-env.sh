#!/bin/bash

# 环境设置脚本
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
GEAR="${YELLOW}⚙️${NC}"
CHECK="${GREEN}🔍${NC}"
SYNC="${BLUE}🔄${NC}"
TARGET="${PURPLE}🎯${NC}"
BOOK="${CYAN}📋${NC}"
FILE="${GREEN}📁${NC}"

echo -e "${ROCKET} ${BOLD}${CYAN}NestJS 环境配置脚本${NC}"
echo -e "${CYAN}=======================${NC}"

# 检查是否存在.env.example
if [ ! -f ".env.example" ]; then
    echo -e "${ERROR} ${RED}未找到 .env.example 文件${NC}"
    exit 1
fi

# 选择环境
echo -e "${GEAR} ${BOLD}请选择要设置的环境:${NC}"
echo -e "${BLUE}1)${NC} ${GREEN}development${NC} (开发环境)"
echo -e "${BLUE}2)${NC} ${RED}production${NC} (生产环境)"
echo -e "${BLUE}3)${NC} ${YELLOW}test${NC} (测试环境)"
echo -e "${BLUE}4)${NC} ${CYAN}docker${NC} (Docker环境)"
echo -e "${BLUE}5)${NC} ${PURPLE}all${NC} (同步到所有环境配置文件)"
read -p "$(echo -e "${YELLOW}请输入选择 (1-5): ${NC}")" env_choice

# 同步所有环境配置文件的函数
sync_all_environments() {
    local environments=("development" "production" "test" "docker")
    local env_names=("${GREEN}开发环境${NC}" "${RED}生产环境${NC}" "${YELLOW}测试环境${NC}" "${CYAN}Docker环境${NC}")
    local files=(".env.development" ".env.production" ".env.test" ".env.docker")
    local existing_files=()
    
    echo ""
    echo -e "${BOOK} ${BOLD}检查现有配置文件...${NC}"
    
    # 检查哪些文件已存在
    for i in "${!files[@]}"; do
        if [ -f "${files[$i]}" ]; then
            existing_files+=("${files[$i]}")
            echo -e "${WARNING} ${YELLOW}${files[$i]}${NC} (${env_names[$i]}) ${YELLOW}已存在${NC}"
        fi
    done
    
    # 如果有现有文件，询问是否覆盖
    if [ ${#existing_files[@]} -gt 0 ]; then
        echo ""
        echo -e "${INFO} ${BOLD}发现 ${YELLOW}${#existing_files[@]}${NC} ${BOLD}个现有配置文件:${NC}"
        printf '%s\n' "${existing_files[@]}"
        echo ""
        read -p "$(echo -e "${YELLOW}是否覆盖所有现有配置文件? (y/N): ${NC}")" overwrite_all
        if [[ $overwrite_all != [yY] ]]; then
            echo -e "${SUCCESS} ${GREEN}已取消同步操作${NC}"
            exit 0
        fi
    fi
    
    echo ""
    echo -e "${SYNC} ${BOLD}${BLUE}开始同步所有环境配置文件...${NC}"
    
    # 创建并配置每个环境文件
    for i in "${!environments[@]}"; do
        local env="${environments[$i]}"
        local env_name="${env_names[$i]}"
        local env_file="${files[$i]}"
        
        echo -e "${GEAR} ${CYAN}正在创建${NC} ${env_name}: ${PURPLE}${env_file}${NC}"
        
        # 复制模板文件
        cp .env.example "$env_file"
        
        # 根据环境应用配置
        apply_environment_config "$env" "$env_file"
        
        echo -e "${SUCCESS} ${env_name} ${GREEN}配置完成${NC}"
    done
    
    echo ""
    echo -e "${ROCKET} ${BOLD}${GREEN}所有环境配置文件同步完成！${NC}"
    echo ""
    echo -e "${FILE} ${BOLD}已创建的配置文件：${NC}"
    echo -e "- ${GREEN}.env.development${NC} (开发环境)"
    echo -e "- ${RED}.env.production${NC} (生产环境)" 
    echo -e "- ${YELLOW}.env.test${NC} (测试环境)"
    echo -e "- ${CYAN}.env.docker${NC} (Docker环境)"
    echo ""
    echo -e "${TARGET} ${BOLD}${BLUE}下一步操作：${NC}"
    echo -e "${BLUE}1.${NC} 根据实际需求编辑对应的配置文件"
    echo -e "${BLUE}2.${NC} 设置具体的配置值（数据库连接、密钥等）"
    echo -e "${BLUE}3.${NC} 根据环境启动应用："
    echo -e "   - ${GREEN}开发${NC}: ${CYAN}pnpm run start:dev${NC}"
    echo -e "   - ${RED}生产${NC}: ${CYAN}docker-compose -f docker-compose.prod.yml up -d${NC}"
    echo -e "   - ${YELLOW}测试${NC}: ${CYAN}pnpm run test${NC}"
    echo -e "   - ${CYAN}Docker${NC}: ${CYAN}docker-compose up -d${NC}"
    echo ""
    echo -e "${WARNING} ${BOLD}${YELLOW}注意事项：${NC}"
    echo -e "- 各环境已应用差异化配置（日志级别、格式等）"
    echo -e "- ${RED}生产环境请设置强密码和密钥${NC}"
    echo -e "- ${YELLOW}不要将包含敏感信息的.env文件提交到版本控制${NC}"
    echo -e "- ${BLUE}建议使用密钥管理服务存储敏感配置${NC}"
    
    exit 0
}

# 应用环境特定配置的函数
apply_environment_config() {
    local env="$1"
    local env_file="$2"
    
    case $env in
        "development")
            # 开发环境配置
            sed -i.bak 's/NODE_ENV=development/NODE_ENV=development/' "$env_file"
            sed -i.bak 's/LOG_LEVEL=debug/LOG_LEVEL=debug/' "$env_file"
            sed -i.bak 's/LOG_ENABLE_CONSOLE=true/LOG_ENABLE_CONSOLE=true/' "$env_file"
            sed -i.bak 's/LOG_ENABLE_FILE=false/LOG_ENABLE_FILE=false/' "$env_file"
            sed -i.bak 's/LOG_FORMAT=colorful/LOG_FORMAT=colorful/' "$env_file"
            ;;
        "production")
            # 生产环境配置
            sed -i.bak 's/NODE_ENV=development/NODE_ENV=production/' "$env_file"
            sed -i.bak 's/LOG_LEVEL=debug/LOG_LEVEL=info/' "$env_file"
            sed -i.bak 's/LOG_ENABLE_CONSOLE=true/LOG_ENABLE_CONSOLE=false/' "$env_file"
            sed -i.bak 's/LOG_ENABLE_FILE=false/LOG_ENABLE_FILE=true/' "$env_file"
            sed -i.bak 's/LOG_FORMAT=colorful/LOG_FORMAT=json/' "$env_file"
            ;;
        "test")
            # 测试环境配置
            sed -i.bak 's/NODE_ENV=development/NODE_ENV=test/' "$env_file"
            sed -i.bak 's/LOG_LEVEL=debug/LOG_LEVEL=info/' "$env_file"
            sed -i.bak 's/LOG_ENABLE_CONSOLE=true/LOG_ENABLE_CONSOLE=true/' "$env_file"
            sed -i.bak 's/LOG_ENABLE_FILE=false/LOG_ENABLE_FILE=true/' "$env_file"
            sed -i.bak 's/LOG_FORMAT=colorful/LOG_FORMAT=simple/' "$env_file"
            ;;
        "docker")
            # Docker环境配置
            sed -i.bak 's/NODE_ENV=development/NODE_ENV=production/' "$env_file"
            sed -i.bak 's/LOG_LEVEL=debug/LOG_LEVEL=info/' "$env_file"
            sed -i.bak 's/LOG_ENABLE_CONSOLE=true/LOG_ENABLE_CONSOLE=true/' "$env_file"
            sed -i.bak 's/LOG_ENABLE_FILE=false/LOG_ENABLE_FILE=true/' "$env_file"
            sed -i.bak 's/LOG_FORMAT=colorful/LOG_FORMAT=json/' "$env_file"
            # Docker环境特殊配置：调整数据库连接地址
            sed -i.bak 's/DB_HOST=localhost/DB_HOST=host.docker.internal/' "$env_file"
            sed -i.bak 's/SWAGGER_TITLE=NestJS (开发环境)/SWAGGER_TITLE=NestJS (Docker环境)/' "$env_file"
            sed -i.bak 's/SWAGGER_DESCRIPTION=NestJS 开发环境接口文档/SWAGGER_DESCRIPTION=NestJS Docker环境接口文档/' "$env_file"
            sed -i.bak 's/SWAGGER_VERSION=1.0.0-dev/SWAGGER_VERSION=1.0.0-docker/' "$env_file"
            ;;
    esac
    
    # 删除备份文件
    rm -f "$env_file.bak"
}

case $env_choice in
    1)
        ENV_FILE=".env.development"
        ENV_NAME="${GREEN}开发环境${NC}"
        ;;
    2)
        ENV_FILE=".env.production"
        ENV_NAME="${RED}生产环境${NC}"
        ;;
    3)
        ENV_FILE=".env.test"
        ENV_NAME="${YELLOW}测试环境${NC}"
        ;;
    4)
        ENV_FILE=".env.docker"
        ENV_NAME="${CYAN}Docker环境${NC}"
        ;;
    5)
        sync_all_environments
        ;;
    *)
        echo -e "${ERROR} ${RED}无效选择${NC}"
        exit 1
        ;;
esac

# 检查文件是否已存在
if [ -f "$ENV_FILE" ]; then
    read -p "$(echo -e "${WARNING} ${YELLOW}$ENV_FILE 文件已存在，是否覆盖? (y/N): ${NC}")" overwrite
    if [[ $overwrite != [yY] ]]; then
        echo -e "${SUCCESS} ${GREEN}保持现有配置文件${NC}"
        exit 0
    fi
fi

# 复制模板文件
cp .env.example "$ENV_FILE"
echo -e "${SUCCESS} ${GREEN}已创建${NC} ${ENV_NAME} ${GREEN}配置文件${NC}: ${PURPLE}$ENV_FILE${NC}"

# 根据环境自动调整配置
case $env_choice in
    1)
        apply_environment_config "development" "$ENV_FILE"
        ;;
    2)
        apply_environment_config "production" "$ENV_FILE"
        ;;
    3)
        apply_environment_config "test" "$ENV_FILE"
        ;;
    4)
        apply_environment_config "docker" "$ENV_FILE"
        ;;
esac

echo ""
echo -e "${TARGET} ${BOLD}${BLUE}下一步操作：${NC}"
if [ $env_choice -eq 4 ]; then
    echo -e "${BLUE}1.${NC} 编辑 ${PURPLE}$ENV_FILE${NC} 文件，设置具体的配置值"
    echo -e "${BLUE}2.${NC} 运行 Docker 应用:"
    echo -e "   - ${GREEN}开发环境${NC}: ${CYAN}docker-compose up -d${NC}"
    echo -e "   - ${RED}生产环境${NC}: ${CYAN}docker-compose -f docker-compose.prod.yml up -d${NC}"
    echo -e "   - ${PURPLE}一键部署${NC}: ${CYAN}bash scripts/deploy.sh${NC}"
    echo ""
    echo -e "${CYAN}🐳${NC} ${BOLD}${BLUE}Docker 环境特殊说明：${NC}"
    echo -e "- 数据库主机已自动设置为 ${YELLOW}host.docker.internal${NC}"
    echo -e "- 如果使用 ${YELLOW}Linux${NC}，可能需要手动设置为宿主机 IP"
    echo -e "- 建议配合 Docker 数据库服务使用"
else
    echo -e "${BLUE}1.${NC} 编辑 ${PURPLE}$ENV_FILE${NC} 文件，设置具体的配置值"
    echo -e "${BLUE}2.${NC} 运行应用: ${CYAN}pnpm run start:dev${NC} (开发) 或 ${CYAN}docker-compose -f docker-compose.prod.yml up -d${NC} (生产)"
fi
echo ""
echo -e "${WARNING} ${BOLD}${YELLOW}注意事项：${NC}"
echo -e "- ${RED}生产环境请设置强密码和密钥${NC}"
echo -e "- ${YELLOW}不要将包含敏感信息的.env文件提交到版本控制${NC}"
echo -e "- ${BLUE}建议使用密钥管理服务存储敏感配置${NC}" 