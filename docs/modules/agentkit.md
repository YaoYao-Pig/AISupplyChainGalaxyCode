# AgentKit 模块

## 1. 这个模块在仓库里的角色

在这个仓库里，AgentKit 已经不是示例代码，它是正式的仓库任务入口。

它的职责不是替代 `src/galaxy/`，而是把“任务启动、状态持久化、文档留痕”这件事标准化。也就是说，AgentKit 约束的是工程执行流程，不是图谱页面的业务功能。

## 2. 主要目录

- `src/agentkit/runtime/`：任务状态机和执行引擎。
- `src/agentkit/config/`：配置模型与加载器。
- `src/agentkit/docs/`：模板读取、渲染、写入、更新策略。
- `tools/agentkit/run_task.py`：仓库级命令入口。
- `configs/`：运行时参数、模块边界、策略规则、技能索引。
- `docs/templates/`：文档模板。
- `docs/generated/`：生成结果。

## 3. 任务是怎么启动的

标准入口是：

```bash
python tools/agentkit/run_task.py start --title "<title>" --goal "<goal>"
```

`run_task.py` 做的事情包括：

1. 读取 `configs/` 下的完整配置。
2. 组装 `DefaultPipelineEngine`。
3. 运行任务 bootstrap。
4. 写入 `docs/generated/runtime_state/<task_id>.json`。
5. 写入 `docs/generated/runtime_snapshot.<task_id>.json`。
6. 按 trigger 更新模板文档。

也就是说，只要任务按规范启动，状态文件和一批配套文档就会自动更新。

## 4. Runtime 引擎怎么分层

`src/agentkit/runtime/engine.py` 里的 `DefaultPipelineEngine` 走的是一条比较标准的流水线：

- identity
- capability registry
- planner
- executor
- validator
- state store
- review hook

执行循环也很清楚：

1. task modeling
2. pre-check
3. review / deny / replan
4. execute
5. post-check
6. save state

这套设计的价值在于：哪怕任务本身很小，也有一致的状态轨迹可追。

## 5. 文档系统怎么工作

`src/agentkit/docs/service.py` 和周边模块负责把模板文档变成真实文件：

- `template_loader.py` 读 Markdown 模板。
- `renderer.py` 做 token 渲染。
- `writer.py` 按更新策略写文件。
- `service.py` 组合 registry、loader、renderer、writer。

模板定义来自 `docs/templates/`，生成结果落到 `docs/generated/`。

## 6. 配置入口

`src/agentkit/config/loader.py` 会一次性读取：

- `system_profile.yaml`
- `skills_index.yaml`
- `policy_rules.yaml`
- `module_rules.yaml`
- `runtime.yaml`

其中最值得维护者关注的是三类：

- `module_rules.yaml`：模块边界和允许路径。
- `policy_rules.yaml`：高风险动作的策略。
- `runtime.yaml`：状态文件路径、snapshot 路径、默认 action type。

## 7. 和 `src/galaxy/` 的关系

这层和图谱业务的正确关系应该是：

- AgentKit 约束任务执行顺序。
- Galaxy 继续承接图谱业务实现。
- 两边通过文档和规则发生协作，而不是直接混代码。

如果后面新增的是任务流程、质量校验、模板机制，优先改 AgentKit。
如果新增的是搜索、节点详情、图谱视图、分析窗口，优先改 Galaxy。

## 8. 当前维护建议

- 不要绕过 `run_task.py` 直接改文档或代码，仓库流程已经把 bootstrap 设成强约束。
- 生成文档是留痕，不是最终业务文档，两者不要混用。
- 如果要继续增强 AgentKit，优先保持它对 `src/galaxy/` 的低侵入性。
