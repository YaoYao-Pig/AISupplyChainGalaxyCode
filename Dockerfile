# 1. 使用 Node 12
FROM node:12-buster

WORKDIR /app

# 2. 安装依赖
COPY package.json ./
RUN npm install

# 3. 复制源码并构建
COPY . .
RUN npm run build

# --- 【核心修复区】 ---

# A. 修复 JS 路径
RUN cp src/vendor/*.js build/
# 强制 Base URL 为根目录
RUN sed -i 's|<head>|<head><base href="/">|g' build/index.html

# B. 修复样式
RUN cp -r src/styles build/styles

# C. 复制数据
RUN mkdir -p build/data
# 【关键修改】hf-data/my_model_galaxy 是上一步 scp 下来的文件夹
# 我们把它拷贝到 build/data/my_model_galaxy
COPY hf-data/my_model_galaxy build/data/my_model_galaxy

# D. 【构建自检】确保 manifest.json 真的存在！
# 如果这一步报错 (No such file)，说明数据没拷对，构建会直接失败，方便排查
RUN ls -lh build/data/my_model_galaxy/manifest.json

# --------------------

# 4. 安装 Web Server
RUN npm install -g serve@13

EXPOSE 7860
CMD ["serve", "-s", "build", "-l", "7860", "--cors"]