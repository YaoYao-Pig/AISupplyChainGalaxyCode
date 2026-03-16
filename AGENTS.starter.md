# AGENTS.md

## Mission
This repository is a reusable agent pipeline project scaffold.

## Working Rules
- Keep runtime, config, and document systems decoupled.
- Prefer typed schemas over free-form dictionaries.
- Keep policy, skill, storage, and renderer layers pluggable.
- Avoid domain-specific business logic in core runtime.

## Mandatory Execution Protocol
1. Read and comply with:
   - AGENTS.md
   - configs/policy_rules.yaml
   - configs/module_rules.yaml
   - configs/skills_index.yaml
2. Before edits, provide:
   - task model
   - impacted scope
   - risk points
3. Run validation pre-check and post-check for each action.
4. Update docs/generated at least:
   - task_model
   - decision_log
   - handoff_note
5. For destructive/high-risk actions, request human approval first.
6. Final output must include:
   - changed files
   - evidence references
   - remaining risks/todos

## Customization Targets
- `configs/module_rules.yaml`
- `configs/skills_index.yaml`
- `docs/templates/*.md`
- `src/agentkit/runtime/layers/*`
