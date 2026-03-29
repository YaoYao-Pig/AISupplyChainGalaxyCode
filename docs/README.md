# AISupplyChainGalaxyCode 文档索引

这套文档是给维护者和后续开发者看的，不是产品宣传页。重点放在三件事上：项目到底怎么跑起来、模块之间怎么协作、哪些地方改起来最容易带出连锁影响。

## 项目一句话

AISupplyChainGalaxyCode 是一个面向 AI / 软件供应链分析场景的图谱前端。它把模型、依赖、许可证、继承链路和风险信息放进一个可漫游的 3D 图里，再配一层 React UI 做搜索、窗口分析、节点详情和视图切换。

## 从哪里开始看

- [系统总览](./architecture/overview.md)：先看入口、技术栈和整体装配关系。
- [数据流与事件流](./architecture/data-flow.md)：想搞清楚数据怎么从文件变成界面，直接看这份。
- [Native 渲染与交互模块](./modules/native.md)：WebGL、相机、键盘和小地图都在这里。
- [Service / Store / Runtime 模块](./modules/service-store-runtime.md)：图数据加载、内存模型、状态层和命令层。
- [Search / Node Details 模块](./modules/search-and-node-details.md)：搜索体验和节点详情面板。
- [Windows / Analysis 模块](./modules/windows-and-analysis.md)：各种分析窗口、左侧分析入口和具体能力。
- [AgentKit 模块](./modules/agentkit.md)：仓库级任务入口、状态持久化、模板文档生成。
- [功能工作流速查](./features/user-workflows.md)：站在实际使用角度看主要功能链路。

## 当前目录和文档范围

- `src/galaxy/` 是核心前端业务代码。
- `src/agentkit/` 是仓库内置的 AgentKit runtime 和文档引擎。
- `tools/agentkit/` 是任务入口脚本。
- `configs/` 维护模块边界、策略和运行时配置。
- `docs/generated/` 是任务执行后的留痕输出。

这次整理的正式说明放在 `docs/`。需要注意的是，应用内的 `/docs` 页面当前仍然读取 `src/docs/`，所以仓库文档和应用内文档不是同一套来源，这一点在后续如果要做统一，需要单独开任务处理。

## 建议的阅读顺序

1. 先看系统总览，确认页面入口和模块边界。
2. 再看数据流，理解 `downloadGraphRequested -> graphDownloaded` 这条主链。
3. 按你要改动的目录去看对应模块文档。
4. 最后对照功能工作流，确认这次改动会影响哪些用户路径。

## 维护这套文档时的约定

- 文档描述尽量对应真实源码，不写“理想架构图”。
- 写功能时尽量同时落到“入口文件 + 事件 + store + 视图”四个点。
- 如果新增的是仓库流程能力，优先补到 `docs/modules/agentkit.md` 或 `docs/architecture/`。
- 如果只是局部功能补充，不必重写总览，但要补“影响链路”和“回滚点”。
