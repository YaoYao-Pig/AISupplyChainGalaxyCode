---
id: decision_log
title: Decision Log
purpose: Track runtime decisions and rationale by step
owner_agent: execution_agent
created_when: postcheck
updated_when: postcheck
input_sources:
  - runtime.state.summaries
render_strategy: token_v1
write_strategy: append
output_path: docs/generated/decision_log.md
---
## {{title}} Entry
- Task ID: {{task_id}}
- Step: {{step}}
- Decision: {{decision}}
- Rationale: {{rationale}}
