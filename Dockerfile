# 1. 使用 Node 12
FROM node:12-buster

WORKDIR /app

# 2. 安装依赖
COPY package.json ./
RUN npm install

# 3. 复制源码并构建
COPY . .
RUN npm run build

# --- 【修复部分】 ---

# A. 修复 sigma 找不到的问题
# 1. 把 src/vendor 下的所有 js 拷贝到 build 根目录
RUN cp src/vendor/*.js build/
# 2. 强行修改 index.html，把 src="sigma..." 替换为绝对路径 src="/sigma..."
RUN sed -i 's|src="sigma|src="/sigma|g' build/index.html

# B. 修复样式丢失
RUN cp -r src/styles build/styles

# C. 准备数据目录 (数据会由 GitHub Action 下载并拷进来)
# 这一步确保目录存在，防止拷贝失败
RUN mkdir -p build/data

# D. 复制下载好的数据 (从 hf-data 到 build/data)
COPY hf-data/galaxy_output_data build/data/my_model_galaxy

# --- 调试：列出文件确保都在 (构建日志里能看到) ---
RUN ls -R build

# 4. 安装 serve
RUN npm install -g serve@13

EXPOSE 7860
# 启动时开启 CORS 支持，虽然同源可能不需要，但加上保险
CMD ["serve", "-s", "build", "-l", "7860", "--cors"]