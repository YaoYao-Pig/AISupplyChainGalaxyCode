# AISupplyChainGalaxyCode Agent Integration Task Model

- Task ID: repair-export-pipeline-regressions
- Goal: Fix export-script-driven regressions affecting sidebar license display, conflict highlighting, and timeline behavior without breaking the existing graph UI.
- Current Phase: verify
- Status: COMPLETED

## Think
- Feature/Issue: Recent export-pipeline changes drifted away from the frontend's long-standing graph data contract. `nodeData.json` could be emitted as an object keyed by node id, while node licenses could remain arrays. The frontend expects array-shaped `nodeData` and mostly string-shaped `license` values.
- User Story: After exporting graph data, users should still see correct sidebar license metadata, be able to highlight conflict nodes, and use the timeline without regressions.
- Affected Modules: `hf-data/convert_script.js`, `src/galaxy/service/graph.js`, `src/galaxy/utils/resolveNodeLicense.js`.
- Data Flow: `hf-data/dataTransfer/convert.py` emits source graph JSON -> `hf-data/convert_script.js` converts it into `nodeData.json`, `labels.json`, `compliance_data.json` -> `graphLoader` loads those files -> `graph.js` exposes normalized node/compliance data -> stores and renderer consume node metadata for license, conflict, and timeline features.
- Risks: The compatibility fix must preserve older valid array exports while tolerating object-shaped `nodeData`; export changes must not alter compliance id mapping or layout outputs.
- Validation Plan: Run `npm run check:vibe`; verify that the load-time graph model now normalizes object/array node data and stringifies export-time license values.

## Execute
- Added load-time normalization in `src/galaxy/service/graph.js` so existing broken exports are converted back into dense node arrays with scalar license fields.
- Tightened `src/galaxy/utils/resolveNodeLicense.js` so placeholder values like `license:None` do not override user-facing license text.
- Updated `hf-data/convert_script.js` so future exports write string license fields and array-shaped `nodeData.json` again.

## Verify
- Command: `npm run check:vibe`
- Result: PASS, with only the existing 3 allowlisted boundary warnings.
- Not Run: Full export pipeline / browser manual validation was not executed in this environment, so runtime confirmation against a freshly exported dataset is still pending.

## Reflect
- Treat `graph.js` as the compatibility boundary for data-shape drift; export scripts should still keep the stable on-disk contract to avoid pushing format assumptions into every store and renderer.
