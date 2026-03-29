# Handoff Note

- Task ID: group-doc-browser-sections
- Status: COMPLETED

## Summary
应用内文档浏览器现在会按两组显示文档：
- 正式文档：来自仓库根目录 `docs/`
- 历史文档：来自 `src/docs/`

## What Changed
- 更新 `src/DocsPage.jsx`。
- `loadDocs()` 现在同时加载正式文档和历史文档。
- 文档对象新增 `section` 和 `sectionWeight`，用于分组和稳定排序。
- 新增 `groupDocs()`，侧栏改为按“正式文档 / 历史文档”输出。
- 保留搜索、深链、正文渲染和 TOC 行为。
- 更新 `docs/generated/task_model.md`、`docs/generated/decision_log.md`、`docs/generated/handoff_note.md`。

## Verification
- 已执行 `node .\node_modules\webpack\bin\webpack.js --config webpack.production.config.js --bail`，通过。
- 已执行 `npm run check:boundaries`，通过。
- webpack 输出确认同时打包 `./docs/...` 和 `./src/docs` 两套 Markdown context。

## Remaining Notes
- 现在历史文档仍保留在 `src/docs/`，只是展示上被单独分组。
- 如果以后希望彻底统一文档来源，建议把历史文档迁入 `docs/legacy/`，再把前端侧白名单同步收敛到 `docs/` 一处。
