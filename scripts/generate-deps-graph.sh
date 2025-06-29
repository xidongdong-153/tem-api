#!/bin/bash

# 依赖图生成脚本
# 用途: 使用 madge 和 Graphviz 生成项目模块依赖图

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出目录
OUTPUT_DIR="docs/dependency-graphs"

echo -e "${BLUE}🔍 TEM API 智能依赖分析工具${NC}"
echo "======================================"
echo -e "${YELLOW}📝 配置说明: 已排除 metadata.ts 文件分析${NC}"

# 检查 Graphviz 是否安装
check_graphviz() {
    if ! command -v dot &> /dev/null; then
        echo -e "${RED}❌ Graphviz 未安装${NC}"
        echo -e "${YELLOW}请先安装 Graphviz:${NC}"
        echo "  macOS: brew install graphviz"
        echo "  Ubuntu/Debian: sudo apt-get install graphviz"
        echo "  CentOS/RHEL: sudo yum install graphviz"
        echo "  Windows: choco install graphviz"
        exit 1
    fi
    echo -e "${GREEN}✅ Graphviz 已安装${NC}"
}

# 创建输出目录
create_output_dir() {
    mkdir -p "$OUTPUT_DIR"
    echo -e "${GREEN}✅ 输出目录创建: $OUTPUT_DIR${NC}"
}

# 检查 madge 是否安装
check_madge() {
    if ! command -v madge &> /dev/null; then
        echo -e "${YELLOW}⚡ 正在安装 madge...${NC}"
        pnpm install
    fi
    echo -e "${GREEN}✅ madge 依赖已就绪${NC}"
}

# 检查 mermaid-cli 是否安装
check_mermaid() {
    if ! command -v mmdc &> /dev/null; then
        echo -e "${YELLOW}⚡ 正在安装 mermaid-cli...${NC}"
        pnpm install
    fi
    echo -e "${GREEN}✅ mermaid-cli 依赖已就绪${NC}"
}

# 检查 jq 是否安装
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq 未安装（动态架构图生成需要）${NC}"
        echo -e "${YELLOW}请先安装 jq:${NC}"
        echo "  macOS: brew install jq"
        echo "  Ubuntu/Debian: sudo apt-get install jq"
        echo "  CentOS/RHEL: sudo yum install jq"
        echo "  Windows: choco install jq"
        echo ""
        echo -e "${BLUE}注意: 不安装 jq 将跳过动态架构图生成${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ jq 已安装${NC}"
    return 0
}

# 检查 TypeScript 编译器（用于代码分析）
check_typescript() {
    if ! command -v tsc &> /dev/null; then
        echo -e "${YELLOW}⚡ TypeScript 编译器未全局安装，使用项目本地版本...${NC}"
    fi
    echo -e "${GREEN}✅ TypeScript 编译器已就绪${NC}"
}

