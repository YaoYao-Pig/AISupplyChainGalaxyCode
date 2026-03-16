---
id: risk_register
title: Risk Register
purpose: Record observed risks and mitigations
owner_agent: validation_agent
created_when: postcheck
updated_when: replan
input_sources:
  - runtime.state
render_strategy: token_v1
write_strategy: snapshot
output_path: docs/generated/risk_register.md
---
# {{title}}

- Task ID: {{task_id}}

## Risks
{{risks}}

## Mitigations
{{mitigations}}
