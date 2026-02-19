# 核心接口与 API 参考
Galaxy Graph Visualization Engine: Core Interfaces & API Reference
本文档详细描述了系统中各核心模块向外暴露的 API 接口与状态控制方法，供开发者进行二次开发与功能扩展。
This document details the API interfaces and state control methods exposed by the core modules of the system, intended for developers extending the application.

1. 运行时脚本接口 | Runtime Scripting API (src/galaxy/runtime/)
运行时模块提供了一系列命令式的方法，允许外部逻辑直接操作图的渲染状态、高亮逻辑及摄像机漫游。
The runtime module provides imperative methods allowing external logic to directly manipulate graph rendering states, highlight logic, and camera roaming.

1.1 clientRuntime.js
这是暴露给全局或控制台的核心运行时对象。
This is the core runtime object exposed to the global scope or console.

highlight(nodeId)

描述 (Description): 高亮指定的节点及其直接相连的邻居节点（Ego Graph），同时暗化背景中不相关的节点。

Highlights the specified node and its immediate neighbors (Ego Graph), while dimming unrelated nodes in the background.

参数 (Parameters): nodeId (String/Number) - 目标节点的唯一标识符。

search(query)

描述 (Description): 触发全局搜索，查找匹配 query 的节点，并自动将摄像机平移至得分最高的匹配节点。

Triggers a global search for nodes matching query, automatically panning the camera to the highest-scoring match.

参数 (Parameters): query (String) - 搜索关键字。

showLinks(sourceId, targetId)

描述 (Description): 在两个节点之间计算并渲染最短路径或依赖链路。

Calculates and renders the shortest path or dependency links between two nodes.

参数 (Parameters): sourceId (String), targetId (String)。

2. 状态管理接口 | State Management API (src/galaxy/store/)
本项目基于响应式状态管理（RxJS/Event-driven 模式），通过监听与触发事件来同步 UI 与 WebGL 视图。
This project relies on reactive state management (RxJS/Event-driven patterns), synchronizing the UI and WebGL views by listening to and triggering events.

2.1 sceneStore.js (场景状态 | Scene State)
getSceneState()

返回 (Returns): 返回当前摄像机的位置、缩放级别及视区矩阵。

Returns the current camera position, zoom level, and viewport matrix.

lookAt(x, y, z, duration)

描述 (Description): 平滑过渡摄像机视角至指定坐标。

Smoothly transitions the camera view to the specified coordinates.

2.2 hover.js (悬停交互 | Hover Interaction)
setHovered(nodeId)

描述 (Description): 设置当前鼠标悬停的节点，触发 hoverInfo.jsx 组件的更新及 WebGL 层的节点放大效果。

Sets the currently hovered node, triggering the update of the hoverInfo.jsx component and the node enlargement effect in the WebGL layer.

3. 数据服务接口 | Data Service API (src/galaxy/service/)
3.1 graphLoader.js
负责从指定 URL 抓取点集（Positions）、连接关系（Links）及元数据（Metadata）。
Responsible for fetching node positions, links, and metadata from specified URLs.

loadGraph(manifestUrl)

返回 (Returns): Promise<GraphModel>

描述 (Description): 解析图数据配置清单，初始化图引擎数据结构。

Parses the graph data manifest and initializes the graph engine data structure.

文件名称：Configuration_Extension.md (配置与扩展指南)
星系图可视化引擎：配置与扩展指南
Galaxy Graph Visualization Engine: Configuration & Extension Guide
1. 全局配置 | Global Configuration (src/config.js & src/galaxy/native/appConfig.js)
系统通过集中化的配置文件管理图谱的载入路径、物理引擎参数及界面语言。
The system manages graph load paths, physics engine parameters, and interface languages through centralized configuration files.

图数据源配置 (Graph Data Source Configuration)
在 config.js 中，可以定义默认加载的星系数据名称及后端 API 端点。
In config.js, you can define the default galaxy data name to load and backend API endpoints.

