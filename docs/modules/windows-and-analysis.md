# Windows / Analysis 模块

## 1. 模块定位

`src/galaxy/windows/` 是项目里比较偏“业务产品层”的目录。很多分析功能最终都不是在侧栏里完成，而是以可拖拽窗口的形式展开。

关键文件：

- `windowCollectionModel.js`
- `windowCollectionView.jsx`
- `DraggableWindow.jsx`
- 各类 `*ViewModel.js`
- 各类窗口组件 `*.jsx`

## 2. 窗口系统怎么组织

### `windowCollectionModel.js`

这层维护一个窗口字典，监听：

- `showNodeListWindow`
- `hideNodeListWindow`

窗口的打开和关闭基本都通过事件完成，所以新增窗口时，通常不需要改复杂路由，只要准备好 ViewModel 和内容组件，再把它挂进映射表。

### `windowCollectionView.jsx`

这里负责把 ViewModel 映射到实际组件。当前的内容类型包括：

- 节点列表窗口
- 许可证分布窗口
- 全局合规报告窗口
- 合规统计窗口
- 合规关系图窗口
- 路径分析窗口
- 继承风险窗口
- 洞察列表窗口

这说明窗口系统已经承担了“二级工作台”的角色。

## 3. 左侧分析入口

`LeftSidebarView.jsx` 是当前大多数分析功能的统一入口，分成四个标签：

- Guide
- Insight
- Views
- License

里面串起了多个重要能力：

- 全局许可证统计
- 全局合规报告
- 合规统计
- 风险热力图
- 关键节点排行
- 影响范围分析
- 核心模型高亮
- 社区视图
- 任务类型视图
- 时间线开关
- 许可证模拟

从产品结构看，左侧栏负责“触发分析”，窗口负责“承载结果”，渲染器负责“画面反馈”。

## 4. 典型窗口说明

### Pathfinding

`PathfindingWindow.jsx` 现在实际更像“合规路径分析器”，不只是找最短路径。它支持：

- 选起点和目标节点。
- 计算最短路径。
- 对路径上每个节点做许可证兼容性判断。
- 在发现冲突时推荐替代模型。

这是目前最接近“业务决策工具”的窗口之一。

### LicenseReport

`LicenseReportWindow.jsx` 展示全局许可证冲突清单，重点在：

- 问题模型。
- 问题许可证。
- 父模型。
- 父模型许可证。

它本质上是 `licenseComplianceStore` 的表格化视图。

### ComplianceStats

`ComplianceStatsWindow.jsx` 按许可证维度聚合冲突数量，适合做全局研判，不看单条。

### ComplianceGraph

`ComplianceGraphViewModel.js` 和相关窗口用于展示局部许可证关系图。当前触发入口在 `scene.jsx` 里，通常围绕已选节点构造一个局部图。

### InheritanceRisk

`InheritanceRiskViewModel.js` 会往上追父链，挑选可能有风险的继承路径，再由 `InheritanceRiskWindow.jsx` 以链路视图展示。

这块和节点详情里的继承链有关联，但窗口更强调“风险解释”。

## 5. 这层的设计特点

- ViewModel 很轻，职责集中在准备窗口所需数据。
- 窗口组件普遍直接订阅 store 或消费 viewModel，不走复杂中间层。
- 大量分析功能是“事件驱动 + 临时窗口”，而不是固定页面。

这对快速扩功能很有帮助，但也要求命名保持稳定，否则很容易出现 `id`、`class`、组件映射对不上的问题。`windowCollectionView.jsx` 里已经能看到这种兼容处理。

## 6. 维护建议

- 新增分析能力时，优先想清楚它是“左侧栏入口 + 渲染反馈 + 窗口结果”中的哪几部分组合。
- 如果只是展示列表，不要新造一套窗口壳，复用现有 `DraggableWindow` 和列表窗口就够。
- ViewModel 的字段命名要和 `windowCollectionView.jsx` 的映射保持一致，尤其是 `id`、`class`、`className`。
