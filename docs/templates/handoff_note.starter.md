---
id: handoff_note
title: Handoff Note
purpose: Provide next team with concise project handoff context
owner_agent: delivery_agent
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
