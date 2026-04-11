#!/bin/bash

# ========================================================
# 自动化数据处理与传输 Pipeline
# 用法: ./run_pipeline.sh [目标IP]
# 示例: ./run_pipeline.sh 192.168.1.100
# ========================================================

set -e

# 固定到脚本所在目录执行，避免从不同 cwd 调用时路径失效
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- 颜色定义 ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# --- 辅助函数：打印日志 ---
log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_err()  { echo -e "${RED}[ERROR] $1${NC}"; }

# ========================================================
# 0. 预检查与配置
# ========================================================

TARGET_IP="$1"
if [ -z "$TARGET_IP" ]; then
    log_warn "未检测到命令行 IP 参数。"
    read -p "请输入远程服务器 IP 地址: " TARGET_IP
fi

if [ -z "$TARGET_IP" ]; then
    log_err "IP 地址不能为空，脚本退出。"
    exit 1
fi

log_info "目标 IP 已设置为: $TARGET_IP"
log_info "当前工作目录: $SCRIPT_DIR"

for cmd in python3 node npm scp ssh; do
    if ! command -v "$cmd" &> /dev/null; then
        log_err "$cmd 未安装，请先安装相关环境。"
        exit 1
    fi
done

if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
    log_err "curl 或 wget 至少需要一个用于下载数据。"
    exit 1
fi

if ! python3 -m pip --version &> /dev/null; then
    log_err "python3 -m pip 不可用，请先安装 pip。"
    exit 1
fi

# ========================================================
# 1. 安装依赖库
# ========================================================
echo ""
log_info ">>> Step 1: 检查并安装依赖库"

echo "正在检查 Python 依赖..."
if [ -f "./dataTransfer/requirements.txt" ]; then
    python3 -m pip install -r ./dataTransfer/requirements.txt
else
    log_warn "未找到 requirements.txt，正在安装通用依赖 (pandas, pyarrow)..."
    python3 -m pip install pandas pyarrow fastparquet || log_warn "部分 Python 库安装失败，如果脚本报错请手动检查"
fi

echo "正在检查 Node.js 依赖..."
if [ -f "./package.json" ]; then
    npm install
else
    log_warn "未找到 package.json，正在安装常用脚本依赖..."
    npm install fs-extra ngraph.graph ngraph.offline.layout cli-progress JSONStream through2
fi

# ========================================================
# 2. 准备环境并下载数据
# ========================================================
echo ""
log_info ">>> Step 2: 下载数据"

DATA_DIR="./dataTransfer"
mkdir -p "$DATA_DIR"

TARGET_URL="https://huggingface.co/datasets/cfahlgren1/hub-stats/resolve/refs%2Fconvert%2Fparquet/models/train/0000.parquet"
OUTPUT_FILE="$DATA_DIR/data.parquet"

if [ -f "$OUTPUT_FILE" ]; then
    log_warn "文件已存在，跳过下载 (如需重新下载请先删除 $OUTPUT_FILE)"
else
    echo "正在从 Hugging Face 下载..."
    if command -v wget &> /dev/null; then
        wget -O "$OUTPUT_FILE" "$TARGET_URL"
    else
        curl -L -o "$OUTPUT_FILE" "$TARGET_URL"
    fi
fi

# ========================================================
# 3. 运行 Python 清洗脚本
# ========================================================
echo ""
log_info ">>> Step 3: Python 数据清洗"

if [ ! -f "$DATA_DIR/convert.py" ] || [ ! -f "$DATA_DIR/transfer.py" ]; then
    log_err "Python 脚本文件缺失 (convert.py 或 transfer.py)"
    exit 1
fi

(
    cd "$DATA_DIR"
    echo "Running transfer.py..."
    python3 ./transfer.py

    echo "Running convert.py..."
    python3 ./convert.py
)

echo "正在同步 output_graph.json..."
if [ -f "$DATA_DIR/output_graph.json" ]; then
    cp "$DATA_DIR/output_graph.json" ./output_graph.json
    log_info "文件同步成功: dataTransfer/output_graph.json -> ./output_graph.json"
else
    log_err "未找到 output_graph.json，Python 脚本可能执行失败。"
    exit 1
fi

# ========================================================
# 4. 运行 Node.js 处理脚本
# ========================================================
echo ""
log_info ">>> Step 4: Node.js 图算法处理"

NODE_OPTS="--max-old-space-size=8192"

log_info "Running filter_isolated_nodes.js..."
node $NODE_OPTS ./filter_isolated_nodes.js

log_info "Running convert_script.js..."
node $NODE_OPTS ./convert_script.js

log_info "Running convert_scropt2.js..."
if [ -f "./convert_scropt2.js" ]; then
    node $NODE_OPTS ./convert_scropt2.js
elif [ -f "./convert_script2.js" ]; then
    node $NODE_OPTS ./convert_script2.js
else
    log_warn "未找到 convert_scropt2.js 或 convert_script2.js，跳过该步骤。"
fi

# ========================================================
# 5. 上传数据 (SCP)
# ========================================================
echo ""
log_info ">>> Step 5: 部署数据到服务器 ($TARGET_IP)"

SOURCE_DIR="./galaxy_output_data"
REMOTE_DIR="/var/www/galaxy_data/my_model_galaxy/"

if [ -d "$SOURCE_DIR" ]; then
    echo "正在上传..."
    ssh "$TARGET_IP" "mkdir -p $REMOTE_DIR"
    scp -r "$SOURCE_DIR"/* "$TARGET_IP:$REMOTE_DIR"
    log_info "上传成功！"
else
    log_err "源目录不存在: $SOURCE_DIR，无法上传。"
    exit 1
fi

echo ""
log_info "==========================================="
log_info ">>> ✅ 全部流程执行完毕！"
log_info "==========================================="