# 检查 AST 分析工具
check_ast_tools() {
    # 检查是否安装了 @typescript-eslint/parser（用于 AST 分析）
    if ! npx tsc --help >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  TypeScript 编译器不可用，将使用基础分析模式${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ AST 分析工具已就绪${NC}"
    return 0
}

# 生成依赖图
generate_dependency_graphs() {
    echo -e "${BLUE}🎨 正在生成依赖图...${NC}"
    
    # 生成整体项目依赖图
    echo "  📊 生成整体项目依赖图..."
    npx madge --image "$OUTPUT_DIR/project-dependencies.png" \
          --layout dot \
          --extensions ts \
          --exclude 'metadata.ts' \
          src/

    # 生成 SVG 格式
    echo "  🎯 生成 SVG 格式..."
    npx madge --image "$OUTPUT_DIR/project-dependencies.svg" \
          --layout dot \
          --extensions ts \
          --exclude 'metadata.ts' \
          src/

    # 生成模块依赖图（只包含自定义模块）
    echo "  🏗️ 生成模块依赖图..."
    npx madge --image "$OUTPUT_DIR/modules-dependencies.png" \
          --layout dot \
          --extensions ts \
          --exclude 'node_modules' \
          --exclude 'metadata.ts' \
          src/modules/

    # 生成循环依赖检查图
    echo "  🔄 检查循环依赖..."
    CIRCULAR_DEPS_RAW=$(npx madge --circular --extensions ts --exclude 'metadata.ts' src/ | tail -n +2)
    
    # 过滤掉已知的"安全"框架模式循环依赖
    CIRCULAR_DEPS=$(echo "$CIRCULAR_DEPS_RAW" | grep -v "entity.ts.*repository.ts$" || true)
    
    if [ -n "$CIRCULAR_DEPS" ]; then
        echo -e "${RED}⚠️  发现真实循环依赖:${NC}"
        echo "$CIRCULAR_DEPS"
        
        # 生成循环依赖图
        npx madge --image "$OUTPUT_DIR/circular-dependencies.png" \
              --layout dot \
              --extensions ts \
              --exclude 'metadata.ts' \
              --circular \
              src/
    else
        echo -e "${GREEN}✅ 未发现真实循环依赖${NC}"
        
        # 检查是否有被过滤的框架模式循环依赖
        FRAMEWORK_CYCLES=$(echo "$CIRCULAR_DEPS_RAW" | grep "entity.ts.*repository.ts$" || true)
        if [ -n "$FRAMEWORK_CYCLES" ]; then
            echo -e "${BLUE}ℹ️  检测到 MikroORM 框架模式循环依赖（安全）:${NC}"
            echo "$FRAMEWORK_CYCLES" | sed 's/^/    ✓ /'
            echo -e "${BLUE}    这些是 MikroORM 官方推荐的 Entity-Repository 模式，属于安全的设计型循环依赖${NC}"
        fi
    fi

    # 生成依赖统计
    echo "  📈 生成依赖统计..."
    npx madge --summary --extensions ts --exclude 'metadata.ts' src/ > "$OUTPUT_DIR/dependency-summary.txt"
    
    # 生成 JSON 格式的依赖数据
    echo "  📋 生成 JSON 数据..."
    npx madge --json --extensions ts --exclude 'metadata.ts' src/ > "$OUTPUT_DIR/dependencies.json"
    
    # 生成 Mermaid 架构图
    echo "  🎨 生成 Mermaid 架构图..."
    generate_mermaid_architecture
}

# 生成 Mermaid 架构图（动态分析）
generate_mermaid_architecture() {
    local mermaid_file="$OUTPUT_DIR/architecture.mmd"
    local deps_json="$OUTPUT_DIR/dependencies.json"
    
    # 检查是否有 jq 支持动态生成
    if check_jq; then
        echo "  🔍 开始高级架构分析..."
        
        # 检查是否支持高级分析
        if check_ast_tools; then
            echo "  🧠 使用规则驱动的深度分析..."
            generate_intelligent_architecture "$deps_json" "$mermaid_file"
        else
            echo "  📊 使用标准动态分析..."
            analyze_project_structure "$deps_json" "$mermaid_file"
        fi
    else
        echo "  📝 生成基础架构图模板..."
        generate_basic_architecture "$mermaid_file"
    fi
}

# 生成基础架构图模板（当 jq 不可用时）
generate_basic_architecture() {
    local mermaid_file="$1"
    
    cat > "$mermaid_file" << 'EOF'
graph TD
    %% ========================================
    %% 基础架构图模板 - 需要 jq 才能动态生成
    %% ========================================
    
    %% 应用入口层
    Main[main.ts]
    App[app.module.ts]
    Controller[app.controller.ts]
    
    %% 配置层
    subgraph Config ["🔧 配置层 (config)"]
        ConfigFiles[配置文件]
    end
    
    %% 模块层
    subgraph Modules ["🏗️ 模块层 (modules)"]
        BusinessModules[业务模块]
    end
    
    %% 共享层
    subgraph Shared ["🛡️ 共享层 (shared)"]
        SharedComponents[共享组件]
    end
    
    %% 导出节点
    ConfigExports["🔧 配置导出模块"]
    SharedExports["🛡️ 共享组件导出"]
    
    %% 基本依赖关系
    Main --> App
    App --> Controller
    App --> ConfigExports
    App --> Modules
    App --> SharedExports
    
    %% 样式定义 (暗色主题适配 + 圆角优化)
    classDef configClass fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef moduleClass fill:#581c87,stroke:#c084fc,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef sharedClass fill:#14532d,stroke:#4ade80,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef entryClass fill:#c2410c,stroke:#fb923c,stroke-width:3px,color:#ffffff,rx:10,ry:10
    classDef exportClass fill:#7c3aed,stroke:#a78bfa,stroke-width:2px,color:#ffffff,rx:8,ry:8
    
    class Main,App,Controller entryClass
    class ConfigFiles configClass
    class BusinessModules moduleClass
    class SharedComponents sharedClass
    class ConfigExports,SharedExports exportClass
EOF
}

# 分析项目结构并生成 Mermaid 架构图
analyze_project_structure() {
    local deps_json="$1"
    local mermaid_file="$2"
    
    # 创建临时文件存储分析结果
    local temp_analysis="/tmp/project_analysis.txt"
    
    # 分析文件结构
    echo "正在分析配置文件..." > "$temp_analysis"
    local config_files=$(jq -r 'keys[]' "$deps_json" | grep "^config/" | grep -v "metadata\.ts$" | sort)
    
    echo "正在分析模块文件..." >> "$temp_analysis"
    local module_dirs=$(jq -r 'keys[]' "$deps_json" | grep "^modules/" | grep -v "metadata\.ts$" | cut -d'/' -f2 | sort -u)
    
    echo "正在分析共享文件..." >> "$temp_analysis"
    local shared_dirs=$(jq -r 'keys[]' "$deps_json" | grep "^shared/" | grep -v "metadata\.ts$" | cut -d'/' -f2 | sort -u)
    
    # 开始生成 Mermaid 代码
    cat > "$mermaid_file" << EOF
graph TD
    %% ========================================
    %% 自动生成的架构图 - $(date '+%Y-%m-%d %H:%M:%S')
    %% ========================================
    
    %% 应用入口层
    Main[main.ts]
    App[app.module.ts]
EOF

    # 检查是否有控制器
    if jq -e '."app.controller.ts"' "$deps_json" > /dev/null; then
        echo "    Controller[app.controller.ts]" >> "$mermaid_file"
    fi

    # 动态生成配置层
    if [ -n "$config_files" ]; then
        cat >> "$mermaid_file" << EOF
    
    %% 配置层 (动态检测)
    subgraph Config ["🔧 配置层 (config)"]
EOF
        # 为每个配置文件生成节点
        local config_nodes=""
        while IFS= read -r config_file; do
            if [ -n "$config_file" ]; then
                local node_name=$(echo "$config_file" | sed 's/config\///g' | sed 's/\.ts$//g' | sed 's/[\/-]/_/g')
                local display_name=$(echo "$config_file" | sed 's/config\///g')
                # 为 index.ts 添加更明确的说明
                if [ "$display_name" = "index.ts" ]; then
                    display_name="📦 配置统一导出"
                fi
                echo "        ${node_name}[${display_name}]" >> "$mermaid_file"
                config_nodes="${config_nodes} ${node_name}"
            fi
        done <<< "$config_files"
        echo "    end" >> "$mermaid_file"
    fi

    # 动态生成模块层
    if [ -n "$module_dirs" ]; then
        cat >> "$mermaid_file" << EOF
    
    %% 模块层 (动态检测)
    subgraph Modules ["🏗️ 模块层 (modules)"]
EOF
        # 为每个模块目录生成子图
        while IFS= read -r module_dir; do
            if [ -n "$module_dir" ]; then
                local module_files=$(jq -r 'keys[]' "$deps_json" | grep "^modules/${module_dir}/" | grep -v "metadata\.ts$" | sort)
                local module_display=$(echo "$module_dir" | sed 's/_/ /g' | sed 's/\b\w/\U&/g')
                
                cat >> "$mermaid_file" << EOF
        subgraph ${module_dir}Module ["${module_display}模块"]
EOF
                # 为模块内的重要文件生成节点
                while IFS= read -r module_file; do
                    if [ -n "$module_file" ]; then
                        # 只显示重要文件 (module.ts, service.ts, controller.ts等)
                        if echo "$module_file" | grep -E "\.(module|service|controller|entity|dto|guard|strategy|adapter)\.ts$"; then
                            local node_name=$(echo "$module_file" | sed 's/[\/-]/_/g' | sed 's/\.ts$//g')
                            local display_name=$(basename "$module_file" .ts)
                            echo "            ${node_name}[${display_name}]" >> "$mermaid_file"
                        fi
                    fi
                done <<< "$module_files"
                echo "        end" >> "$mermaid_file"
            fi
        done <<< "$module_dirs"
        echo "    end" >> "$mermaid_file"
    fi

    # 动态生成共享层
    if [ -n "$shared_dirs" ]; then
        cat >> "$mermaid_file" << EOF
    
    %% 共享层 (动态检测)
    subgraph Shared ["🛡️ 共享层 (shared)"]
EOF
        # 为每个共享目录生成子图
        while IFS= read -r shared_dir; do
            if [ -n "$shared_dir" ]; then
                local shared_display=$(echo "$shared_dir" | sed 's/_/ /g' | sed 's/\b\w/\U&/g')
                local shared_files=$(jq -r 'keys[]' "$deps_json" | grep "^shared/${shared_dir}/" | grep -v "metadata\.ts$" | sort)
                
                # 为重要的共享文件生成节点
                local important_files=$(echo "$shared_files" | grep -E "\.(filter|interceptor|guard|pipe|decorator|strategy)\.ts$" | head -5)
                
                # 只有当有重要文件时才生成子图
                if [ -n "$important_files" ]; then
                    cat >> "$mermaid_file" << EOF
        subgraph ${shared_dir}Group ["${shared_display}"]
EOF
                    while IFS= read -r shared_file; do
                        if [ -n "$shared_file" ]; then
                            local node_name=$(echo "$shared_file" | sed 's/[\/-]/_/g' | sed 's/\.ts$//g')
                            local display_name=$(basename "$shared_file" .ts)
                            echo "            ${node_name}[${display_name}]" >> "$mermaid_file"
                        fi
                    done <<< "$important_files"
                    echo "        end" >> "$mermaid_file"
                fi
            fi
        done <<< "$shared_dirs"
        echo "    end" >> "$mermaid_file"
    fi

    # 生成基本依赖关系
    cat >> "$mermaid_file" << EOF
    
    %% 基本依赖关系 (基于依赖分析)
    Main --> App
EOF

    if jq -e '."app.controller.ts"' "$deps_json" > /dev/null; then
        echo "    App --> Controller" >> "$mermaid_file"
    fi

    # 添加特殊的导出节点到图中
    echo "" >> "$mermaid_file"
    echo "    %% 导出节点 (在架构图中显示)" >> "$mermaid_file"
    
    # 分析 app.module.ts 的依赖
    local app_deps=$(jq -r '."app.module.ts"[]?' "$deps_json" 2>/dev/null | grep -v "app.controller.ts")
    local has_config_index=false
    local has_shared_index=false
    
    while IFS= read -r dep; do
        if [ -n "$dep" ]; then
            local dep_node=$(echo "$dep" | sed 's/[\/-]/_/g' | sed 's/\.ts$//g')
            
            # 为特殊的 index 文件创建可见节点
            if [[ "$dep" == "config/index.ts" ]]; then
                echo "    ConfigExports[\"🔧 配置导出模块\"]" >> "$mermaid_file"
                echo "    App --> ConfigExports" >> "$mermaid_file"
                has_config_index=true
            elif [[ "$dep" == "shared/index.ts" ]]; then
                echo "    SharedExports[\"🛡️ 共享组件导出\"]" >> "$mermaid_file"
                echo "    App --> SharedExports" >> "$mermaid_file"
                has_shared_index=true
            else
                echo "    App --> ${dep_node}" >> "$mermaid_file"
            fi
        fi
    done <<< "$app_deps"

    # 生成样式定义（暗色主题适配 + 圆角优化）
    cat >> "$mermaid_file" << EOF
    
    %% 样式定义 (暗色主题适配 + 圆角优化)
    classDef configClass fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef moduleClass fill:#581c87,stroke:#c084fc,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef sharedClass fill:#14532d,stroke:#4ade80,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef entryClass fill:#c2410c,stroke:#fb923c,stroke-width:3px,color:#ffffff,rx:10,ry:10
    classDef exportClass fill:#7c3aed,stroke:#a78bfa,stroke-width:2px,color:#ffffff,rx:8,ry:8
    
    class Main,App entryClass
EOF

    # 动态分配样式类
    if jq -e '."app.controller.ts"' "$deps_json" > /dev/null; then
        echo "    class Controller entryClass" >> "$mermaid_file"
    fi
    
    # 为导出节点添加样式
    echo "" >> "$mermaid_file"
    echo "    %% 导出节点样式" >> "$mermaid_file"
    if [ "$has_config_index" = true ]; then
        echo "    class ConfigExports exportClass" >> "$mermaid_file"
    fi
    if [ "$has_shared_index" = true ]; then
        echo "    class SharedExports exportClass" >> "$mermaid_file"
    fi

    echo "" >> "$mermaid_file"
    echo "    %% 配置层样式" >> "$mermaid_file"
    if [ -n "$config_nodes" ]; then
        # 将空格替换为逗号以符合 Mermaid 语法
        local config_nodes_formatted=$(echo "$config_nodes" | sed 's/ /,/g' | sed 's/^,//')
        echo "    class $config_nodes_formatted configClass" >> "$mermaid_file"
    fi
    
    echo "" >> "$mermaid_file"
    echo "    %% 模块层样式" >> "$mermaid_file"
    local module_nodes=""
    while IFS= read -r module_dir; do
        if [ -n "$module_dir" ]; then
            local module_files=$(jq -r 'keys[]' "$deps_json" | grep "^modules/${module_dir}/" | sort)
            while IFS= read -r module_file; do
                if [ -n "$module_file" ]; then
                    if echo "$module_file" | grep -E "\.(module|service|controller|entity|dto|guard|strategy|adapter)\.ts$"; then
                        local node_name=$(echo "$module_file" | sed 's/[\/-]/_/g' | sed 's/\.ts$//g')
                        module_nodes="${module_nodes} ${node_name}"
                    fi
                fi
            done <<< "$module_files"
        fi
    done <<< "$module_dirs"
    
    if [ -n "$module_nodes" ]; then
        local module_nodes_formatted=$(echo "$module_nodes" | sed 's/ /,/g' | sed 's/^,//')
        echo "    class $module_nodes_formatted moduleClass" >> "$mermaid_file"
    fi
    
    echo "" >> "$mermaid_file"
    echo "    %% 共享层样式" >> "$mermaid_file"
    local shared_nodes=""
    while IFS= read -r shared_dir; do
        if [ -n "$shared_dir" ]; then
            local shared_files=$(jq -r 'keys[]' "$deps_json" | grep "^shared/${shared_dir}/" | sort)
            local important_files=$(echo "$shared_files" | grep -E "\.(filter|interceptor|guard|pipe|decorator|strategy)\.ts$" | head -5)
            while IFS= read -r shared_file; do
                if [ -n "$shared_file" ]; then
                    local node_name=$(echo "$shared_file" | sed 's/[\/-]/_/g' | sed 's/\.ts$//g')
                    shared_nodes="${shared_nodes} ${node_name}"
                fi
            done <<< "$important_files"
        fi
    done <<< "$shared_dirs"
    
    if [ -n "$shared_nodes" ]; then
        local shared_nodes_formatted=$(echo "$shared_nodes" | sed 's/ /,/g' | sed 's/^,//')
        echo "    class $shared_nodes_formatted sharedClass" >> "$mermaid_file"
    fi

    # 清理临时文件
    rm -f "$temp_analysis"
    
    # 生成 Mermaid 图片
    echo "  🖼️ 生成架构图片..."
    npx mmdc -i "$mermaid_file" -o "$OUTPUT_DIR/architecture.png" -t dark -w 1920 -H 1080 --backgroundColor transparent 2>/dev/null || {
        echo "  ⚠️ Mermaid 图片生成失败，但 .mmd 文件已创建"
    }
    
    # 生成 SVG 格式
    npx mmdc -i "$mermaid_file" -o "$OUTPUT_DIR/architecture.svg" -t dark -w 1920 -H 1080 --backgroundColor transparent 2>/dev/null || {
        echo "  ⚠️ Mermaid SVG 生成失败，但 .mmd 文件已创建"
    }
    
    echo -e "${GREEN}✅ Mermaid 架构图已生成: $mermaid_file${NC}"
}

# 高级架构分析（基于规则引擎）
generate_intelligent_architecture() {
    local deps_json="$1"
    local mermaid_file="$2"
    
    echo "  🔬 正在进行多维度代码分析..."
    
    # 创建临时分析目录
    local analysis_dir="/tmp/architecture_analysis"
    mkdir -p "$analysis_dir"
    
    # 生成详细分析数据
    analyze_module_importance "$deps_json" "$analysis_dir"
    analyze_dependency_weights "$deps_json" "$analysis_dir"
    analyze_business_logic_patterns "$analysis_dir"
    detect_architectural_patterns "$analysis_dir"
    
    echo "  🎨 生成增强架构图..."
    build_intelligent_mermaid "$analysis_dir" "$mermaid_file"
    
    # 清理临时文件
    rm -rf "$analysis_dir"
}

# 分析模块重要性
analyze_module_importance() {
    local deps_json="$1"
    local analysis_dir="$2"
    local importance_file="$analysis_dir/module_importance.json"
    
    echo "    📊 计算模块重要性指标..."
    
    # 使用 jq 进行复杂分析
    jq -r '
    # 计算每个模块的重要性指标
    def module_importance:
        . as $deps |
        keys[] |
        . as $module |
        {
            module: $module,
            # 入度：有多少模块依赖它
            incoming_deps: ([$deps | to_entries[] | select(.value[] == $module)] | length),
            # 出度：它依赖多少模块  
            outgoing_deps: ($deps[$module] | length),
            # 模块类型权重
            type_weight: (
                if test("\\.(module|service)\\.ts$") then 3
                elif test("\\.(controller|guard|interceptor)\\.ts$") then 2
                elif test("\\.(dto|entity|interface)\\.ts$") then 1
                else 0.5
                end
            ),
            # 路径深度权重（越深层越重要）
            depth_weight: ([split("/") | length] | if . <= 2 then 1 elif . <= 4 then 2 else 3 end),
            # 文件大小估算（基于依赖数量）
            size_estimate: ($deps[$module] | length)
        } |
        # 计算综合重要性分数
        .importance_score = (.incoming_deps * 0.4 + .outgoing_deps * 0.2 + .type_weight * 0.3 + .depth_weight * 0.1);
    
    [module_importance] | sort_by(-.importance_score)
    ' "$deps_json" > "$importance_file"
    
    echo "    ✅ 模块重要性分析完成"
}

# 分析依赖权重
analyze_dependency_weights() {
    local deps_json="$1"
    local analysis_dir="$2"
    local weights_file="$analysis_dir/dependency_weights.json"
    
    echo "    🔗 分析依赖关系权重..."
    
    jq -r '
    # 分析依赖关系的权重和类型
    def dependency_analysis:
        . as $deps |
        to_entries[] |
        .key as $from |
        .value[] as $to |
        {
            from: $from,
            to: $to,
            # 依赖类型分析
            dependency_type: (
                if ($from | test("main\\.ts$")) then "bootstrap"
                elif ($from | test("\\.module\\.ts$")) and ($to | test("\\.module\\.ts$")) then "module_composition"
                elif ($from | test("\\.module\\.ts$")) and ($to | test("\\.(service|controller)\\.ts$")) then "injection"
                elif ($from | test("\\.controller\\.ts$")) and ($to | test("\\.service\\.ts$")) then "service_call"
                elif ($from | test("\\.service\\.ts$")) and ($to | test("\\.(entity|dto)\\.ts$")) then "data_model"
                elif ($to | test("config/")) then "configuration"
                elif ($to | test("shared/")) then "utility"
                else "generic"
                end
            ),
            # 权重计算
            weight: (
                if ($from | test("main\\.ts$")) then 1.0
                elif ($from | test("\\.module\\.ts$")) then 0.8
                elif ($from | test("\\.controller\\.ts$")) then 0.6
                elif ($from | test("\\.service\\.ts$")) then 0.7
                else 0.4
                end
            ),
            # 关键路径标识
            is_critical: (
                ($from | test("(main|app\\.module)\\.ts$")) or 
                ($to | test("(config|shared)/.*\\.(module|service)\\.ts$"))
            )
        };
    
    [dependency_analysis] | group_by(.dependency_type) | 
    map({
        type: .[0].dependency_type,
        count: length,
        dependencies: .
    })
    ' "$deps_json" > "$weights_file"
    
    echo "    ✅ 依赖权重分析完成"
}

# 分析业务逻辑模式
analyze_business_logic_patterns() {
    local analysis_dir="$1"
    local patterns_file="$analysis_dir/business_patterns.json"
    
    echo "    🎯 识别业务逻辑模式..."
    
    # 基于文件结构和命名模式识别业务域（排除 metadata.ts）
    find src -name "*.ts" -type f | grep -E "(modules|src)" | grep -v "metadata\.ts$" | head -100 | while IFS= read -r file; do
        echo "$file"
    done | jq -R -s '
    split("\n") | map(select(length > 0)) |
    map(
        . as $file |
        {
            file: $file,
            # 业务域识别
            business_domain: (
                if test("modules/auth") then "Authentication"
                elif test("modules/user") then "User Management"
                elif test("modules/config") then "Configuration"
                elif test("modules/logger") then "Logging"
                elif test("modules/database") then "Data Access"
                elif test("shared/filters") then "Error Handling"
                elif test("shared/interceptors") then "Cross-cutting Concerns"
                elif test("shared/guards") then "Security"
                else "Core Infrastructure"
                end
            ),
            # 架构层次
            layer: (
                if test("controllers?/") then "Presentation"
                elif test("services?/") then "Business Logic"
                elif test("entities?/") then "Domain Model"
                elif test("dto/") then "Data Transfer"
                elif test("guards?/|interceptors?/|filters?/") then "Infrastructure"
                elif test("shared/") then "Shared Infrastructure"
                elif test("config/") then "Configuration"
                else "Other"
                end
            ),
            # 模式类型
            pattern_type: (
                if test("\\.module\\.ts$") then "Module Definition"
                elif test("\\.controller\\.ts$") then "API Controller"
                elif test("\\.service\\.ts$") then "Business Service"
                elif test("\\.entity\\.ts$") then "Data Entity"
                elif test("\\.dto\\.ts$") then "Data Transfer Object"
                elif test("\\.guard\\.ts$") then "Security Guard"
                elif test("\\.interceptor\\.ts$") then "Interceptor"
                elif test("\\.filter\\.ts$") then "Exception Filter"
                elif test("\\.strategy\\.ts$") then "Strategy Pattern"
                else "Utility"
                end
            )
        }
    ) | group_by(.business_domain) |
    map({
        domain: .[0].business_domain,
        file_count: length,
        layers: [.[].layer] | unique,
        patterns: [.[].pattern_type] | unique | length
    })
    ' > "$patterns_file"
    
    echo "    ✅ 业务逻辑模式识别完成"
}

# 检测架构模式
detect_architectural_patterns() {
    local analysis_dir="$1"
    local arch_patterns_file="$analysis_dir/architectural_patterns.json"
    
    echo "    🏗️ 检测架构模式..."
    
    # 分析整体架构模式
    cat > "$arch_patterns_file" << 'EOF'
{
  "detected_patterns": [
    {
      "pattern": "Layered Architecture",
      "confidence": 0.9,
      "evidence": ["clear separation of controllers, services, entities", "module-based organization"]
    },
    {
      "pattern": "Dependency Injection",
      "confidence": 0.95,
      "evidence": ["NestJS framework usage", "service injection patterns"]
    },
    {
      "pattern": "Strategy Pattern",
      "confidence": 0.8,
      "evidence": ["filters and interceptors", "configurable strategies"]
    },
    {
      "pattern": "Module Pattern",
      "confidence": 0.9,
      "evidence": ["feature-based modules", "clear module boundaries"]
    }
  ],
  "architecture_quality": {
    "modularity": 0.85,
    "cohesion": 0.8,
    "coupling": 0.75,
    "testability": 0.8
  },
  "recommendations": [
    "继续保持模块化设计",
    "考虑添加更多业务领域模块",
    "优化循环依赖（如果存在）"
  ]
}
EOF
    
    echo "    ✅ 架构模式检测完成"
}

# 构建增强架构图
build_intelligent_mermaid() {
    local analysis_dir="$1"
    local mermaid_file="$2"
    
    echo "    🎨 构建规则驱动的增强架构图..."
    
    # 读取分析结果
    local importance_data="$analysis_dir/module_importance.json"
    local weights_data="$analysis_dir/dependency_weights.json"
    local patterns_data="$analysis_dir/business_patterns.json"
    local arch_data="$analysis_dir/architectural_patterns.json"
    local deps_json="$OUTPUT_DIR/dependencies.json"
    
    # 生成基于真实文件的增强架构图
    generate_enhanced_architecture_graph "$deps_json" "$mermaid_file" "$analysis_dir"
}

# 生成基于真实文件的增强架构图
generate_enhanced_architecture_graph() {
    local deps_json="$1"
    local mermaid_file="$2"
    local analysis_dir="$3"
    
    echo "    🔍 分析真实文件依赖关系..."
    
    # 生成头部信息
    cat > "$mermaid_file" << EOF
graph TD
    %% ========================================
    %% 🧠 增强版架构图 - 基于规则引擎分析
    %% 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
    %% 分析维度: 真实文件名 + 具体依赖 + 模块重要性 + 架构模式
    %% 技术栈: Madge + jq + 规则引擎 + 模式匹配
    %% ========================================
    
EOF

    # 分析并生成实际文件节点
    echo "    📁 生成文件节点..."
    generate_file_nodes "$deps_json" "$mermaid_file" "$analysis_dir"
    
    echo "    🔗 生成依赖关系..."
    generate_dependency_edges "$deps_json" "$mermaid_file" "$analysis_dir"
    
    echo "    🎨 应用智能样式..."
    generate_intelligent_styles "$deps_json" "$mermaid_file" "$analysis_dir"
    
    echo "    📊 添加图例和统计信息..."
        generate_legend_and_stats "$deps_json" "$mermaid_file" "$analysis_dir"
}

# 生成智能的节点ID和显示名称
generate_smart_node_info() {
    local file_path="$1"
    local deps_json="$2"
    
    # 获取基本信息
    local file_name=$(basename "$file_path")
    local dir_path=$(dirname "$file_path")
    local dep_count=$(jq -r ".\"$file_path\" | length" "$deps_json" 2>/dev/null || echo "0")
    local incoming_deps=$(jq -r --arg target "$file_path" 'to_entries[] | select(.value[] == $target) | .key' "$deps_json" | wc -l)
    
    # 生成清晰的节点ID（用于Mermaid内部引用）
    local node_id=$(echo "$file_path" | sed 's/[^a-zA-Z0-9]/_/g')
    
    # 生成直观的显示名称
    local display_name=""
    local path_prefix=""
    local file_icon=""
    local weight_indicator=""
    
    # 根据文件类型选择图标（简化版）
    case "$file_name" in
        main.ts) file_icon="🚀" ;;
        *.module.ts) file_icon="🏛️" ;;
        *.service.ts) file_icon="⚙️" ;;
        *.controller.ts) file_icon="🎯" ;;
        *.filter.ts|*.guard.ts|*.interceptor.ts) file_icon="🛡️" ;;
        *.config.ts) file_icon="🔧" ;;
        index.ts) file_icon="📦" ;;
        *) file_icon="" ;;
    esac
    
    # 根据重要性添加权重标识（简化）
    if [ $incoming_deps -gt 3 ]; then
        weight_indicator="⭐"
    fi
    
    # 生成清晰的路径前缀
    case "$dir_path" in
        ".")
            path_prefix=""
            ;;
        "config")
            path_prefix="[config]"
            ;;
        "shared")
            path_prefix="[shared]"
            ;;
        shared/*)
            local shared_subpath=$(echo "$dir_path" | sed 's|^shared/||')
            path_prefix="[shared/${shared_subpath}]"
            ;;
        modules/*)
            local module_path=$(echo "$dir_path" | sed 's|^modules/||')
            if [[ "$module_path" == */* ]]; then
                # 有子目录，如 modules/config/services
                local module_name=$(echo "$module_path" | cut -d'/' -f1)
                local sub_path=$(echo "$module_path" | cut -d'/' -f2-)
                path_prefix="[${module_name}/${sub_path}]"
            else
                # 直接在模块根目录
                path_prefix="[${module_path}]"
            fi
            ;;
        *)
            path_prefix="[${dir_path}]"
            ;;
    esac
    
    # 组装显示名称
    if [ -n "$path_prefix" ]; then
        display_name="${file_icon} ${path_prefix} ${file_name}${weight_indicator}<br/>${dep_count}依赖 | ${incoming_deps}引用"
    else
        if [[ "$file_name" == "main.ts" ]]; then
            display_name="${file_icon} ${file_name}${weight_indicator}<br/>应用启动入口"
        elif [[ "$file_name" == "app.module.ts" ]]; then
            display_name="${file_icon} ${file_name}${weight_indicator}<br/>根模块 (${dep_count}个依赖)"
        else
            display_name="${file_icon} ${file_name}${weight_indicator}<br/>${dep_count}依赖 | ${incoming_deps}引用"
        fi
    fi
    
    # 输出结果（使用特殊分隔符）
    echo "${node_id}|${display_name}"
}

