## Decision Log Entry
- Task ID: ui-style-unification-20260316
- Step: 1
- Decision: Use `DraggableWindow` as the single popup shell instead of styling each window separately.
- Rationale: The shared shell already wraps most popup types, so visual consistency is cheapest and lowest risk there.

## Decision Log Entry
- Task ID: ui-style-unification-20260316
- Step: 2
- Decision: Keep search behavior unchanged and only add styling hooks/classes.
- Rationale: The request is format unification, not search feature redesign; preserving `searchBoxModel` avoids behavior regressions.

## Decision Log Entry
- Task ID: ui-style-unification-20260316
- Step: 3
- Decision: Replace inheritance risk inline styles with stylesheet classes.
- Rationale: That popup was the most visually isolated component and inline styles made future consistency harder.


## Decision Log Entry
- Task ID: agentkit-mandatory-bootstrap
- Step: 2
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Make repository tasks enter AgentKit pipeline before implementation begins


## Decision Log Entry
- Task ID: starter-task-001
- Step: 1
- Decision: COMPLETED
- Rationale: Action executed successfully.


## Decision Log Entry
- Task ID: agentkit-mandatory-bootstrap
- Step: 3
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Make repository tasks enter AgentKit pipeline before implementation begins


## Decision Log Entry
- Task ID: agentkit-mandatory-entrypoint
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Make repository tasks enter AgentKit pipeline before implementation begins


## Decision Log Entry
- Task ID: progress-bar-for-loading-overlay
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Replace startup numeric loading indicator with a progress bar and move it to an adaptive top-left position that avoids the search box


## Decision Log Entry
- Task ID: avoid-node-detail-panel-overlap
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Keep the bottom-left node detail panel visible when the left sidebar is present so the sidebar no longer covers it


## Decision Log Entry
- Task ID: restore-bottom-left-node-detail-placement
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Keep the node detail panel anchored at the bottom-left while still avoiding overlap with the left sidebar


## Decision Log Entry
- Task ID: diagnose-pipeline-invalid-string-length
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Investigate hf-data pipeline failure with RangeError: Invalid string length after compliance analysis, identify root cause, and prepare a safe fix path.


## Decision Log Entry
- Task ID: diagnose-pipeline-invalid-string-length
- Step: 2
- Decision: Replace one-shot JSON writes with streamed output for large node and compliance payloads.
- Rationale: The failure occurs in JSON.stringify during fs.writeJson on oversized objects, so streaming removes the large intermediate string without changing the downstream file shape.


## Decision Log Entry
- Task ID: make-hf-data-filter-deterministic
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Remove nondeterministic node filtering in hf-data so repeated pipeline runs produce stable filtered input sizes and easier debugging.


## Decision Log Entry
- Task ID: reset-stale-layout-resume-snapshots
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Prevent hf-data convert_script.js from resuming ngraph layout from stale .bin snapshots when graph node counts change across runs.


## Decision Log Entry
- Task ID: task
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: 根据现有源码和功能效果，按模块整理项目技术文档并写入 docs 目录，保持技术文档风格且贴近人工写作语气

## Decision Log Entry
- Task ID: task
- Step: 2
- Decision: 按“系统总览 + 数据流 + 模块分册 + 功能工作流”组织文档，而不是只按目录平铺文件说明。
- Rationale: 用户要的是后续能维护项目的文档，不只是目录清单；把源码结构和用户可见功能一起写清楚，文档才有实际使用价值。

## Decision Log Entry
- Task ID: task
- Step: 3
- Decision: 正式整理稿落在 `docs/`，不顺手修改应用内 `/docs` 页面的数据来源。
- Rationale: 当前任务是整理仓库文档，不是重做文档系统；继续扩到 `src/docs` 路由层会放大影响面，也会混淆“业务改动”和“文档整理”。


## Decision Log Entry
- Task ID: task
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: 根据现有源码和功能效果，按模块整理项目技术文档并写入 docs 目录，保持技术文档风格且贴近人工写作语气

## Decision Log Entry
- Task ID: task
- Step: 4
- Decision: 文档浏览器只接入 `docs/` 下的正式文档白名单，不把 `docs/generated/` 和 `docs/templates/` 直接暴露到前端。
- Rationale: 用户要的是可直接阅读的正式文档，不是任务状态快照和模板源文件；白名单方式比扫整个 `docs/` 目录更稳，也更容易控噪。

## Decision Log Entry
- Task ID: task
- Step: 5
- Decision: 保留现有 `DocsPage` UI，只替换 Markdown 来源和少量提示文案。
- Rationale: 这次任务的目标是打通正式文档浏览，不是重做文档浏览器；改来源层风险最小，也不影响现有路由和交互习惯。


## Decision Log Entry
- Task ID: group-doc-browser-sections
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: 让应用内文档浏览器按正式文档和历史文档分组展示，同时保留 docs 作为正式来源、src/docs 作为历史来源

## Decision Log Entry
- Task ID: group-doc-browser-sections
- Step: 2
- Decision: 不把历史文档立刻迁移到 `docs/legacy/`，而是在浏览器层先按来源分组。
- Rationale: 这轮目标是改善阅读入口，不是做文档迁移；先分组能立刻让正式文档和历史文档并存且边界清晰，影响最小。

## Decision Log Entry
- Task ID: group-doc-browser-sections
- Step: 3
- Decision: 继续使用单一 `docs` 状态数组和现有 `activeIndex` / `doc=` 深链，只在渲染前按 `section` 分组。
- Rationale: 这样可以复用现有搜索、选中、正文渲染和 TOC 逻辑，避免为了分组把文档浏览器内部状态整体重写。
