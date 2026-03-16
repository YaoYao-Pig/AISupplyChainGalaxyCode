## Decision Log Entry
- Task ID: ui-style-unification-20260316
- Step: 1
- Decision: Use `DraggableWindow` as the single popup shell instead of styling each window separately.
- Rationale: The shared shell already wraps most popup types, so visual consistency is cheapest and lowest risk there.

## Decision Log Entry
- Task ID: ui-style-unification-20260316
- Step: 2
- Decision: Keep search behavior unchanged and only add styling hooks/classes.
- Rationale: The request is format unification, not search feature redesign; preserving `searchBoxModel` avoids behavior regressions.

## Decision Log Entry
- Task ID: ui-style-unification-20260316
- Step: 3
- Decision: Replace inheritance risk inline styles with stylesheet classes.
- Rationale: That popup was the most visually isolated component and inline styles made future consistency harder.


## Decision Log Entry
- Task ID: agentkit-mandatory-bootstrap
- Step: 2
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Make repository tasks enter AgentKit pipeline before implementation begins


## Decision Log Entry
- Task ID: starter-task-001
- Step: 1
- Decision: COMPLETED
- Rationale: Action executed successfully.


## Decision Log Entry
- Task ID: agentkit-mandatory-bootstrap
- Step: 3
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Make repository tasks enter AgentKit pipeline before implementation begins


## Decision Log Entry
- Task ID: agentkit-mandatory-entrypoint
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Make repository tasks enter AgentKit pipeline before implementation begins


## Decision Log Entry
- Task ID: progress-bar-for-loading-overlay
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Replace startup numeric loading indicator with a progress bar and move it to an adaptive top-left position that avoids the search box


## Decision Log Entry
- Task ID: avoid-node-detail-panel-overlap
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Keep the bottom-left node detail panel visible when the left sidebar is present so the sidebar no longer covers it


## Decision Log Entry
- Task ID: restore-bottom-left-node-detail-placement
- Step: 1
- Decision: COMPLETED
- Rationale: Task bootstrapped through AgentKit pipeline: Keep the node detail panel anchored at the bottom-left while still avoiding overlap with the left sidebar
