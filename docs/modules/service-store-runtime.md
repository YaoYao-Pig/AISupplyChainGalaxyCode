# Service / Store / Runtime 模块

## 1. 这三个目录的关系

如果把图谱页面理解成一台机器：

- `service/` 负责把原料运进来。
- `store/` 负责把状态存起来，并对外提供稳定读法。
- `runtime/` 负责给命令式调用留一个薄入口。

这三层分工大体合理，也是目前最值得继续保持边界清晰的部分。

## 2. Service 层

### `appEvents.js`

全局事件总线。它不是业务逻辑实现，但几乎所有跨模块动作都要经过这里。

### `request.js`

底层请求封装。图数据下载都经由这里。

### `graphLoader.js`

完整图数据装载器，负责：

- 版本解析。
- 二进制 positions / links 下载。
- 标签与节点元数据下载。
- 合规数据下载。
- 进度上报。
- 转成图模型前的最终拼装。

### `graph.js`

内存图模型门面，负责：

- 节点和邻接查询。
- 搜索。
- 标签检索。
- 最短路径。
- 合规详情读取。

这个文件对外暴露的 API 很关键，很多上层功能都把它当底层能力源。

## 3. Store 层

### `sceneStore.js`

这是整个图谱的主 store，作用最重：

- 管理当前图和当前图名。
- 维护 `modelId -> nodeId` 索引。
- 提供图级查询和分析能力。
- 在加载完成后广播 `graphDownloaded`。

它还内置了多项计算能力，比如社区分析、影响范围和替代模型推荐，所以它已经是“状态 + 业务查询”的综合入口。

### 许可证与合规相关 store

- `licenseStore.js`：计算许可证分布。
- `licenseComplianceStore.js`：计算全局许可证冲突清单和统计。
- `licenseSimulatorStore.js`：仓库里存在，但当前主流程更多是通过事件驱动渲染器直接做模拟。

### 视图辅助型 store

- `timelineStore.js`：管理时间轴开关、日期序列、播放状态。
- `taskFilterStore.js`：任务类型视图的开关矩阵。
- `edgeFilterStore.js`：边类型筛选。
- `minimapStore.js`：小地图数据。
- `hover.js`、`rippleAnimationStore.js` 等：交互体验辅助状态。

## 4. Runtime 层

`src/galaxy/runtime/` 目前很薄，但定位清楚：把常见操作包成命令式接口。

典型文件：

- `clientRuntime.js`
- `search.js`
- `highlight.js`
- `showLinks.js`
- `cls.js`
- `around.js`

它适合承接两类事情：

- 搜索框里 `:` 开头的命令。
- 调试或脚本式调用。

现在它的好处不是功能多，而是把“命令入口”和“内部实现”隔开了。

## 5. 这层最值得注意的地方

### Store 不要反向依赖 UI

仓库的边界规则已经写得很清楚：`store` 不能反向依赖 `windows`、`search`、`nodeDetails`、`runtime`、`native`。现有历史例外不要继续复制。

### `sceneStore` 很容易越长越大

当前一些分析能力已经直接堆在 `sceneStore.js`。短期这样做效率高，但长期建议把可复用计算逐步抽成 service 或 utils，再由 `sceneStore` 暴露。

### Runtime 层适合保持“薄”

`runtime/` 如果开始承接真正复杂的业务状态，就会和 store 的职责打架。它更适合做动作分发，而不是存状态。

## 6. 改这层时的建议

- 先问自己是在改“数据加载”“状态同步”还是“命令入口”，别三层一起动。
- 只要涉及图查询能力，优先看 `graph.js` 和 `sceneStore.js` 哪个更合适承接。
- 只要要跨多个模块广播变化，先从 `appEvents.js` 设计事件，而不是直接互调。
