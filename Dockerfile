# 1. 使用 Node 12 兼容老项目
FROM node:12-buster

WORKDIR /app

# 2. 安装依赖
COPY package.json ./
RUN npm install

# 3. 复制源码并构建
COPY . .
RUN npm run build

# --- 关键修改 ---

# 4.1 补全静态资源
RUN cp -r src/vendor build/vendor
RUN cp -r src/styles build/styles

# 4.2 【核心】将数据复制到网站目录
# GitHub Action 会先把数据下载到 hf-data 文件夹，这里我们把它拷进 build/data
COPY hf-data/galaxy_output_data build/data

# --- 修改结束 ---

# 5. 安装兼容版 serve
RUN npm install -g serve@13

EXPOSE 7860
CMD ["serve", "-s", "build", "-l", "7860"]