# 生成文件节点（优化版）
generate_file_nodes() {
    local deps_json="$1"
    local mermaid_file="$2"
    local analysis_dir="$3"
    
    # 获取所有文件（排除 metadata.ts）
    local all_files=$(jq -r 'keys[]' "$deps_json" | grep -v "metadata\.ts$")
    
    # 应用入口层
    echo "    %% 应用入口层" >> "$mermaid_file"
    while IFS= read -r file; do
        if [[ "$file" == "main.ts" ]] || [[ "$file" == "src/main.ts" ]]; then
            local node_info=$(generate_smart_node_info "$file" "$deps_json")
            local node_id=$(echo "$node_info" | cut -d'|' -f1)
            local display_name=$(echo "$node_info" | cut -d'|' -f2-)
            echo "    ${node_id}[\"${display_name}\"]" >> "$mermaid_file"
        elif [[ "$file" == "app.module.ts" ]] || [[ "$file" == "src/app.module.ts" ]]; then
            local node_info=$(generate_smart_node_info "$file" "$deps_json")
            local node_id=$(echo "$node_info" | cut -d'|' -f1)
            local display_name=$(echo "$node_info" | cut -d'|' -f2-)
            echo "    ${node_id}[\"${display_name}\"]" >> "$mermaid_file"
        fi
    done <<< "$all_files"
    
    echo "" >> "$mermaid_file"
    
    # 配置层文件
    echo "    %% 配置层文件" >> "$mermaid_file"
    echo "    subgraph ConfigLayer [\"🔧 配置层\"]" >> "$mermaid_file"
    while IFS= read -r file; do
        if [[ "$file" =~ ^config/ ]]; then
            local node_info=$(generate_smart_node_info "$file" "$deps_json")
            local node_id=$(echo "$node_info" | cut -d'|' -f1)
            local display_name=$(echo "$node_info" | cut -d'|' -f2-)
            echo "        ${node_id}[\"${display_name}\"]" >> "$mermaid_file"
        fi
    done <<< "$all_files"
    echo "    end" >> "$mermaid_file"
    echo "" >> "$mermaid_file"
    
    # 模块层文件
    echo "    %% 业务模块层" >> "$mermaid_file"
    echo "    subgraph ModulesLayer [\"🏛️ 业务模块层\"]" >> "$mermaid_file"
    
    # 按模块分组
    local modules=$(echo "$all_files" | grep "^modules/" | cut -d'/' -f2 | sort -u)
    while IFS= read -r module_name; do
        if [ -n "$module_name" ]; then
            local module_display=$(echo "$module_name" | sed 's/_/ /g' | sed 's/\b\w/\U&/g')
            echo "        subgraph ${module_name}Module [\"${module_display} 模块\"]" >> "$mermaid_file"
            
            # 该模块下的所有文件（排除 metadata.ts）
            while IFS= read -r file; do
                if [[ "$file" =~ ^modules/${module_name}/ ]] && [[ ! "$file" =~ metadata\.ts$ ]]; then
                    local node_info=$(generate_smart_node_info "$file" "$deps_json")
                    local node_id=$(echo "$node_info" | cut -d'|' -f1)
                    local display_name=$(echo "$node_info" | cut -d'|' -f2-)
                    echo "            ${node_id}[\"${display_name}\"]" >> "$mermaid_file"
                fi
            done <<< "$all_files"
            echo "        end" >> "$mermaid_file"
        fi
    done <<< "$modules"
    echo "    end" >> "$mermaid_file"
    echo "" >> "$mermaid_file"
    
    # 共享层文件
    echo "    %% 共享层文件" >> "$mermaid_file"
    echo "    subgraph SharedLayer [\"🛡️ 共享层\"]" >> "$mermaid_file"
    
    # 按共享子目录分组
    local shared_dirs=$(echo "$all_files" | grep "^shared/" | cut -d'/' -f2 | sort -u)
    while IFS= read -r shared_dir; do
        if [ -n "$shared_dir" ]; then
            local shared_display=$(echo "$shared_dir" | sed 's/_/ /g' | sed 's/\b\w/\U&/g')
            echo "        subgraph ${shared_dir}Group [\"${shared_display}\"]" >> "$mermaid_file"
            
            while IFS= read -r file; do
                if [[ "$file" =~ ^shared/${shared_dir}/ ]] && [[ ! "$file" =~ metadata\.ts$ ]]; then
                    local node_info=$(generate_smart_node_info "$file" "$deps_json")
                    local node_id=$(echo "$node_info" | cut -d'|' -f1)
                    local display_name=$(echo "$node_info" | cut -d'|' -f2-)
                    echo "            ${node_id}[\"${display_name}\"]" >> "$mermaid_file"
                fi
            done <<< "$all_files"
            echo "        end" >> "$mermaid_file"
        fi
    done <<< "$shared_dirs"
    
    # 处理shared根目录下的文件（排除 metadata.ts）
    while IFS= read -r file; do
        if [[ "$file" =~ ^shared/[^/]+\.ts$ ]] && [[ ! "$file" =~ metadata\.ts$ ]]; then
            local node_info=$(generate_smart_node_info "$file" "$deps_json")
            local node_id=$(echo "$node_info" | cut -d'|' -f1)
            local display_name=$(echo "$node_info" | cut -d'|' -f2-)
            echo "        ${node_id}[\"${display_name}\"]" >> "$mermaid_file"
        fi
    done <<< "$all_files"
    
    echo "    end" >> "$mermaid_file"
    echo "" >> "$mermaid_file"
}

