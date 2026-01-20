# 1. 使用 Node.js 12 以兼容 Webpack 1.x 和旧版 React
FROM node:12-buster

# 设置工作目录
WORKDIR /app

# 2. 复制依赖文件
COPY package.json ./

# 3. 安装依赖
RUN npm install

# 4. 复制所有源代码
COPY . .

# 5. 构建项目
RUN npm run build

# 6. 【关键修改】安装指定版本的 serve (v13 兼容 Node 12)
RUN npm install -g serve@13

# 7. 暴露 Hugging Face 要求的 7860 端口
EXPOSE 7860

# 8. 启动服务
CMD ["serve", "-s", "build", "-l", "7860"]