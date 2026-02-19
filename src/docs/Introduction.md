# Model Galaxy可视化引擎技术与使用文档 | Model Galaxy Visualization Engine Documentation
1. 项目概述 | Project Overview
本项目是一个基于 Web 技术的复杂网络与图数据可视化引擎。它通过交互式的“星系”隐喻，将节点（如开源软件包、开发者、或系统组件）映射在多维空间中，支持大规模图数据的流畅渲染、路径漫游、节点检索及详细信息展示。

This project is a web-based complex network and graph data visualization engine. Using an interactive "galaxy" metaphor, it maps nodes (such as open-source packages, developers, or system components) in a multidimensional space, supporting smooth rendering of large-scale graph data, pathfinding navigation, node retrieval, and detailed information display.

2. 架构与技术栈 | Architecture & Tech Stack
系统采用前后端分离的现代化前端架构，核心视图层与数据状态流解耦，保障了复杂图形计算与界面交互的性能。

The system adopts a modern front-end architecture with decoupled view layers and data state flows, ensuring performance for complex graphical computations and UI interactions.

前端框架 (Frontend Framework): React (JSX)

样式预处理器 (Style Preprocessor): Less

核心渲染 (Core Rendering): 原生 WebGL / Canvas (封装于 native/renderer.js)

图布局辅助 (Graph Layout Assist): Sigma.js (包含 ForceAtlas2 算法)

状态管理 (State Management): 自定义基于事件监听的 Store 架构 (位于 store/ 目录)

3. 核心目录结构 | Core Directory Structure
项目根目录 src 下的结构按照功能模块进行严格划分：
The src root directory is strictly organized by functional modules:

Plaintext
src/
├── index.html / main.jsx      # 应用入口与全局挂载点 | Application entry points
├── config.js                  # 全局配置参数 | Global configuration parameters
├── styles/                    # 全局样式与变量设定 | Global styles and variables (Less)
├── vendor/                    # 第三方依赖 (如 Sigma.js) | Third-party dependencies
├── galaxy/                    # 核心业务逻辑与视图 | Core business logic and views
│   ├── native/                # 底层渲染与物理交互引擎 | Low-level rendering & interaction engine
│   ├── service/               # 网络请求与图数据解析 | Network requests & graph parsing
│   ├── store/                 # 响应式状态管理 | Reactive state management
│   ├── search/                # 搜索模块 | Search module
│   ├── nodeDetails/           # 节点详情面板与多语言模板 | Node details & templates
│   ├── windows/               # 浮动视窗组件 (如合规风险、路径规划) | Floating UI windows
│   └── utils/                 # 工具函数 (格式化、多语言化) | Utility functions (I18n, formatting)
4. 核心模块与技术接口 | Core Modules & Technical API
4.1 渲染引擎模块 | Rendering Engine Module (src/galaxy/native/)
此模块负责所有图形的绘制、平移、缩放以及设备输入事件的捕获。
This module handles all graphics drawing, panning, zooming, and device input capture.

renderer.js: 核心渲染循环管理器。接管 Canvas/WebGL 的上下文，负责图节点和边的帧渲染。

Core rendering loop manager. Takes over Canvas/WebGL context, handles frame rendering of nodes and edges.

joystick.js & touchControl.js: 虚拟摇杆与触控手势控制器，处理移动端或触摸屏的复杂交互。

Virtual joystick and touch controllers for complex mobile/touch-screen interactions.

sceneKeyboardBinding.js: 键盘快捷键绑定，实现漫游控制。

Keyboard shortcut bindings for camera roaming control.

4.2 数据服务与图加载 | Data Services & Graph Loading (src/galaxy/service/)
负责从远端获取二进制或 JSON 格式的图数据并构建内存对象。
Responsible for fetching binary or JSON graph data from remotes and building memory objects.

graphLoader.js: 异步流式加载图结构。

Asynchronous stream loading of graph structures.

主要接口 (Main API): loadGraph(graphId) - 初始化目标星系数据的抓取与解析。

edgeFinder.js: 边关系检索服务，用于快速查找两点之间的连接与最短路径。

Edge relation retrieval service for finding connections and shortest paths between nodes.

4.3 状态管理体系 | State Management (src/galaxy/store/)
系统使用多个独立的 Store 进行领域数据的管理。
The system uses multiple independent Stores to manage domain data.

sceneStore.js: 维护当前场景的摄像机坐标、缩放层级与渲染状态。

Maintains current scene camera coordinates, zoom level, and rendering state.

hover.js: 负责处理鼠标悬停时的节点拾取与高亮逻辑。

Handles node picking and highlighting logic on mouse hover.

licenseStore.js & inheritanceRiskStore.js: 针对特定业务（如开源合规、继承风险）的数据聚合与计算模型。

Data aggregation and calculation models for specific business logic (e.g., open-source compliance).

4.4 动态模板与详情渲染 | Dynamic Templates & Details (src/galaxy/nodeDetails/)
当用户选中某一节点时，引擎会根据节点类型动态加载展示模板。
When a user selects a node, the engine dynamically loads a display template based on the node type.

包管理器模板 (Package Manager Templates): 包含 npm.jsx, github.jsx, python.jsx 等，用于精准适配不同生态域的数据展示规范。

Includes templates like npm, github, python, precisely adapting to data display standards of different ecosystems.

5. 用户指南与功能介绍 | User Manual & Features
本可视化引擎为用户提供沉浸式的数据探索体验。
This visualization engine provides users with an immersive data exploration experience.

5.1 视角控制与漫游 | Viewpoint Control & Roaming
鼠标操作 (Mouse): 左键拖拽平移视角，滚轮控制空间缩放，悬停节点可查看基础信息摘要。

Left-click and drag to pan, scroll wheel to zoom, hover over nodes for a basic summary.

键盘操作 (Keyboard): 使用 W, A, S, D 键在三维空间内平滑漫游。

Use W, A, S, D keys for smooth roaming in the 3D space.

移动端 (Mobile): 屏幕左下角提供虚拟摇杆（Joystick），支持单指移动与双指捏合缩放。

A virtual joystick is provided in the bottom left, supporting one-finger movement and two-finger pinch-to-zoom.

5.2 全局搜索与定位 | Global Search & Positioning
位于屏幕顶部的搜索栏支持模糊匹配与精确检索。输入目标节点名称后，摄像机会自动进行路径寻优并平滑过渡聚焦到目标节点，同时高亮其直接关联的邻居节点（Ego Graph）。
The search bar at the top supports fuzzy matching and exact retrieval. Upon entering a node name, the camera automatically calculates the path and smoothly focuses on the target, highlighting its immediate neighbors (Ego Graph).

5.3 深度分析视窗 | Deep Analysis Windows
通过侧边栏可唤出多维数据分析视窗：
Multi-dimensional data analysis windows can be toggled via the sidebar:

路径规划 (Pathfinding): 在 PathfindingWindow 中输入起点与终点，引擎将计算并高亮显示最短依赖路径。

Enter start and end points in the PathfindingWindow; the engine will calculate and highlight the shortest dependency path.

合规与风险分析 (Compliance & Risk): 包含 LicenseReportWindow 与 InheritanceRiskWindow，通过图表（如 Treemap）直观展示当前选中节点及子图的开源协议分布及潜在的合规性风险。

Includes LicenseReportWindow and InheritanceRiskWindow, using charts (like Treemaps) to visually display open-source license distribution and potential compliance risks for the selected subgraph.