# 04. Think-Execute 循环

## 1. 循环定义
- Think：定义问题、边界、方案、风险、验收。
- Execute：按最小可交付单元实现。
- Verify：自动检查 + 最小手测。
- Reflect：记录经验与后续优化。

## 2. 标准流程
1. Think
- 复述需求（目标、非目标）。
- 标注影响文件与模块。
- 识别风险与回滚方案。
- 定义验收标准（可执行）。

2. Execute
- 先改最关键路径。
- 每完成一小步就保持可运行状态。
- 不在同一任务中混入无关重构。

3. Verify
- 运行 `npm run check:vibe`。
- 手动验证核心交互链路。
- 记录失败项与原因。

4. Reflect
- 记录本次有效模式（可复用模板）。
- 记录技术债与优先级。

## 3. 任务模板
```md
## Think
- Goal:
- Non-goals:
- Affected modules/files:
- Risks & rollback:
- Acceptance criteria:

## Execute
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Verify
- Commands:
- Manual checks:
- Result:

## Reflect
- Improvements next:
```

## 4. 最小验收建议
- 场景可加载。
- 搜索可定位节点。
- 至少一个分析窗口可正常打开并更新。
- 控制台无新增高频报错。