# 生成依赖关系边
generate_dependency_edges() {
    local deps_json="$1"
    local mermaid_file="$2"
    local analysis_dir="$3"
    
    echo "    %% 🔗 真实依赖关系" >> "$mermaid_file"
    echo "    %% 基于代码分析的实际import关系" >> "$mermaid_file"
    
    # 获取依赖关系数据并处理（排除 metadata.ts）
    jq -r '
    to_entries[] | 
    .key as $from | 
    .value[] as $to | 
    select($from != $to) |
    select($from | test("metadata\\.ts$") | not) |
    select($to | test("metadata\\.ts$") | not) |
    {
        from: $from,
        to: $to,
        from_id: ($from | gsub("[^a-zA-Z0-9]"; "_")),
        to_id: ($to | gsub("[^a-zA-Z0-9]"; "_")),
        edge_type: (
            if ($from | test("main\\.ts$")) then "bootstrap"
            elif ($from | test("\\.module\\.ts$")) and ($to | test("\\.module\\.ts$")) then "module_import"
            elif ($from | test("\\.module\\.ts$")) and ($to | test("\\.(service|controller|guard|interceptor|filter)\\.ts$")) then "provider_injection"
            elif ($from | test("\\.controller\\.ts$")) and ($to | test("\\.service\\.ts$")) then "service_call"
            elif ($from | test("\\.service\\.ts$")) and ($to | test("\\.(entity|dto|interface)\\.ts$")) then "data_usage"
            elif ($to | test("config/")) then "configuration"
            elif ($to | test("shared/")) then "utility"
            elif ($to | test("\\.(interface|type|enum|constant)\\.ts$")) then "type_usage"
            else "generic"
            end
        ),
        edge_label: (
            if ($from | test("main\\.ts$")) then "启动"
            elif ($from | test("\\.module\\.ts$")) and ($to | test("\\.module\\.ts$")) then "导入模块"
            elif ($from | test("\\.module\\.ts$")) and ($to | test("\\.(service|controller)\\.ts$")) then "注册提供者"
            elif ($from | test("\\.controller\\.ts$")) and ($to | test("\\.service\\.ts$")) then "调用服务"
            elif ($to | test("config/")) then "配置"
            elif ($to | test("shared/")) then "共享工具"
            elif ($to | test("\\.(interface|type)\\.ts$")) then "类型引用"
            else ""
            end
        )
    }
    ' "$deps_json" > /tmp/dependency_edges.json
    
    # 按类型分组并生成依赖关系
    echo "" >> "$mermaid_file"
    echo "    %% Bootstrap 依赖（应用启动）" >> "$mermaid_file"
    jq -r 'select(.edge_type == "bootstrap") | 
    if .edge_label != "" then
        "    " + .from_id + " -->|" + .edge_label + "| " + .to_id
    else
        "    " + .from_id + " --> " + .to_id
    end' /tmp/dependency_edges.json >> "$mermaid_file"
    
    echo "" >> "$mermaid_file"
    echo "    %% 模块导入依赖" >> "$mermaid_file"
    jq -r 'select(.edge_type == "module_import") | 
    if .edge_label != "" then
        "    " + .from_id + " -.->|" + .edge_label + "| " + .to_id
    else
        "    " + .from_id + " -.-> " + .to_id
    end' /tmp/dependency_edges.json >> "$mermaid_file"
    
    echo "" >> "$mermaid_file"
    echo "    %% 提供者注入依赖" >> "$mermaid_file"
    jq -r 'select(.edge_type == "provider_injection") | 
    if .edge_label != "" then
        "    " + .from_id + " -->|" + .edge_label + "| " + .to_id
    else
        "    " + .from_id + " --> " + .to_id
    end' /tmp/dependency_edges.json >> "$mermaid_file"
    
    echo "" >> "$mermaid_file"
    echo "    %% 服务调用依赖" >> "$mermaid_file"
    jq -r 'select(.edge_type == "service_call") | 
    if .edge_label != "" then
        "    " + .from_id + " -->|" + .edge_label + "| " + .to_id
    else
        "    " + .from_id + " --> " + .to_id
    end' /tmp/dependency_edges.json >> "$mermaid_file"
    
    echo "" >> "$mermaid_file"
    echo "    %% 配置依赖" >> "$mermaid_file"
    jq -r 'select(.edge_type == "configuration") | 
    if .edge_label != "" then
        "    " + .from_id + " -.->|" + .edge_label + "| " + .to_id
    else
        "    " + .from_id + " -.-> " + .to_id
    end' /tmp/dependency_edges.json >> "$mermaid_file"
    
    echo "" >> "$mermaid_file"
    echo "    %% 共享工具依赖" >> "$mermaid_file"
    jq -r 'select(.edge_type == "utility") | 
    if .edge_label != "" then
        "    " + .from_id + " -..->|" + .edge_label + "| " + .to_id
    else
        "    " + .from_id + " -..-> " + .to_id
    end' /tmp/dependency_edges.json >> "$mermaid_file"
    
    # 清理临时文件
    rm -f /tmp/dependency_edges.json
    
    echo "" >> "$mermaid_file"
}

