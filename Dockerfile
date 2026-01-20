# 1. 使用 Node 12
FROM node:12-buster

WORKDIR /app

# 2. 安装依赖
COPY package.json ./
RUN npm install

# 3. 复制源码并构建
COPY . .
RUN npm run build

# --- 【修复核心】调整文件位置 ---

# 修复 1: Sigma 报错
# index.html 引用的是根目录的 sigma.min.js，所以我们要把 vendor 里的 js 拷到 build 根目录
RUN cp src/vendor/*.js build/

# 修复 2: Styles 样式
# 防止样式文件丢失
RUN cp -r src/styles build/styles

# 修复 3: 数据路径 mismatch
# 前端请求的是 "data/my_model_galaxy/manifest.json"
# 所以我们需要把数据多包一层目录，放在 build/data/my_model_galaxy 下
COPY hf-data/galaxy_output_data build/data/my_model_galaxy

# ----------------------------

# 4. 安装兼容版 serve
RUN npm install -g serve@13

EXPOSE 7860
CMD ["serve", "-s", "build", "-l", "7860"]