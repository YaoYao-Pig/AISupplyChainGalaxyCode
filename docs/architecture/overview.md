# 系统总览

## 1. 这套系统怎么组成

从源码看，这个项目可以拆成两层：

- `src/galaxy/`：用户真正能看到和操作的图谱前端。
- `src/agentkit/` + `tools/agentkit/`：仓库执行流程层，负责任务建档、状态持久化和文档留痕。

两层是解耦的。AgentKit 不负责替代图谱业务逻辑，它负责约束“任务怎么开始、怎么留痕、怎么收尾”。

## 2. 页面入口

主路由定义在 `src/main.jsx`：

- `/`：欢迎页。
- `/galaxy/:name`：图谱主场景。
- `/docs`：应用内文档页。

真正的业务主入口是 `src/galaxy/galaxyPage.jsx`。这个组件不做复杂渲染，它只负责盯住路由参数变化，并在图谱名变化时发出 `downloadGraphRequested` 事件。

## 3. 运行时主链路

图谱页的主链路可以按下面理解：

1. 路由进入 `/galaxy/:name`。
2. `galaxyPage.jsx` 检测参数变化，触发 `appEvents.downloadGraphRequested`。
3. `store/sceneStore.js` 监听这个事件，调用 `service/graphLoader.js` 拉取图数据。
4. `graphLoader.js` 依次拉取 manifest、positions、links、labels、nodeData、linkTypes、linkData、compliance_data。
5. `service/graph.js` 把原始数据封装成内存图模型。
6. `sceneStore` 保存图模型并发出 `graphDownloaded`。
7. `scene.jsx` 已经提前挂好了渲染层和 UI 叠层，后续各模块靠 store 和事件自行刷新。

这个结构比较典型：入口轻，事件总线居中，store 持有状态，渲染器和 React UI 都订阅同一批状态变化。

## 4. 技术栈现实

这不是一个很新的前端栈，写文档和改代码时要带着这个前提：

- React 0.14 + `maco` 组织组件。
- `unrender` + `THREE` 做 3D 粒子图渲染。
- `ngraph.events` 做事件分发。
- `ngraph.graph` / `ngraph.louvain` 做图数据和社区分析。
- Python 侧的 AgentKit 负责任务状态机和文档模板系统。

换句话说，项目能做的事情很多，但代码风格不是现代 Hooks/TypeScript 那一路，维护时要更重视现有模式的一致性。

## 5. 模块划分

`src/galaxy/` 当前的协作边界基本是：

- `native/`：渲染、相机、输入、线条绘制、小地图同步。
- `service/`：图数据请求、图模型封装、事件总线。
- `store/`：状态中台，承接图、许可证、时间线、过滤器、hover 等状态。
- `runtime/`：命令式调用薄封装，主要给搜索命令和控制台式能力使用。
- `search/`：搜索框和搜索结果交互。
- `nodeDetails/`：节点详情面板与模板。
- `windows/`：分析窗口和窗口管理。
- `utils/`：纯工具。

这套边界和 `docs/VIBECODING/03_MODULE_BOUNDARIES.md`、`configs/module_rules.yaml` 一致，新增代码应该尽量沿着这条线走，不要把 UI、状态和渲染重新搅在一起。

## 6. 用户可见能力

从现在的源码和界面行为看，主功能已经不只是“看图”：

- 图谱加载与 3D 漫游。
- 关键字搜索和标签搜索。
- 节点详情与继承链展示。
- 局部和全局许可证分析。
- 合规冲突统计和风险提示。
- 合规路径分析与替代模型推荐。
- 时间线切片。
- 社区发现与社区视图。
- 任务类型视图。
- 风险热力图、关键节点排行、影响范围分析。
- 小地图、键盘快捷键、多语言切换。

## 7. 架构上的几个重点

### 事件总线是中轴

`src/galaxy/service/appEvents.js` 是模块通信的中轴。很多功能并不是组件直接互相调用，而是通过事件串起来。看不懂界面行为时，先查事件名，通常比顺着组件树找更快。

### `sceneStore` 不是“小 store”，它是整个图谱状态入口

图是否加载完成、模型怎么查、如何按名称找节点、怎么算社区、怎么算影响范围，这些都在 `sceneStore.js` 里。它既是状态入口，也是业务能力聚合点。

### `scene.jsx` 是装配层，不是算法层

`scene.jsx` 做的事情很多，但它主要是把渲染层、节点详情、窗口、时间线、左侧分析入口这些 UI 层装配起来。复杂算法尽量不要继续往这里堆。

## 8. 当前已知的维护事实

- 有少量历史跨模块依赖被 allowlist 保留，暂时可以接受，但不应该扩散。
- `renderer.js` 功能非常多，已经不只是“画点和线”，还接了多种分析高亮逻辑，是后续最值得继续拆分的文件之一。
- 应用内 `/docs` 页面和仓库 `docs/` 目录当前不是同一套来源，这在做文档系统统一时要特别注意。
