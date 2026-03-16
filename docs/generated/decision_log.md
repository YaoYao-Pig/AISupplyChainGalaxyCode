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
