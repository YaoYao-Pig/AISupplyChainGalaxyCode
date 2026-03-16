---
id: task_model
title: Task Model
purpose: Capture runtime task status, phase, and planned actions
owner_agent: planning_agent
created_when: task_modeling
updated_when: postcheck
input_sources:
  - runtime.task
  - runtime.state
render_strategy: token_v1
write_strategy: overwrite
output_path: docs/generated/task_model.md
---
# {{title}}

- Task ID: {{task_id}}
- Goal: {{goal}}
- Current Phase: {{current_phase}}
- Status: {{status}}

## Next Actions
{{next_actions}}
