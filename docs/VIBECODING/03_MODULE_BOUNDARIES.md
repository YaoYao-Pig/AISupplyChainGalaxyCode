# 03. 模块描述与隔离（Module Boundaries）

## 1. 模块职责
- `native/`：渲染、输入、相机与底层交互能力。
- `service/`：数据拉取、数据结构生成、查询辅助。
- `store/`：状态管理与事件响应。
- `runtime/`：对外命令式调用封装（搜索/高亮/链路显示）。
- `search/`：搜索 UI 与查询触发。
- `nodeDetails/`：详情面板与各生态模板。
- `windows/`：业务分析窗口与窗口管理。
- `utils/`：通用纯工具。

## 2. 依赖方向（允许）
- `windows -> store/service/runtime/utils/nodeDetails/search`
- `search -> store/service/runtime/utils`
- `runtime -> store/service/utils`
- `nodeDetails -> store/service/utils`
- `store -> service/utils`
- `service -> utils`
- `native -> service/store/utils`
- `utils -> (none)`

原则：尽量从上层 UI 向下依赖，不反向依赖。

## 3. 禁止依赖
- `store` 不可依赖 `windows/search/nodeDetails/runtime/native`。
- `service` 不可依赖 `windows/search/nodeDetails/runtime/native/store`。
- `runtime` 不可依赖 `windows/search/nodeDetails/native`。
- `native` 不可依赖 `windows/search/nodeDetails/runtime`。
- `utils` 不可依赖任何业务域模块。

## 4. 跨模块通信方式
- 首选：`appEvents` + store 状态同步。
- 次选：通过 service 暴露稳定函数。
- 避免：组件直接跨域读写内部状态。

## 5. 自动检查
执行：
```bash
npm run check:boundaries
```

脚本位置：`tools/quality/check-module-boundaries.js`。
如果出现违规 import，需先修复；确有必要时在评审中写明临时豁免原因和清理计划。
