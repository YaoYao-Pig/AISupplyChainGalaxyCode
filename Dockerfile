# 1. 使用 Node.js 12 (兼容旧版 Webpack)
FROM node:12-buster

WORKDIR /app

# 2. 复制依赖并安装
COPY package.json ./
RUN npm install

# 3. 复制所有源码
COPY . .

# 4. 构建项目 (这步会生成 build 文件夹，但只包含 index.html 和 bundle.js)
RUN npm run build

# --- 【修复核心开始】手动补全缺失文件 ---

# 修复 1: 复制 vendor 文件夹 (解决 sigma 报错)
# 假设 index.html 里写的是 src="vendor/..."，所以我们把它拷到 build/vendor
RUN cp -r src/vendor build/vendor

# 修复 2: 复制 styles 文件夹 (防止部分 CSS 丢失)
# 有些项目会在 JS 里动态引用 styles 下的资源
RUN cp -r src/styles build/styles

# 修复 3: 如果你有本地数据 (比如 hf-data)，也需要拷进去
# 如果你的 config.js 是读远程 URL，这步可以跳过；如果是读本地 json，必须拷！
# RUN cp -r hf-data build/data 

# --- 【修复核心结束】 ---

# 5. 安装兼容的 serve 版本
RUN npm install -g serve@13

EXPOSE 7860

# 6. 启动服务
CMD ["serve", "-s", "build", "-l", "7860"]