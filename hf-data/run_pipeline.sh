#!/bin/bash

# 遇到错误立即停止脚本 (Exit immediately if a command exits with a non-zero status)
set -e

echo "==========================================="
echo ">>> Step 1: 准备环境并下载数据"
echo "==========================================="

# 1. 创建文件夹 (如果不存在)
mkdir -p ./dataTransfer

# 2. 下载文件
# 注意：已将 URL 中的 /tree/ 替换为 /resolve/ 以便直接下载
# 注意：已将输入中的 .paraquet 修正为 .parquet
TARGET_URL="https://huggingface.co/datasets/cfahlgren1/hub-stats/resolve/refs%2Fconvert%2Fparquet/models/train/0000.parquet"
OUTPUT_FILE="./dataTransfer/0000.parquet"

echo "正在从 Hugging Face 下载数据..."
# 检查是否安装了 wget，如果没有则尝试使用 curl
if command -v wget &> /dev/null; then
    wget -O "$OUTPUT_FILE" "$TARGET_URL"
else
    echo "wget 未找到，尝试使用 curl..."
    curl -L -o "$OUTPUT_FILE" "$TARGET_URL"
fi

echo "下载完成: $OUTPUT_FILE"


echo "==========================================="
echo ">>> Step 2: 运行 Python 清洗脚本"
echo "==========================================="

# 运行 convert.py (假设你需要 python3，如果你的环境是 python 请自行修改)
echo "运行 convert.py..."
python ./dataTransfer/convert.py

# 运行 transfer.py
echo "运行 transfer.py (初步清洗)..."
python ./dataTransfer/transfer.py

echo "正在将 output_graph.json 移动到上一级目录..."
if [ -f "output_graph.json" ]; then
    mv output_graph.json ../
    echo "移动成功: output_graph.json -> ../"
else
    echo "错误: 当前目录下未找到 output_graph.json，无法移动。"
    exit 1
fi

echo "==========================================="
echo ">>> Step 3: 运行 Node.js 处理脚本"
echo "==========================================="

# 依次运行 node 脚本
echo "运行 fiter_isolated_node.js..."
node fiter_isolated_node.js

echo "运行 convert_script.js..."
node convert_script.js

echo "运行 convert_scropt2.js..."
node convert_scropt2.js

echo "==========================================="
echo ">>> 全部流程执行完毕！"
echo "==========================================="