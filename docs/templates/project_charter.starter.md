---
id: project_charter
title: Project Charter
purpose: Define mission, scope, and constraints for the project
owner_agent: planning_agent
created_when: task_modeling
updated_when: task_completed
input_sources:
  - runtime.task
  - runtime.state
render_strategy: token_v1
write_strategy: overwrite
output_path: docs/generated/project_charter.md
---
# {{title}}

- Task ID: {{task_id}}
- Mission: {{mission}}
- Goal: {{goal}}

## Scope
{{scope}}

## Constraints
{{constraints}}

## Success Criteria
{{success_criteria}}
