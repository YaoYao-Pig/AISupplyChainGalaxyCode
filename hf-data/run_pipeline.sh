#!/bin/bash

# ========================================================
# 自动化数据处理与传输 Pipeline
# 用法: ./pipeline.sh [目标IP]
# 示例: ./pipeline.sh 192.168.1.100
# ========================================================

# 遇到错误立即停止
set -e

# --- 颜色定义 ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- 辅助函数：打印日志 ---
log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_err()  { echo -e "${RED}[ERROR] $1${NC}"; }

# ========================================================
# 0. 预检查与配置
# ========================================================

# 检查 IP 输入
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

# 检查必要工具
for cmd in python3 node npm scp; do
    if ! command -v $cmd &> /dev/null; then
        log_err "$cmd 未安装，请先安装相关环境。"
        exit 1
    fi
done

# ========================================================
# 1. 安装依赖库
# ========================================================
echo ""
log_info ">>> Step 1: 检查并安装依赖库"

# --- Python 依赖 ---
# 既然处理 .parquet 文件，通常需要 pandas 和 pyarrow
echo "正在检查 Python 依赖..."
if [ -f "./dataTransfer/requirements.txt" ]; then
    pip install -r ./dataTransfer/requirements.txt
else
    log_warn "未找到 requirements.txt，正在安装通用依赖 (pandas, pyarrow)..."
    pip install pandas pyarrow fastparquet || log_warn "部分 Python 库安装失败，如果脚本报错请手动检查"
fi

# --- Node.js 依赖 ---
echo "正在检查 Node.js 依赖..."
# 如果有 package.json 则使用 install，否则手动安装你在上个脚本中用到的库
if [ -f "package.json" ]; then
    npm install
else
    log_warn "未找到 package.json，正在安装常用脚本依赖..."
    # 根据你上一个问题，这些是核心依赖
    npm install fs-extra ngraph.graph ngraph.offline.layout cli-progress JSONStream through2
fi

# ========================================================
# 2. 准备环境并下载数据
# ========================================================
echo ""
log_info ">>> Step 2: 下载数据"

mkdir -p ./dataTransfer

TARGET_URL="https://huggingface.co/datasets/cfahlgren1/hub-stats/resolve/refs%2Fconvert%2Fparquet/models/train/0000.parquet"
OUTPUT_FILE="./dataTransfer/0000.parquet"

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

# 确保脚本存在
if [ ! -f "./dataTransfer/convert.py" ] || [ ! -f "./dataTransfer/transfer.py" ]; then
    log_err "Python 脚本文件缺失 (convert.py 或 transfer.py)"
    exit 1
fi

echo "Running convert.py..."
python3 ./dataTransfer/convert.py

echo "Running transfer.py..."
python3 ./dataTransfer/transfer.py

# 移动文件的逻辑
echo "正在移动 output_graph.json..."
if [ -f "output_graph.json" ]; then
    mv output_graph.json ../
    log_info "文件移动成功: output_graph.json -> ../"
elif [ -f "./dataTransfer/output_graph.json" ]; then
    # 兼容性处理：有时脚本生成的路径可能在子目录
    mv ./dataTransfer/output_graph.json ../
    log_info "文件从子目录移动成功: output_graph.json -> ../"
else
    log_err "未找到 output_graph.json，Python 脚本可能执行失败。"
    exit 1
fi

# ========================================================
# 4. 运行 Node.js 处理脚本
# ========================================================
echo ""
log_info ">>> Step 4: Node.js 图算法处理"

# 增加内存限制以防大数据溢出
NODE_OPTS="--max-old-space-size=8192"

log_info "Running filter_isolated_nodes.js..."
node $NODE_OPTS ./filter_isolated_nodes.js

log_info "Running convert_script.js..."
node $NODE_OPTS convert_script.js

log_info "Running convert_scropt2.js..." 
# 注意：保留了你原文件名的拼写 (scropt2)，如果文件名已修正请同步修改此处
if [ -f "convert_scropt2.js" ]; then
    node $NODE_OPTS convert_scropt2.js
elif [ -f "convert_script2.js" ]; then
    node $NODE_OPTS convert_script2.js
else
    log_warn "未找到 convert_scropt2.js 或 convert_script2.js，跳过该步骤。"
fi

# ========================================================
# 5. 上传数据 (SCP)
# ========================================================
echo ""
log_info ">>> Step 5: 部署数据到服务器 ($TARGET_IP)"

SOURCE_DIR="./hf-data/galaxy_output_data"
REMOTE_DIR="/var/www/galaxy_data/my_model_galaxy/"

if [ -d "$SOURCE_DIR" ]; then
    echo "正在上传..."
    # 确保远程目录存在 (可选，如果不确定远程目录是否存在)
    ssh "$TARGET_IP" "mkdir -p $REMOTE_DIR"
    
    # 递归复制内容
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