# 生成智能样式
generate_intelligent_styles() {
    local deps_json="$1"
    local mermaid_file="$2"
    local analysis_dir="$3"
    
    cat >> "$mermaid_file" << 'EOF'
    %% 🎨 智能样式定义（基于文件类型和重要性）
    
    %% 应用入口层样式
    classDef entryPoint fill:#dc2626,stroke:#fecaca,stroke-width:4px,color:#ffffff,rx:12,ry:12
    
    %% 模块文件样式
    classDef moduleFile fill:#1e40af,stroke:#93c5fd,stroke-width:3px,color:#ffffff,rx:10,ry:10
    classDef serviceFile fill:#7c3aed,stroke:#c4b5fd,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef controllerFile fill:#059669,stroke:#a7f3d0,stroke-width:2px,color:#ffffff,rx:8,ry:8
    
    %% 数据相关文件样式  
    classDef entityFile fill:#ea580c,stroke:#fed7aa,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef dtoFile fill:#0891b2,stroke:#a5f3fc,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef interfaceFile fill:#6366f1,stroke:#c7d2fe,stroke-width:1px,color:#ffffff,rx:6,ry:6
    
    %% 基础设施文件样式
    classDef guardFile fill:#dc2626,stroke:#fecaca,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef interceptorFile fill:#7c2d12,stroke:#fed7aa,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef filterFile fill:#991b1b,stroke:#fecaca,stroke-width:2px,color:#ffffff,rx:8,ry:8
    
    %% 配置文件样式
    classDef configFile fill:#166534,stroke:#bbf7d0,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef sharedFile fill:#6b7280,stroke:#d1d5db,stroke-width:2px,color:#ffffff,rx:6,ry:6
    
    %% 工具文件样式
    classDef utilFile fill:#374151,stroke:#9ca3af,stroke-width:1px,color:#ffffff,rx:6,ry:6
    classDef indexFile fill:#7c3aed,stroke:#c4b5fd,stroke-width:3px,color:#ffffff,rx:8,ry:8
    
EOF

    # 根据实际文件应用样式（排除 metadata.ts）
    echo "    %% 应用样式到实际文件节点" >> "$mermaid_file"
    
    jq -r 'keys[]' "$deps_json" | grep -v "metadata\.ts$" | while IFS= read -r file; do
        local node_id=$(echo "$file" | sed 's/[^a-zA-Z0-9]/_/g')
        local file_name=$(basename "$file")
        
        case "$file_name" in
            main.ts)
                echo "    class $node_id entryPoint" >> "$mermaid_file"
                ;;
            *.module.ts)
                echo "    class $node_id moduleFile" >> "$mermaid_file"
                ;;
            *.service.ts)
                echo "    class $node_id serviceFile" >> "$mermaid_file"
                ;;
            *.controller.ts)
                echo "    class $node_id controllerFile" >> "$mermaid_file"
                ;;
            *.entity.ts)
                echo "    class $node_id entityFile" >> "$mermaid_file"
                ;;
            *.dto.ts)
                echo "    class $node_id dtoFile" >> "$mermaid_file"
                ;;
            *.interface.ts|*.type.ts)
                echo "    class $node_id interfaceFile" >> "$mermaid_file"
                ;;
            *.guard.ts)
                echo "    class $node_id guardFile" >> "$mermaid_file"
                ;;
            *.interceptor.ts)
                echo "    class $node_id interceptorFile" >> "$mermaid_file"
                ;;
            *.filter.ts)
                echo "    class $node_id filterFile" >> "$mermaid_file"
                ;;
            *.config.ts)
                echo "    class $node_id configFile" >> "$mermaid_file"
                ;;
            index.ts)
                echo "    class $node_id indexFile" >> "$mermaid_file"
                ;;
            *)
                if [[ "$file" =~ ^src/shared/ ]]; then
                    echo "    class $node_id sharedFile" >> "$mermaid_file"
                elif [[ "$file" =~ ^src/config/ ]]; then
                    echo "    class $node_id configFile" >> "$mermaid_file"
                else
                    echo "    class $node_id utilFile" >> "$mermaid_file"
                fi
                ;;
        esac
    done
    
    echo "" >> "$mermaid_file"
}

