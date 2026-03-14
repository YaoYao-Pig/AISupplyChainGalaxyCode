# AISupplyChainGalaxyCode - VibeCoding 协作规范

本文档用于约束人类与 AI 协作开发行为，目标是让项目具备可持续迭代能力，而不是一次性修改。

## 1. 项目目标
- 维持星系图可视化核心能力（加载、渲染、搜索、分析窗口）。
- 在不破坏老架构的前提下，提高可维护性、可解释性、可验证性。
- 所有新改动都应符合 Think-Execute 循环，并保留最小可追溯记录。

## 2. 内容感知基线（Context Baseline）
每次开始任务前，先确认以下 5 项：
- 业务目标：这次改动解决哪个用户场景？
- 影响模块：涉及 `service/`、`store/`、`runtime/`、`windows/`、`nodeDetails/` 的哪些文件？
- 数据流：输入数据从哪里来，状态在哪个 Store，最终由哪个视图消费？
- 风险点：是否影响渲染性能、事件风暴、路由加载、窗口状态同步？
- 验证方式：如何证明功能正确且无明显回归？

详细内容见 [docs/VIBECODING/01_CONTENT_AWARENESS.md](docs/VIBECODING/01_CONTENT_AWARENESS.md)。

## 3. 代码规范入口
统一遵循 [docs/VIBECODING/02_CODE_STANDARDS.md](docs/VIBECODING/02_CODE_STANDARDS.md)。

最低要求：
- 只做必要改动，避免无关重构。
- 变更命名有语义，不使用模糊缩写。
- 事件驱动链路必须写清触发源和消费方。
- 新增逻辑默认带最小错误处理和可观测信息（日志/注释/文档说明其一）。

## 4. 模块隔离入口
统一遵循 [docs/VIBECODING/03_MODULE_BOUNDARIES.md](docs/VIBECODING/03_MODULE_BOUNDARIES.md)。

执行校验：
- `npm run check:boundaries`
- `npm run check:vibe`

## 5. Think-Execute 循环入口
统一遵循 [docs/VIBECODING/04_THINK_EXECUTE_LOOP.md](docs/VIBECODING/04_THINK_EXECUTE_LOOP.md)。

每次需求至少保留：
- Think：任务理解、方案、风险、验收标准。
- Execute：提交的文件改动清单。
- Verify：运行命令与结果摘要。
- Reflect：后续可优化点（可选，但推荐）。

## 6. Definition of Done (DoD)
一个任务完成，至少满足：
- 代码可运行（或明确说明受限原因）。
- 模块边界检查通过（或有临时豁免记录）。
- 文档与代码一致，不出现“文档描述与实现冲突”。
- 对外行为变化被说明（路由、事件、配置、输出格式）。
