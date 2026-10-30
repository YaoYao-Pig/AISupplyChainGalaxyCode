# AISupplyChainGalaxyCode

AI Supply Chain Galaxy（AISCG）前端仓库：面向大模型供应链的许可证合规三维可视化分析系统。将 HuggingFace 上的模型谱系、许可证信息与风险提示汇聚为一张可交互的 3D 图谱，使来源追踪与许可风险初筛在同一视图内完成。

- 研究论文：[AI Supply Chain Galaxy: 3D Visual Analytics for License Compliance](https://arxiv.org/abs/2606.16292)
- 在线站点：https://ai-supplychain.x-lab.info/#/galaxy/my_model_galaxy?cx=0&cy=0&cz=0&lx=0.0000&ly=0.0000&lz=0.0000&lw=1.0000&ml=150&s=1.75&l=0&v=v1_updated_links
- 数据处理管线：[AISupplyChainGalaxy](https://github.com/YaoYao-Pig/AISupplyChainGalaxy)（HuggingFace 采集 → Neo4j 图谱 → 3D 布局数据）

## 主要功能

- **三维图谱漫游**：支持模型名称、标签搜索，可按社区、任务类型、时间和风险状态观察模型生态
- **节点与路径分析**：选中模型查看元数据、上下游关系、继承链与合规详情；路径分析沿依赖链标示许可冲突，并提供替代模型线索
- **全局视图**：许可证分布、冲突报告、风险热力图与影响范围分析，支持从总体异常逐步定位到具体上游来源

## 快速开始

```bash
npm install
npm start        # 开发服务器 http://localhost:8081
npm run build    # webpack 生产构建，输出到 build/
```

## 文档

面向维护者与后续开发者的完整文档见 [docs/](./docs/README.md)：

- 架构：[系统总览](./docs/architecture/overview.md) · [数据流与事件流](./docs/architecture/data-flow.md)
- 模块：[Native 渲染与交互](./docs/modules/native.md) · [Service/Store/Runtime](./docs/modules/service-store-runtime.md) · [搜索与节点详情](./docs/modules/search-and-node-details.md) · [分析窗口](./docs/modules/windows-and-analysis.md) · [AgentKit](./docs/modules/agentkit.md)
- [功能工作流速查](./docs/features/user-workflows.md)

## 开发约定

- AI 协作规范见 [AGENTS.md](./AGENTS.md)，配套说明在 `docs/VIBECODING/`（内容感知、代码规范、模块边界、Think-Execute 循环）
- `npm run check:vibe` 执行模块边界检查；现有历史耦合记录在 `tools/quality/boundary-allowlist.json`，新增违规会直接失败

## 致谢

本仓库基于 [anvaka/pm](https://github.com/anvaka/pm)（pmviz，MIT，by Andrei Kashcha）改造而成，图布局使用 ngraph 系列库，感谢上游项目的开源贡献。

## License

[MIT](./LICENSE)