JavaScript
// 示例/Example
export default {
  dataUrl: 'https://data.example.com/graphs/',
  defaultGraph: 'npm-dependencies'
};
渲染参数 (Rendering Parameters)
appConfig.js 控制了 WebGL 渲染的点大小、边的透明度及摄像机阻尼系数。
appConfig.js controls WebGL rendering node sizes, edge opacity, and camera damping coefficients.

2. 扩展节点详情模板 | Extending Node Details Templates (src/galaxy/nodeDetails/templates/)
当接入新的图数据类型（如新增 Docker 镜像生态图）时，需要为其编写专门的侧边栏详情模板。
When integrating new graph data types (e.g., adding a Docker image ecosystem graph), you must write a dedicated sidebar details template for it.

开发步骤 (Development Steps):

在 templates/ 目录下新建 docker.jsx。
Create docker.jsx in the templates/ directory.

继承 commonPackageTemplate.jsx 或直接编写 React 组件，定义属性展示（如拉取次数、镜像大小）。
Inherit from commonPackageTemplate.jsx or write a React component directly, defining attribute displays (like pull counts, image size).

在 all.js 注册中心中导出该模板，并与数据字典中的 type 字段进行映射。
Export the template in the all.js registry and map it to the type field in the data dictionary.

3. 注册新浮动视窗 | Registering New Floating Windows (src/galaxy/windows/)
系统采用基于 DraggableWindow.jsx 的统一窗体管理器。若需新增分析工具（如：中心度计算面板）：
The system uses a unified window manager based on DraggableWindow.jsx. To add a new analysis tool (e.g., Centrality Calculation Panel):

创建视图模型 (CentralityViewModel.js) 处理计算逻辑。
Create a view model (CentralityViewModel.js) to handle calculation logic.

创建视图组件 (CentralityWindow.jsx) 编写 UI。
Create a view component (CentralityWindow.jsx) to write the UI.

在 windowCollectionModel.js 中注册触发该窗口开启的事件枚举。
Register the event enumeration that triggers the opening of this window in windowCollectionModel.js.

文件名称：Deployment_Guide.md (构建与部署指南)
星系图可视化引擎：构建与部署
Galaxy Graph Visualization Engine: Build & Deployment
1. 环境依赖 | Environment Requirements
Node.js: >= 14.x.x

包管理器 (Package Manager): npm 或 yarn

浏览器兼容性 (Browser Compatibility): 支持 WebGL 1.0/2.0 的现代浏览器 (Chrome, Firefox, Safari, Edge)。

2. 构建指令 | Build Commands
进入项目根目录，执行以下命令：
Navigate to the project root and execute the following commands:

Bash
# 1. 安装项目依赖 | Install project dependencies
npm install

# 2. 启动本地开发服务器 | Start local development server
# 默认通常运行在 http://localhost:8080 (取决于构建工具如 Webpack/Vite)
npm run start

# 3. 生产环境编译 | Production build
# 编译产物将被输出至 /dist 目录
npm run build
3. 图数据格式要求 | Graph Data Format Requirements
引擎期望获取高度优化的二进制或紧凑型 JSON 格式数据。标准图数据文件夹通常需包含以下内容：
The engine expects highly optimized binary or compact JSON formatted data. A standard graph data folder typically must contain:

manifest.json: 记录节点总数、坐标边界及文件分片信息。
Records total node count, coordinate boundaries, and file chunk information.

positions.bin / positions.json: 三维空间坐标 (x, y, z)。
3D spatial coordinates (x, y, z).

links.bin: 边的拓扑关系。
Edge topological relationships.

labels.json: 节点的文本名称与基础属性，用于搜索与详情展示。
Node text names and basic attributes, used for searching and detail displays.

(注：数据预处理通常需借助离线图布局算法如 ForceAtlas2 提前计算完成，渲染引擎主要负责呈现与交互。)
(Note: Data preprocessing usually requires pre-calculation using offline graph layout algorithms like ForceAtlas2; the rendering engine is primarily responsible for presentation and interaction.)