---
id: handoff_note
title: Handoff Note
purpose: Provide next team with concise project handoff context
owner_agent: aisupplychain_delivery_agent
created_when: task_completed
updated_when: task_completed
input_sources:
- runtime.state.summaries
render_strategy: token_v1
write_strategy: overwrite
output_path: docs/generated/handoff_note.md
---
# {{title}}

- Task ID: {{task_id}}
- Status: {{status}}

## Summary
{{summary}}

## Follow-ups
{{follow_ups}}

## Existing Project Constraints
- Preserve current React/WebGL business code under `src/galaxy/`
- Keep original `README.md` and `AGENTS.md`; use starter variants for comparison
