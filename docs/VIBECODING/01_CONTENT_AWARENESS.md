# 01. 内容感知（Content Awareness）

## 1. 核心域对象
- 图谱（Graph）：节点、边、坐标、标签、业务元数据。
- 交互会话（Session）：相机位置、缩放、当前查询、选中节点、悬停状态。
- 分析窗口（Windows）：路径规划、协议合规、继承风险、统计面板。
- 详情模板（Node Templates）：按生态类型渲染节点详情。

## 2. 业务主链路
1. 路由进入 `/galaxy/:name`。
2. `galaxyPage.jsx` 触发 `downloadGraphRequested`。
3. `service/graphLoader.js` 加载图数据并构建内存模型。
4. `store/` 接收事件并更新状态。
5. `native/renderer.js` + React 叠层组件共同渲染。
6. 用户交互（搜索/悬停/窗口）触发下一轮事件更新。

## 3. 目录认知地图
- `src/galaxy/native/`：底层渲染与输入控制。
- `src/galaxy/service/`：数据加载、查询服务、事件桥接。
- `src/galaxy/store/`：状态存储与状态变更广播。
- `src/galaxy/runtime/`：对外运行时能力封装。
- `src/galaxy/windows/`：浮动分析窗口与 ViewModel。
- `src/galaxy/nodeDetails/`：节点详情面板与模板。
- `src/galaxy/search/`：搜索输入与结果逻辑。

## 4. 每次改动前的内容感知问题
- 改动是“数据问题、状态问题、渲染问题”中的哪一类？
- 这次是否新增事件？谁发布、谁订阅？
- 是否会引入高频重绘或重复计算？
- 是否影响老数据格式或老路由参数？
- 回滚路径是什么？

## 5. 任务上下文模板
```md
## Context Snapshot
- Feature/Issue:
- User Story:
- Affected Modules:
- Data Flow:
- Risks:
- Validation Plan:
```
