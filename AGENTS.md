# AISupplyChainGalaxyCode - Agent 协作与执行规范

本文档是当前仓库的主协作契约。它融合了现有 VibeCoding 规则、AISupplyChainGalaxy 的实际模块结构，以及 AgentKit 接入后新增的任务执行与文档留痕要求。

## 1. 项目定位
- 本项目是一个面向软件供应链分析场景的星系图谱可视化前端。
- 核心能力包括：大图加载、渲染与漫游、节点搜索、路径分析、许可证合规分析、继承风险分析、节点详情展示。
- 现有业务代码主入口位于 `src/galaxy/`；新增的 AgentKit 运行时位于 `src/agentkit/`，两者必须保持解耦。

## 2. 当前代码结构
- `src/galaxy/native/`：渲染、输入、相机、键盘/触控交互。
- `src/galaxy/service/`：图数据加载、请求、图查询辅助。
- `src/galaxy/store/`：状态管理与事件响应。
- `src/galaxy/runtime/`：搜索、高亮、链路显示等命令式运行时封装。
- `src/galaxy/search/`：搜索 UI 与查询触发。
- `src/galaxy/nodeDetails/`：节点详情与多生态模板。
- `src/galaxy/windows/`：分析窗口与窗口管理。
- `src/agentkit/`：AgentKit runtime、docs、config 框架代码。
- `tools/agentkit/`：仓库级任务入口脚本，负责把任务先纳入 AgentKit pipeline。
- `configs/`：AgentKit 配置入口，当前包含 `module_rules.yaml`、`skills_index.yaml`、`policy_rules.yaml`、`runtime.yaml`、`system_profile.yaml`。
- `docs/templates/`：AgentKit starter 文档模板。
- `docs/generated/`：Agent 执行后的文档输出与持久化状态快照。

## 3. 业务目标与工作底线
- 保持现有 AISupplyChainGalaxy 业务行为稳定，不破坏已有页面、窗口、搜索与渲染链路。
- 所有新增 Agent 能力优先以新增目录、配置和 sidecar 文件落地，不直接改写核心业务模块。
- 除非明确获批，不覆盖已有关键文件，尤其是 `README.md`、`src/galaxy/**` 中的业务实现和现有对外行为。
- 如果必须改动关键文件，先说明风险、影响范围、回滚方式，再执行。

## 4. Mandatory Execution Protocol
1. 开始任务前必须读取并遵守：
   - `AGENTS.md`
   - `docs/VIBECODING/01_CONTENT_AWARENESS.md`
   - `docs/VIBECODING/02_CODE_STANDARDS.md`
   - `docs/VIBECODING/03_MODULE_BOUNDARIES.md`
   - `docs/VIBECODING/04_THINK_EXECUTE_LOOP.md`
   - `configs/policy_rules.yaml`
   - `configs/module_rules.yaml`
   - `configs/skills_index.yaml`
   - `configs/runtime.yaml`
2. 读取规则后、动手前，必须先通过 AgentKit pipeline 建立任务状态。默认入口命令为：
   - `python tools/agentkit/run_task.py start --title "<task title>" --goal "<task goal>"`
3. 在成功生成以下产物前，不得修改业务代码或文档：
   - `docs/generated/runtime_state/<task_id>.json`
   - `docs/generated/runtime_snapshot.<task_id>.json`
   - `docs/generated/task_model.md`
4. 动手前必须明确：
   - 任务目标
   - 影响文件/模块
   - 数据流变化
   - 风险点
   - 验证方式
5. 执行过程中，所有高风险或破坏性动作必须先获得人工确认。
6. 每次任务至少补齐以下执行留痕：
   - `docs/generated/task_model.md`
   - `docs/generated/decision_log.md`
   - `docs/generated/handoff_note.md`
7. 如任务涉及里程碑、风险或项目边界变化，应同步参考或更新：
   - `docs/generated/project_charter.md`
   - `docs/generated/risk_register.*.md`
   - `docs/generated/milestone_report*.md`
8. 最终输出至少包含：
   - 变更清单
   - 验证结果
   - 回滚点
   - 剩余风险或下一步建议

