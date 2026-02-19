# 数据模型与状态流
Galaxy Graph Visualization Engine: Data Models & State Flow
本文档介绍了引擎内部核心的数据结构规范以及基于事件驱动的状态同步机制，帮助开发者理解数据从网络请求到最终渲染的流转过程。
This document introduces the core internal data structures and the event-driven state synchronization mechanism, helping developers understand the data flow from network requests to final rendering.

1. 核心数据结构 | Core Data Structures (src/galaxy/service/graph.js)
图引擎在内存中维护了一个高度优化的 GraphModel 对象。为保证百万级节点的检索与遍历性能，节点与边均采用特定的索引结构。
The graph engine maintains a highly optimized GraphModel object in memory. To ensure retrieval and traversal performance for millions of nodes, both nodes and edges use specific index structures.

1.1 节点模型 (Node Model)
每个节点在加载后被解析为以下结构：
Each node is parsed into the following structure after loading:

JavaScript
{
  id: "node_12345",       // 唯一标识符 | Unique Identifier (String/Number)
  name: "react",          // 节点显示名称 | Display Name (String)
  x: 120.5,               // 三维空间坐标 X | 3D Coordinate X (Float)
  y: -45.2,               // 三维空间坐标 Y | 3D Coordinate Y (Float)
  z: 10.0,                // 三维空间坐标 Z | 3D Coordinate Z (Float)
  degree: 42,             // 节点度数 (连接数) | Node Degree (Integer)
  data: {                 // 业务拓展数据 | Business Extension Data (Object)
    type: "npm",          // 生态类型
    license: "MIT",       // 开源协议
    // ... 其他属性
  }
}
1.2 边/关系模型 (Link/Edge Model)
为了优化 GPU 渲染，边数据通常以扁平化的数组形式或邻接表存储：
To optimize GPU rendering, edge data is typically stored as flattened arrays or adjacency lists:

JavaScript
{
  source: "node_12345",   // 起点 ID | Source Node ID
  target: "node_67890",   // 终点 ID | Target Node ID
  type: "dependency",     // 关系类型 | Relation Type (Optional)
  weight: 1.0             // 边权重 | Edge Weight (Float)
}
2. 状态流转机制 | State Flow Mechanism (src/galaxy/store/)
系统采用单向数据流与订阅发布者模式（Pub/Sub）。所有的用户操作（如点击、搜索）都会触发 Store 中的事件，进而驱动视图更新。
The system uses a unidirectional data flow and a Publish/Subscribe (Pub/Sub) pattern. All user actions (like clicking, searching) trigger events in the Store, which in turn drive view updates.

2.1 事件总线 (Event Bus: appEvents.js)
定义了系统内所有的全局事件，例如：
Defines all global events within the system, such as:

selectNode: 当用户点击选中某一节点时触发。
Triggered when a user clicks and selects a node.

focusOnNode: 触发摄像机移动并聚焦到特定节点。
Triggers camera movement and focus on a specific node.

graphLoaded: 当图数据从远端完全加载并解析完毕时触发。
Triggered when graph data is fully loaded and parsed from the remote.

2.2 响应式过滤 (Reactive Filtering)
taskFilterStore.js & edgeFilterStore.js: 控制当前画布上哪些节点或边应该被隐藏或淡出。例如，当用户在图例中取消勾选 "devDependencies" 时，过滤 Store 会广播事件，WebGL 渲染器监听到后会实时更新 Alpha 缓冲。
Controls which nodes or edges on the canvas should be hidden or faded. For example, when a user unchecks "devDependencies" in the legend, the filter Store broadcasts an event, and the WebGL renderer updates the Alpha buffer in real-time upon listening.

文件名称：UI_Component_Reference.md (界面组件参考文档)
星系图可视化引擎：界面组件参考
Galaxy Graph Visualization Engine: UI Component Reference
本项目基于 React 构建了丰富的上层交互 UI，所有组件均位于 src/galaxy/ 及其子目录中，并与底层的 WebGL Canvas 形成视觉上的叠加（Overlay）。
This project builds a rich upper-layer interactive UI based on React. All components are located in src/galaxy/ and its subdirectories, forming a visual overlay on top of the underlying WebGL Canvas.