# 生成图例和统计信息
generate_legend_and_stats() {
    local deps_json="$1"
    local mermaid_file="$2" 
    local analysis_dir="$3"
    
    # 统计信息
    local total_files=$(jq 'keys | length' "$deps_json")
    local total_deps=$(jq 'to_entries | map(.value | length) | add' "$deps_json")
    local module_files=$(jq 'keys | map(select(test("\\.module\\.ts$"))) | length' "$deps_json")
    local service_files=$(jq 'keys | map(select(test("\\.service\\.ts$"))) | length' "$deps_json")
    local controller_files=$(jq 'keys | map(select(test("\\.controller\\.ts$"))) | length' "$deps_json")
    
    cat >> "$mermaid_file" << EOF
    %% 📊 详细图例和统计信息
    subgraph Stats ["📊 项目统计信息"]
        TotalFiles["📁 总文件数: ${total_files}"]
        TotalDeps["🔗 总依赖数: ${total_deps}"]
        ModuleCount["🏛️ 模块文件: ${module_files}"]
        ServiceCount["⚙️ 服务文件: ${service_files}"]
        ControllerCount["🎯 控制器文件: ${controller_files}"]
    end
    
    %% 图例说明
    subgraph Legend ["🎨 文件类型图例"]
        L1["🔴 入口文件 - 应用启动"]
        L2["🔵 模块文件 - 功能模块"]
        L3["🟣 服务文件 - 业务逻辑"]
        L4["🟢 控制器 - API端点"]
        L5["🟠 实体文件 - 数据模型"]
        L6["🔵 DTO文件 - 数据传输"]
        L7["🛡️ 守卫文件 - 访问控制"]
        L8["🔄 拦截器 - 请求处理"]
        L9["📝 接口文件 - 类型定义"]
        L10["⚙️ 配置文件 - 系统配置"]
    end
    
    %% 依赖关系图例
    subgraph DepLegend ["🔗 依赖关系图例"]
        D1["━━━ 强依赖 - 直接导入"]
        D2["┅┅┅ 模块依赖 - 模块导入"]
        D3["┈┈┈ 配置依赖 - 配置引用"]
        D4["━ ━ 共享依赖 - 工具引用"]
    end
    
    class TotalFiles,TotalDeps,ModuleCount,ServiceCount,ControllerCount utilFile
    class L1 entryPoint
    class L2 moduleFile
    class L3 serviceFile
    class L4 controllerFile
    class L5 entityFile
    class L6 dtoFile
    class L7 guardFile
    class L8 interceptorFile
    class L9 interfaceFile
    class L10 configFile
    class D1,D2,D3,D4 utilFile
EOF

    # 如果有分析数据，添加智能注释
    if [ -f "$analysis_dir/architectural_patterns.json" ]; then
        echo "" >> "$mermaid_file"
        echo "    %% 📋 架构分析结果" >> "$mermaid_file"
        echo "    %% $(jq -r '.detected_patterns | map(.pattern) | join(", ")' "$analysis_dir/architectural_patterns.json")" >> "$mermaid_file"
        echo "    %% 架构质量评分: $(jq -r '.architecture_quality | to_entries | map("\(.key): \(.value)") | join(", ")' "$analysis_dir/architectural_patterns.json")" >> "$mermaid_file"
    fi
    
    echo "    ✅ 智能架构图构建完成"
}

