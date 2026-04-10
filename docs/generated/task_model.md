# AISupplyChainGalaxyCode Agent Integration Task Model

- Task ID: fix-sidebar-license-metadata-missing
- Goal: Restore license and related metadata display in the right sidebar node details without breaking existing download/like rendering.
- Current Phase: verify
- Status: COMPLETED

## Think
- Feature/Issue: The right sidebar still renders metadata rows, but the displayed license regressed because the view-model path was not resolving the user-facing license field consistently for the current graph payload.
- User Story: When a user selects a model node, the right sidebar should continue showing License alongside Downloads, Likes, and other metadata.
- Affected Modules: `src/galaxy/store/baseNodeViewModel.js`, `src/galaxy/nodeDetails/nodeDetailsStore.js`, `src/galaxy/utils/resolveNodeLicense.js`.
- Data Flow: `graphLoader` loads node/compliance data -> `graph.getComplianceDetails()` exposes compliance payload -> `baseNodeViewModel` builds `selectedNode` for `nodeDetailsStore` -> `scene.jsx` passes sidebar data into `SidebarView.jsx`.
- Risks: License precedence must prefer user-facing values (`license:` tag or `license_name`) without regressing nodes that only expose raw `license`; no new cross-module dependency violations.
- Validation Plan: Run `npm run check:vibe` and confirm the sidebar/license chain now resolve from `license:` tag, `license_name`, valid raw `license`, then fallback values.

## Execute
- Added a shared license resolver utility so the sidebar uses user-facing license text first and only falls back to normalized values when needed.
- Updated `baseNodeViewModel` to use the shared resolver for the selected node and inheritance chain entries.
- Updated `nodeDetailsStore` chain highlighting payload to use the same resolver.

## Verify
- Command: `npm run check:vibe`
- Result: PASS, with only the existing 3 allowlisted boundary warnings.

## Reflect
- Reuse the shared resolver in future places that still read `nodeData.license` directly if similar data-shape drift appears elsewhere.