1. 核心布局组件 | Core Layout Components
1.1 galaxyPage.jsx & scene.jsx
功能描述 (Functionality): 应用的主骨架与 WebGL 画布的挂载点。scene.jsx 负责初始化底层的 renderer.js，并处理窗口大小调整（Resize）时的重绘逻辑。
The main skeleton of the application and the mount point for the WebGL canvas. scene.jsx initializes the underlying renderer.js and handles redraw logic upon window resize.

1.2 SidebarView.jsx & LeftSidebarView.jsx
功能描述 (Functionality): 左右两侧的抽屉式面板。通常左侧用于展示全局信息、图例（Legend）及导航菜单；右侧则与 nodeDetailsView.jsx 结合，专门用于展示被选中节点的深度业务信息。
Drawer panels on the left and right sides. The left is typically used for global info, legends, and navigation menus; the right is combined with nodeDetailsView.jsx specifically to display in-depth business information of the selected node.

2. 导航与指示组件 | Navigation & Indicator Components
2.1 Minimap.jsx (小地图)
功能描述 (Functionality): 位于屏幕角落的二维缩略图组件。它监听摄像机的位置变化，并在缩略图上绘制一个视区方框，帮助用户在极大规模的网络中保持空间方位感。
A 2D thumbnail component located in the corner of the screen. It listens to camera position changes and draws a viewport bounding box on the thumbnail, helping users maintain spatial awareness in extremely large networks.

2.2 steeringIndicator.jsx (方位指示器)
功能描述 (Functionality): 当用户搜索的目标节点位于当前屏幕视野之外时，该组件会在屏幕边缘显示一个动态的箭头，指示目标节点所在的三维空间方向。
When a user's searched target node is outside the current screen view, this component displays a dynamic arrow at the edge of the screen, indicating the 3D spatial direction of the target node.

2.3 TimelineView.jsx (时间轴视图)
功能描述 (Functionality): 针对带有时间戳的图数据（如开源项目的演进历史），提供底部时间滑块。拖动滑块可触发图谱按时间切片重新渲染过滤。
For graph data with timestamps (like the evolution history of open-source projects), provides a bottom time slider. Dragging the slider triggers the graph to re-render and filter by time slices.

文件名称：I18n_Localization_Guide.md (多语言国际化指南)
星系图可视化引擎：多语言国际化 (i18n) 指南
Galaxy Graph Visualization Engine: Internationalization (i18n) Guide
为支持全球化部署，本系统内置了轻量级的多语言支持模块。
To support global deployment, the system has a built-in lightweight multi-language support module.

1. 语言文件管理 | Language File Management (src/galaxy/utils/i18n.js)
系统通过键值对（Key-Value）字典管理文本。所有静态界面文本都需要通过 i18n 工具函数进行提取。
The system manages text via Key-Value dictionaries. All static interface text must be extracted using the i18n utility function.

当前支持语言 (Currently Supported): 中文 (zh-CN), English (en-US)。

字典结构示例 (Dictionary Structure Example):

JavaScript
const messages = {
  'en': {
    'search.placeholder': 'Search packages or developers...',
    'window.pathfinding.title': 'Shortest Path Discovery',
  },
  'zh': {
    'search.placeholder': '搜索依赖包或开发者...',
    'window.pathfinding.title': '最短路径探索',
  }
};
2. 在组件中使用 | Usage in Components
在 React 组件或普通 JS 文件中，引入 i18n.js 并调用格式化方法：
In React components or standard JS files, import i18n.js and call the formatting method:

JavaScript
import i18n from '../utils/i18n';

// 基础文本翻译 | Basic text translation
const title = i18n.t('window.pathfinding.title');

// 渲染到 JSX 中 | Rendering in JSX
<div className="search-box">
   <input placeholder={i18n.t('search.placeholder')} />
</div>
3. 切换系统语言 | Switching System Language
语言的首选项通常在 appConfig.js 中全局配置，或通过读取浏览器的 navigator.language 自动适配。如需在运行时动态切换语言，需触发重新渲染（可通过向顶层组件派发状态更新实现）。
Language preferences are usually globally configured in appConfig.js or automatically adapted by reading the browser's navigator.language. To switch languages dynamically at runtime, a re-render must be triggered (achievable by dispatching a state update to the top-level component).