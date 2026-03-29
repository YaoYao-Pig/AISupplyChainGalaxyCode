# Task Model

## Bootstrap
- Task command: `python tools/agentkit/run_task.py start --task-id "group-doc-browser-sections" --title "文档浏览器分组显示" --goal "让应用内文档浏览器按正式文档和历史文档分组展示，同时保留 docs 作为正式来源、src/docs 作为历史来源"`
- Task ID: `group-doc-browser-sections`
- Persisted state:
  - `docs/generated/runtime_state/group-doc-browser-sections.json`
  - `docs/generated/runtime_snapshot.group-doc-browser-sections.json`

## Think
- Goal: 让应用内文档浏览器侧栏按“正式文档”和“历史文档”分组显示，同时保留现有搜索、深链和目录阅读体验。
- Non-goals: 不重做文档浏览器 UI；不迁移旧文档文件；不把 `docs/generated/` 和 `docs/templates/` 纳入浏览列表。
- Affected modules/files:
  - `src/DocsPage.jsx`
  - `docs/generated/task_model.md`
  - `docs/generated/decision_log.md`
  - `docs/generated/handoff_note.md`
- Data flow changes:
  - 正式文档来源仍为 `docs/README.md`、`docs/architecture/*`、`docs/modules/*`、`docs/features/*`、`docs/VIBECODING/*`
  - 新增历史文档来源 `src/docs/*`
  - 前端侧栏从单一列表改为按 `section` 分组渲染
- Risks:
  - 搜索结果分组后影响激活态和点击选中文档逻辑。
  - 引入 `src/docs` 后，路径参数 `doc=` 的值需要继续唯一。
  - 如果分组变量未正确参与 `render()`，页面会直接报错。
- Validation plan:
  - 检查 `DocsPage.jsx` 中是否存在正式文档和历史文档两个 `require.context`。
  - 运行生产 webpack 编译，确认同时打包 `./docs/...` 与 `./src/docs`。
  - 运行 `npm run check:boundaries`。

## Execute
- [x] 复核仓库规则并通过 AgentKit bootstrap 建立任务状态。
- [x] 检查当前 `DocsPage.jsx`、`docs/`、`src/docs/` 的加载方式。
- [x] 为文档对象补充 `section` 与排序权重。
- [x] 将侧栏列表改为“正式文档 / 历史文档”分组渲染。
- [x] 保留搜索、`doc=` 深链和正文/TOC 逻辑。
- [x] 回写本次任务留痕文档。

## Verify
- Commands:
  - `node .\node_modules\webpack\bin\webpack.js --config webpack.production.config.js --bail`
  - `npm run check:boundaries`
- Manual checks:
  - 检查 `src/DocsPage.jsx` 中的 `loadDocs()` 和 `groupDocs()`。
  - 检查 `render()` 中是否使用 `grouped = groupDocs(filtered)`。
- Result:
  - 编译通过，webpack 输出同时包含 `./docs`、`./docs/architecture`、`./docs/modules`、`./docs/features`、`./docs/VIBECODING`、`./src/docs`。
  - 边界检查通过，仅保留仓库已有 allowlist 违规。

## Reflect
- Improvements next:
  - 如果后续还想继续整理历史文档，可以把 `src/docs` 迁到 `docs/legacy/`，这样前端和仓库文档来源会更统一。
  - 当前分组是按 section 简单输出，后续还可以再加组内排序规则或折叠状态，但不是这轮任务的必要项。