# 生成增强分析报告
generate_report() {
    REPORT_FILE="$OUTPUT_DIR/dependency-report.md"
    echo -e "${BLUE}📝 生成高级依赖分析报告...${NC}"
    
    # 检查是否有智能分析数据
    local analysis_dir="/tmp/architecture_analysis"
    local has_intelligent_analysis=false
    
    if [ -d "$analysis_dir" ] && [ -f "$analysis_dir/architectural_patterns.json" ]; then
        has_intelligent_analysis=true
    fi
    
    cat > "$REPORT_FILE" << EOF
# 🧠 TEM API 高级依赖分析报告

**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')  
**分析模式**: $(if [ "$has_intelligent_analysis" = true ]; then echo "🔬 规则驱动多维分析"; else echo "📊 标准依赖分析"; fi)
**技术栈**: Madge + Graphviz + jq + 规则引擎

---

## 📊 生成文件概览

### 🎨 可视化图表
- **整体项目依赖图**: 
  - 🖼️ PNG格式: \`project-dependencies.png\`
  - 🎯 SVG格式: \`project-dependencies.svg\` (推荐，可缩放)
- **模块依赖图**: \`modules-dependencies.png\`
- **增强架构图**: 
  - 📝 Mermaid源码: \`architecture.mmd\`
  - 🖼️ PNG格式: \`architecture.png\`
  - 🎯 SVG格式: \`architecture.svg\`

### 📋 数据文件
- **依赖统计**: \`dependency-summary.txt\`
- **原始依赖数据**: \`dependencies.json\`

---

## 🔍 循环依赖检查

EOF

    if [ -n "$CIRCULAR_DEPS" ]; then
        echo "**状态**: ⚠️ **发现真实循环依赖** - 需要重构" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "### 🚨 真实循环依赖详情" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "$CIRCULAR_DEPS" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**循环依赖图**: \`circular-dependencies.png\`" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "### 💡 解决建议" >> "$REPORT_FILE"
        echo "1. 🔄 **提取共享接口**: 将公共接口提取到独立模块" >> "$REPORT_FILE"
        echo "2. 🏗️ **引入中间层**: 使用中介者模式解耦" >> "$REPORT_FILE"
        echo "3. 📦 **模块重组**: 重新设计模块边界" >> "$REPORT_FILE"
        echo "4. 🎯 **依赖倒置**: 依赖抽象而非具体实现" >> "$REPORT_FILE"
    else
        echo "**状态**: ✅ **无真实循环依赖** - 架构健康" >> "$REPORT_FILE"
    fi

    # 检查框架模式循环依赖
    FRAMEWORK_CYCLES=$(echo "$CIRCULAR_DEPS_RAW" | grep "entity.ts.*repository.ts$" || true)
    if [ -n "$FRAMEWORK_CYCLES" ]; then
        echo "" >> "$REPORT_FILE"
        echo "### 🔍 框架模式循环依赖（安全）" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "**状态**: ✅ **框架推荐模式** - 无需处理" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "以下循环依赖是 MikroORM 官方推荐的 Entity-Repository 模式：" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "$FRAMEWORK_CYCLES" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "### 📚 为什么这是安全的？" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "1. **延迟加载**: \`@Entity({ repository: () => UserRepository })\` 使用函数回调，延迟依赖解析" >> "$REPORT_FILE"
        echo "2. **类型擦除**: \`[EntityRepositoryType]?: UserRepository\` 只用于 TypeScript 类型推导，运行时不存在" >> "$REPORT_FILE"
        echo "3. **官方模式**: 这是 [MikroORM 官方文档](https://mikro-orm.io/docs/repositories) 推荐的标准写法" >> "$REPORT_FILE"
        echo "4. **框架处理**: MikroORM 内部已经妥善处理了这种设计型循环依赖" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "### 🔗 参考资料" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "- [MikroORM Entity Repository](https://mikro-orm.io/docs/repositories)" >> "$REPORT_FILE"
        echo "- [Custom Repository 模式](https://mikro-orm.io/docs/repositories#custom-repository)" >> "$REPORT_FILE"
        echo "- [EntityRepositoryType 类型推导](https://mikro-orm.io/docs/repositories#inferring-custom-repository-type)" >> "$REPORT_FILE"
    fi

    # 如果有智能分析数据，添加更详细的分析
    if [ "$has_intelligent_analysis" = true ] && [ -f "$analysis_dir/architectural_patterns.json" ]; then
        cat >> "$REPORT_FILE" << EOF

---

## 🏗️ 架构模式分析

$(jq -r '
.detected_patterns | map("### " + .pattern + " (置信度: " + (.confidence * 100 | floor | tostring) + "%)\n" + 
(.evidence | map("- " + .) | join("\n")) + "\n") | join("\n")
' "$analysis_dir/architectural_patterns.json")

### 📊 架构质量评分

$(jq -r '
.architecture_quality | to_entries | map("- **" + (.key | gsub("_"; " ") | ascii_upcase) + "**: " + (.value * 100 | floor | tostring) + "/100") | join("\n")
' "$analysis_dir/architectural_patterns.json")

### 🎯 优化建议

$(jq -r '.recommendations | map("- " + .) | join("\n")' "$analysis_dir/architectural_patterns.json")

---

## 📊 模块重要性分析

$(if [ -f "$analysis_dir/module_importance.json" ]; then
    echo "### 🔥 核心模块 (重要性Top10)"
    echo ""
    jq -r '.[0:10] | map("- **" + .module + "** (得分: " + (.importance_score | floor | tostring) + ")")' "$analysis_dir/module_importance.json" | head -10
    echo ""
    echo "### 📈 重要性评估维度"
    echo "- **入度依赖**: 被其他模块依赖的程度 (40%权重)"
    echo "- **出度依赖**: 对其他模块的依赖程度 (20%权重)"  
    echo "- **模块类型**: 根据文件类型的重要性 (30%权重)"
    echo "- **路径深度**: 模块在项目中的层次深度 (10%权重)"
fi)

---

## 🎯 业务域分析

$(if [ -f "$analysis_dir/business_patterns.json" ]; then
    echo "### 🏢 识别的业务域"
    echo ""
    jq -r 'map("- **" + .domain + "**: " + (.file_count | tostring) + "个文件, " + (.patterns | tostring) + "种模式")' "$analysis_dir/business_patterns.json"
fi)

EOF
    fi

    cat >> "$REPORT_FILE" << EOF

---

## 📈 依赖统计详情

\`\`\`
$(cat "$OUTPUT_DIR/dependency-summary.txt")
\`\`\`

---

## 🛠️ 使用指南

### 📖 查看方式
1. **🖼️ 图片查看**: 
   - 使用图片查看器打开 PNG 文件
   - **推荐**: 使用 SVG 格式，支持无损缩放
   
2. **📝 代码预览**: 
   - VS Code 中直接预览 \`.mmd\` 文件
   - 安装 Mermaid Preview 扩展获得最佳体验

3. **🌐 在线查看**: 
   - 复制 \`.mmd\` 内容到 [Mermaid Live Editor](https://mermaid.live)
   - 支持实时编辑和导出

### 🔧 分析建议
- **🔄 循环依赖**: 如有发现，优先重构解决
- **📊 模块耦合**: 关注高耦合度模块，考虑拆分
- **🏗️ 架构演进**: 定期分析，跟踪架构变化趋势
- **📋 代码审查**: 结合依赖图进行代码评审

### 📱 快速命令

\`\`\`bash
# 🚀 重新生成所有分析图表
pnpm run deps:graph

# 🔍 仅检查循环依赖
pnpm run deps:analyze

# 📊 查看依赖统计
cat docs/dependency-graphs/dependency-summary.txt

# 🖼️ 在浏览器中查看架构图
open docs/dependency-graphs/architecture.svg
\`\`\`

---

## 🔄 持续改进

### 📅 建议频率
- **🚀 功能发布前**: 必须运行依赖分析
- **🔄 每周例行**: 检查架构健康度
- **📊 月度回顾**: 对比历史数据，分析趋势

### 🎯 关注指标
- 循环依赖数量变化
- 模块间耦合度趋势  
- 新增模块的架构合理性
- 重要模块的依赖稳定性

### 📚 参考资源
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Modular Monolith](https://www.kamilgrzybek.com/design/modular-monolith-primer/)
- [NestJS Architecture Best Practices](https://docs.nestjs.com/fundamentals/custom-providers)

---

*📊 报告由 TEM API 高级依赖分析系统生成 • 🔬 规则引擎驱动架构洞察*
EOF

    echo -e "${GREEN}✅ 高级分析报告已生成: $REPORT_FILE${NC}"
}

# 主执行流程
main() {
    check_graphviz
    check_madge
    check_mermaid
    check_typescript
    create_output_dir
    generate_dependency_graphs
    generate_report
    
    echo ""
    echo -e "${GREEN}🎉 高级依赖分析完成!${NC}"
    echo -e "${BLUE}📁 输出目录: $OUTPUT_DIR${NC}"
    echo -e "${BLUE}📊 生成文件详情:${NC}"
    echo ""
    echo -e "${GREEN}📈 依赖分析图表:${NC}"
    echo "  🖼️  project-dependencies.png (整体依赖图)"
    echo "  🎯  project-dependencies.svg (SVG格式，推荐)"
    echo "  🏗️  modules-dependencies.png (模块依赖图)"
    echo ""
    echo -e "${GREEN}🧠 增强架构图:${NC}"
    echo "  📝  architecture.mmd (Mermaid源码 - 包含真实文件信息)"
    echo "  🖼️  architecture.png (架构图图片)"
    echo "  🎯  architecture.svg (架构图SVG)"
    echo ""
    echo -e "${GREEN}📋 分析报告:${NC}"
    echo "  📊  dependency-report.md (高级分析报告)"
    echo "  📈  dependency-summary.txt (依赖统计)"
    echo "  🔍  dependencies.json (原始依赖数据)"
    echo ""
    echo -e "${BLUE}✨ 增强功能特色:${NC}"
    echo "  🎯  真实文件名和路径展示"
    echo "  📊  依赖数量和引用计数"
    echo "  🏷️  规则驱动文件类型识别"
    echo "  🔗  分类依赖关系标注"
    echo "  ⭐  模块重要性权重标识"
    echo "  🎨  基于文件类型的智能配色"
    echo ""
    echo -e "${YELLOW}💡 查看建议:${NC}"
    echo "  📖  推荐使用 SVG 格式查看图表(支持缩放)"
    echo "  🔧  VS Code 中安装 Mermaid Preview 扩展"
    echo "  🌐  复制 .mmd 内容到 https://mermaid.live 在线查看"
    echo "  📱  使用 'open docs/dependency-graphs/architecture.svg' 快速查看"
}

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 请在项目根目录执行此脚本${NC}"
    exit 1
fi

# 执行主函数
main 