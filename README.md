# AISupplyChainGalaxyCode

项目运行网站：https://ai-supplychain.x-lab.info/#/galaxy/my_model_galaxy?cx=0&cy=0&cz=0&lx=0.0000&ly=0.0000&lz=0.0000&lw=1.0000&ml=150&s=1.75&l=0&v=v1_updated_links  
[主要仓库](https://github.com/YaoYao-Pig/AISupplyChainGalaxy)

## VibeCoding 改造入口
- 协作规范：`AGENTS.md`
- 内容感知：`docs/VIBECODING/01_CONTENT_AWARENESS.md`
- 代码规范：`docs/VIBECODING/02_CODE_STANDARDS.md`
- 模块边界：`docs/VIBECODING/03_MODULE_BOUNDARIES.md`
- Think-Execute 循环：`docs/VIBECODING/04_THINK_EXECUTE_LOOP.md`

## 质量检查
```bash
npm run check:vibe
```
该命令会执行模块边界检查。现有历史耦合已记录在 `tools/quality/boundary-allowlist.json`，新增违规会直接失败。