## 5. 内容感知基线
每次开始任务前，先确认以下 5 项：
- 业务目标：这次改动解决哪个用户场景？
- 影响模块：涉及 `service/`、`store/`、`runtime/`、`windows/`、`nodeDetails/` 的哪些文件？
- 数据流：输入数据从哪里来，状态在哪个 Store，最终由哪个视图消费？
- 风险点：是否影响渲染性能、事件风暴、路由加载、窗口状态同步？
- 验证方式：如何证明功能正确且无明显回归？

详细说明见 `docs/VIBECODING/01_CONTENT_AWARENESS.md`。

## 6. 模块边界
允许依赖方向以 `docs/VIBECODING/03_MODULE_BOUNDARIES.md` 与 `configs/module_rules.yaml` 为准，当前基本原则如下：
- `windows -> store/service/runtime/utils/nodeDetails/search`
- `search -> store/service/runtime/utils`
- `runtime -> store/service/utils`
- `nodeDetails -> store/service/utils`
- `store -> service/utils`
- `service -> utils`
- `native -> service/store/utils`
- `utils -> (none)`

明确禁止：
- `store` 依赖 `windows/search/nodeDetails/runtime/native`
- `service` 依赖 `windows/search/nodeDetails/runtime/native/store`
- `runtime` 依赖 `windows/search/nodeDetails/native`
- `native` 依赖 `windows/search/nodeDetails/runtime`
- `utils` 依赖任何业务域模块

当前已有 3 个历史耦合已被 allowlist 记录，可暂时保留但不能扩散：
- `src/galaxy/native/sceneKeyboardBinding.js` -> `nodeDetails`
- `src/galaxy/service/graphLoader.js` -> `native`
- `src/galaxy/store/minimapStore.js` -> `nodeDetails`

## 7. AgentKit 在本仓库中的职责
- AgentKit 是仓库级任务入口和状态机框架，不再只是示例代码或文档辅助层。
- 每个任务都必须先经过 `tools/agentkit/run_task.py`，形成持久化 runtime state 后才能进入实现阶段。
- AgentKit 负责提供任务运行骨架、配置入口、文档模板和执行留痕机制。
- AgentKit 不直接替代 `src/galaxy/` 的业务渲染与界面逻辑，但它约束这些改动的执行顺序和留痕输出。
- `examples/mock_pipeline.py` 仅用于验证 runtime 示例能力，不替代仓库正式任务入口。
- `README.starter.md`、`AGENTS.starter.md`、`*.starter.*` 文件是 sidecar 参考，不替代主项目文档。

## 8. 技能与配置使用规则
- Agent 能力索引以 `configs/skills_index.yaml` 为准。
- 模块边界以 `configs/module_rules.yaml` 为准。
- 高风险动作策略以 `configs/policy_rules.yaml` 为准。
- 运行时默认参数与强制入口以 `configs/runtime.yaml` 为准。
- 若 sidecar 文件存在，应先比较 `*.starter.*` 与主文件差异，再决定是否合并。

## 9. 验证要求
至少按任务类型选择合适校验：
- 仓库任务入口校验：`python tools/agentkit/run_task.py start --title "<task title>" --goal "<task goal>"`
- 仓库任务状态检查：`python tools/agentkit/run_task.py status <task_id>`
- 模块边界校验：`npm run check:boundaries` 或 `npm run check:vibe`
- AgentKit Python 测试：`python -m pytest`
- AgentKit 示例运行：`python examples/mock_pipeline.py`
- 前端改动验证：说明是否影响页面加载、图谱渲染、搜索、窗口状态或节点详情

如果受环境限制无法执行，必须在结果中明确写出未执行项及原因。

## 10. Definition of Done
一个任务完成，至少满足：
- 代码可运行，或明确说明受限原因。
- 未引入新的模块边界违规，或已记录临时豁免及清理计划。
- 文档与代码一致，不出现描述与实现冲突。
- 对外行为变化被说明，包括路由、事件、配置、输出格式。
- 任务先经过 AgentKit pipeline 建档并持久化状态，再进入实现与验证。
- 任务结果可被追溯，至少包含 Think、Execute、Verify；Reflect 可选但推荐。
