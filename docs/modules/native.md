# Native 渲染与交互模块

## 1. 这个模块负责什么

`src/galaxy/native/` 负责的是“图谱怎么被画出来、怎么被操控”，不是页面 UI。这里的代码更接近渲染引擎和输入层。

关键文件：

- `renderer.js`
- `sceneKeyboardBinding.js`
- `touchControl.js`
- `lineView.js`
- `getNearestIndex.js`
- `appConfig.js`

## 2. `renderer.js` 是核心

这个文件现在是 Native 层的绝对核心，职责已经比较重了：

- 创建 3D 粒子视图和线条视图。
- 接收 positions / links 数据并完成渲染初始化。
- 处理 hover、click、double click 的命中。
- 响应搜索高亮、邻居高亮、链路高亮、路径高亮。
- 承接风险热力图、任务类型视图、社区显示、核心模型高亮、许可证模拟等分析效果。
- 管理相机移动、相机历史和局部视觉重置。

简单说，所有“看得见的图谱效果”最后大多都要落到它这里。

## 3. 交互入口

### 鼠标和命中

`renderer.js` 内部通过 hit test 找最近节点，然后触发：

- `nodeHover`
- `selectNode`
- `focusOnNode`

这部分直接决定节点 hover、选中和双击聚焦的体验。

### 键盘

`sceneKeyboardBinding.js` 目前绑定了几个重要快捷键：

- `Space`：切换 steering 模式。
- `L`：显示或隐藏边。
- `H` 或 `Shift + /`：显示帮助。
- `G`：打开选中节点的外部页面，目前默认跳到 Hugging Face。
- `T`：切换 cluster labels。
- `Backspace`：回到上一个相机位置。
- `Shift`：加速导航。

这里有一个仓库里已经明说的历史耦合：键盘绑定会直接读 `nodeDetailsStore`。这是 allowlist 中保留的例外，不建议继续扩散这种模式。

## 4. 视觉辅助

### 小地图

`Minimap.jsx` + `store/minimapStore.js` 共同实现：

- 监听相机位置。
- 从图里抽样一部分节点。
- 显示当前视域内的节点分布和朝向。
- 允许通过滚轮缩放小地图观察半径。

小地图不是“全图总览”，而是“以当前相机为中心的局部导航辅助”。

### 线条显示

`lineView.js` 负责边的显示。渲染器在高亮路径、筛选边类型或显示某些关系时，会重新走这层。

## 5. 当前维护风险

- `renderer.js` 同时管理渲染状态、交互状态和分析状态，已经有“上帝文件”趋势。
- 多个视图模式之间通过 `cls()` 做统一清场，这很好用，但也意味着新增模式时必须考虑和其他模式的互斥关系。
- 节点颜色和尺寸修改多是直接操作底层数组，性能高，但写错偏移量会很难排查。
- 小地图和时间线都属于高频更新路径，不适合堆重计算。

## 6. 适合怎么改

- 纯视觉效果调整，优先落在 Native 层。
- 需要跨多个业务模块的分析逻辑，不要直接塞到 `renderer.js` 的顶部，最好先在 store 或 service 侧整理出干净数据，再让 renderer 消费。
- 新增快捷键前先确认是否会覆盖已有导航操作。
