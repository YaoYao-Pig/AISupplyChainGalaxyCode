# Task Model

## Context Snapshot
- Feature/Issue: Unify the visual format of the galaxy search box and popup windows.
- User Story: As a graph analyst, I want search and popup surfaces to look consistent so the UI feels coherent while I browse nodes and analysis results.
- Affected Modules: `src/galaxy/search/searchBoxView.jsx`, `src/galaxy/windows/DraggableWindow.jsx`, `src/galaxy/windows/InheritanceRiskWindow.jsx`, `src/styles/search.less`, `src/styles/main.less`.
- Data Flow: Search input still flows through `searchBoxModel` and `appEvents`; window rendering still flows through `windowCollectionModel` to `DraggableWindow`; no store/service/runtime contracts changed.
- Risks: Style overrides could affect popup sizing, mobile layout, search result visibility, and pathfinding control usability.
- Validation Plan: Inspect class wiring, run `npm run check:vibe` if available, and verify that search, node list windows, pathfinding, and inheritance risk popups still mount through the shared shell.

## Think
- Goal: Standardize the visual shell for the top search box and all draggable popup windows with minimal behavioral impact.
- Non-goals: Changing search logic, event contracts, window ordering, or business analysis content.
- Affected modules/files: Search UI, shared draggable window shell, inheritance risk popup, shared LESS styles.
- Risks & rollback: If layout regressions appear, revert the appended LESS overrides and the class-name wiring in the three React components.
- Acceptance criteria: Search box and results share the same surface language as popups; popup headers/body spacing are consistent; pathfinding and inheritance windows no longer look visually isolated.

## Execute
- [x] Added shared class hooks to the search box shell and dropdown.
- [x] Updated `DraggableWindow` to honor `class` and `className` consistently while exposing a shared surface class.
- [x] Replaced inheritance popup inline styling with stylesheet-driven classes.
- [x] Appended unified LESS overrides for search, popups, pathfinding, and inheritance risk layouts.

## Verify
- Commands: Pending runtime checks.
- Manual checks: Pending in-browser verification.
- Result: Static review completed; automated verification follows.

## Reflect
- Improvements next: Extract popup design tokens into a dedicated LESS partial if more overlays are added.
