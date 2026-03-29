# 数据流与事件流

## 1. 先看核心对象

系统里真正反复流动的对象不多，主要是下面几类：

- 图原始数据：`positions`、`labels`、`outLinks`、`inLinks`、`nodeData`、`linkTypes`、`linkData`、`complianceData`。
- 图模型：`service/graph.js` 返回的 API 对象，用于查询节点、边、标签、最短路径和合规信息。
- 视图模型：窗口和详情面板大量使用轻量 ViewModel，而不是直接把图原始结构塞进组件。
- 运行时状态：当前图名、选中节点、搜索结果、时间线位置、风险高亮状态、窗口集合。

## 2. 图数据怎么加载进来

`service/graphLoader.js` 是完整的数据入口。它的顺序很明确：

1. 先读 `manifest.json`，确定版本和 endpoint。
2. 下载 `positions.bin`。
3. 下载 `links.bin` 并构建 `outLinks` / `inLinks`。
4. 下载 `labels.json`。
5. 下载 `nodeData.json`。
6. 下载 `link_types.json` 和 `link_data.bin`。
7. 下载 `compliance_data.json`。
8. 拼成 `graphData` 交给 `service/graph.js`。

这里有两个维护细节值得记住：

- `manifest` 和 `compliance_data.json` 都带了防缓存处理，说明这部分数据更新频率和缓存问题是踩过坑的。
- `links.bin` 的初始化过程是分批处理的，说明边数据量不小，不能随便把这段逻辑改成同步重计算。

## 3. 图模型提供什么能力

`service/graph.js` 不是单纯的数据容器，它对外提供了一组查询能力：

- `find(query)`：名称搜索。
- `findByTag(tag)`：按标签找节点。
- `getNodeInfo(id)`：基础节点信息。
- `getConnected(id, type)`：入边或出边邻居。
- `findLinks(from, to)`：找边。
- `findShortestPath(start, end)`：最短路径。
- `getComplianceDetails(nodeId)`：节点合规详情。
- `getNodeData(nodeId)`：拿到原始业务元数据。

后面大多数窗口和详情面板，实际上都只是在组合这些能力。

## 4. `sceneStore` 是怎么接住图模型的

`store/sceneStore.js` 监听 `downloadGraphRequested`，加载成功后：

- 保存当前图模型。
- 维护 `modelId -> nodeId` 映射，方便按模型名反查节点。
- 触发全局 `graphDownloaded` 事件。
- 预计算社区数据。

同时它还挂了不少业务计算：

- `getTopNModelsByInDegree()`
- `getTopNModelsByCentrality()`
- `getTopNModelsByRisk()`
- `calculateImpactScope()`
- `calculateCommunitiesForDate()`
- `findAlternativeModels()`

所以它已经不只是“store”，更像是一个面向图谱业务的查询门面。

## 5. 事件流怎么串起界面

`appEvents.js` 定义了大量跨模块事件，常见的几组如下：

- 加载事件：`downloadGraphRequested`、`positionsDownloaded`、`linksDownloaded`、`labelsDownloaded`、`graphDownloaded`
- 交互事件：`nodeHover`、`selectNode`、`focusOnNode`、`focusScene`
- 搜索与高亮：`highlightQuery`、`highlightLinks`、`highlightNeighbors`、`cls`
- 分析事件：`showLicenseReport`、`showGlobalComplianceStats`、`pathFound`、`toggleRiskHeatmap`
- 视图事件：`toggleTimeline`、`timelineChanged`、`showCommunities`、`showTaskTypeView`

从维护角度看，这里的规则很简单：

- 新功能如果要跨多个目录协作，优先加事件，不要直接跨域拿内部状态。
- 事件名尽量表达“发生了什么”或“我要做什么”，不要起成模糊缩写。

## 6. 用户动作到界面反馈的几个典型闭环

### 搜索

1. 搜索框输入文本。
2. `search/searchBoxModel.js` 调 `scene.find()`。
3. 搜索结果保存在 model 内部状态。
4. `search/searchBoxView.jsx` 监听 `changed`，显示结果列表。
5. 选中某个节点后，`selectNode` 事件会清空结果并刷新详情面板。

### 选中节点

1. 用户在 3D 画布点击节点。
2. `native/renderer.js` 命中后触发 `appEvents.selectNode`。
3. `nodeDetailsStore.js` 更新 `sidebarData`。
4. `nodeDetailsView.jsx` 和 `scene.jsx` 中的侧栏内容跟着刷新。
5. 如果已有邻居高亮或度数窗口，也会一起同步。

### 全局许可证分析

1. 图加载完成。
2. `licenseStore.js` 和 `licenseComplianceStore.js` 监听 `graphDownloaded`。
3. 两个 store 分别计算许可证分布和冲突清单。
4. 左侧栏按钮触发对应窗口。
5. 窗口组件直接从 store 读统计结果。

### 时间线视图

1. 左侧栏触发 `toggleTimeline`。
2. `timelineStore.js` 开关时间线状态。
3. 滑块变化后触发 `timelineChanged`。
4. `renderer.js` 根据 `createdAt` 过滤节点可见性。
5. 如果当前处于社区视图，左侧栏还会按时间切片重新计算社区。

## 7. 哪些状态是热路径

下面这些状态一旦处理粗糙，很容易拖慢性能：

- `renderer.js` 里的颜色数组和尺寸数组更新。
- 时间线切片后的节点显隐。
- 任务类型视图和风险热力图的全图着色。
- `links.bin` 转邻接表过程。
- 最小地图在相机移动时的同步刷新。

所以改动这类逻辑时，优先考虑增量更新、数组复用和事件节流，别直接在高频事件里塞一堆对象创建。

## 8. 数据流上的几个坑

- 图数据和 UI 文本是分层的，store 不应该开始拼复杂文案。
- `nodeData.tags` 里混着许可证、基础模型、地区、论文等多类语义，解析时要先拆前缀。
- 一些功能既依赖图结构，也依赖业务元数据，比如合规链和替代模型推荐，不能只看 `getConnected()`。
- `renderer.js` 已经承担了不少业务高亮逻辑，往里面继续加功能时，要警惕把“渲染层”和“分析层”进一步耦合。
