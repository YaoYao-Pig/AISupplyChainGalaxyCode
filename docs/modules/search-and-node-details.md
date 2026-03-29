# Search / Node Details 模块

## 1. 模块定位

这两个目录负责的是“用户怎么找到节点”和“找到以后看到什么”。从界面体验上看，它们很轻，但从业务上看，它们把图查询结果真正翻译成了可读信息。

## 2. Search 模块

关键文件：

- `search/searchBoxModel.js`
- `search/searchBoxView.jsx`

### 搜索模型怎么工作

`searchBoxModel.js` 管两类输入：

- 普通文本：调用 `scene.find()` 做节点名搜索。
- 命令输入：以 `:` 开头，走 `clientRuntime`。

它自己维护搜索结果状态，并通过 `changed` 事件通知视图刷新，而不是再额外开一个窗口 store。这说明搜索功能现在更接近“页面内悬浮结果面板”。

### 搜索视图怎么表现

`searchBoxView.jsx` 负责：

- 输入框展示。
- 默认空输入时展示预览结果。
- 搜索结果列表虚拟渲染。
- 点击外部区域时收起结果面板。
- 快捷进入路径分析窗口。

这部分体验做得比较实用，用户能在“先搜节点”和“直接做路径分析”之间快速切换。

## 3. Node Details 模块

关键文件：

- `nodeDetails/nodeDetailsStore.js`
- `nodeDetails/nodeDetailsView.jsx`
- `nodeDetails/templates/*`
- `store/baseNodeViewModel.js`

### `nodeDetailsStore.js`

职责很清楚：

- 监听 `selectNode`。
- 组装当前选中节点的侧栏数据。
- 维护入边、出边列表。
- 管理 degree 窗口。
- 支持继承链轮流聚焦。

这里的一个好点是，它没有让视图自己去读很多底层结构，而是先把 `selectedNode`、`incoming`、`outgoing` 拼成 `sidebarData`。

### `baseNodeViewModel.js`

这是节点详情真正的业务翻译层，负责把原始 nodeData 解释成：

- 名称、度数、作者、下载量、点赞数。
- 标签、地区、论文链接。
- 当前许可证。
- 继承链。
- 合规结果和风险列表。

尤其是继承链和合规字段，很多窗口和详情展示都是靠它兜起来的。

### 模板系统

`nodeDetails/templates/` 下面按生态类型拆了多个模板，比如：

- `npm.jsx`
- `python.jsx`
- `github.jsx`
- `gosearch.jsx`
- `default.jsx`

这意味着节点详情不是一套死 UI，而是允许按数据源做差异化展示。

## 4. 风险展示逻辑

`nodeDetailsView.jsx` 已经把合规风险做成了节点详情中的一级信息：

- 风险按 Error / Warning 分组。
- 默认只展示前几条，支持展开。
- 若风险能匹配到父节点冲突，还能直接跳过去聚焦关联节点。

这块体验是项目里比较“业务化”的部分，说明详情面板不只是元数据卡片，而是实际分析入口。

## 5. 维护时最容易踩的点

- `nodeData.tags` 里不同语义靠前缀区分，新增标签类型时别破坏现有解析。
- `searchBoxModel` 会在选中节点后主动清空结果，如果要改搜索交互，别把这个行为不小心删掉。
- 详情模板依赖当前图名选择，增加新数据源时最好同步加模板和默认兜底。
- 继承链展示和合规冲突展示不是同一套数据，但用户会把它们当成一个整体体验看待，改动时要一起核对。
