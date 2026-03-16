---
id: milestone_report
title: Milestone Report
purpose: Summarize milestone-level progress metrics
owner_agent: state_agent
created_when: task_completed
updated_when: task_completed
input_sources:
  - runtime.state.records
  - runtime.state.evidence
render_strategy: token_v1
write_strategy: versioned
output_path: docs/generated/milestone_report.md
---
# {{title}}

- Task ID: {{task_id}}
- Milestone: {{milestone_name}}
- Status: {{status}}
- Records: {{record_count}}
- Evidence: {{evidence_count}}
