# 功能工作流速查

这份文档不按目录讲，而是按实际使用动作讲。适合在改需求前先对照一遍，看看自己会碰到哪条链路。

## 1. 打开图谱

用户进入 `/galaxy/:name` 后：

- `galaxyPage.jsx` 根据路由名触发图下载。
- `graphLoader.js` 拉取静态图数据。
- `sceneStore.js` 保存模型并广播完成事件。
- `scene.jsx` 把各层 UI 叠到画布上。

如果这条链路有问题，通常表现为加载层卡住、画布空白、窗口和侧栏都不工作。

## 2. 搜索节点

入口：

- 顶部搜索框。

链路：

- `searchBoxView.jsx`
- `searchBoxModel.js`
- `scene.find()`
- 结果列表点击后触发 `selectNode`

效果：

- 展示结果列表。
- 点击结果后聚焦节点。
- 节点详情和邻居高亮同步更新。

## 3. 查看节点详情

入口：

- 画布点击节点。
- 搜索结果点击节点。

链路：

- `renderer.js` 触发 `selectNode`
- `nodeDetailsStore.js` 组装 `sidebarData`
- `nodeDetailsView.jsx` 选择模板并展示

效果：

- 展示节点基础信息、标签、许可证、地区、论文等信息。
- 展示继承链。
- 展示合规风险和跳转按钮。

## 4. 做全局许可证分析

入口：

- 左侧栏 `Insight` 区。

对应能力：

- License Stats
- Compliance Report
- Compliance Stats

数据来源：

- `licenseStore.js`
- `licenseComplianceStore.js`

表现形式：

- 分布列表。
- 冲突报告表格。
- 按许可证聚合的冲突统计。

## 5. 检查局部继承与合规风险

入口：

- 先选中节点，再从详情或相关动作进入。

对应能力：

- 节点详情中的继承链。
- Inheritance Risk 窗口。
- 局部 Compliance Graph。

这条链路特别适合排查“一个模型为什么有风险”。

## 6. 做路径合规分析

入口：

- 搜索框右侧的路径分析按钮。

链路：

- `showPathfindingWindow`
- `PathfindingWindow.jsx`
- `scene.getGraph().findShortestPath()`
- `licenseUtils` 做兼容判断
- `scene.findAlternativeModels()` 推荐替代模型

效果：

- 路径节点逐个显示。
- 冲突节点标红。
- 可直接定位到冲突节点或替代模型。

## 7. 切换视图模式

入口：

- 左侧栏 `Views` 区。

现有模式：

- Task Type View
- Highlight Core Models
- Show Communities
- Highlight Conflicts
- Toggle Timeline

底层主要由 `renderer.js` 和 `timelineStore.js` 承接。

## 8. 风险与洞察类视图

入口：

- 左侧栏 `Insight` 区。

现有能力：

- Risk Heatmap
- Key Node Ranking
- Impact Scope

这几项不是单纯换颜色，它们会同时改动渲染效果、窗口列表，甚至影响社区视图和节点聚焦。

## 9. 导航辅助

系统里还有几项容易被忽略但很实用的辅助能力：

- 小地图：看局部空间位置。
- `Backspace` 回退相机历史。
- `H` 打开帮助。
- `T` 切换聚类标签。
- 中英双语切换。

如果用户反馈“图能看见但不好用”，问题往往不在图数据本身，而在这些辅助链路。
