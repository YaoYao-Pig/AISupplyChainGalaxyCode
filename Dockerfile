# 1. 使用 Node.js 12 以兼容 Webpack 1.x 和旧版 React
FROM node:12-buster

# 设置工作目录
WORKDIR /app

# 2. 复制依赖文件
COPY package.json ./

# 3. 安装依赖
# 由于依赖较老，这里不使用 ci 或 lock 文件，直接 install
RUN npm install

# 4. 复制所有源代码
COPY . .

# 5. 构建项目
# 这一步会根据 package.json 里的 build 脚本生成 ./build 文件夹
RUN npm run build

# 6. 安装一个简单的静态文件服务器
RUN npm install -g serve

# 7. 暴露 Hugging Face 要求的 7860 端口
EXPOSE 7860

# 8. 启动服务，指向 build 目录
CMD ["serve", "-s", "build", "-l", "7860"]