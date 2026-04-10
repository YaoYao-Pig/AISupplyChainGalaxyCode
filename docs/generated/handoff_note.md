# Handoff Note

- Task ID: repair-export-pipeline-regressions
- Status: COMPLETED

## Summary
Repaired the export-driven data contract drift that was breaking three features at once: sidebar license display, conflict highlighting, and timeline filtering. Existing broken exports are now normalized at load time, and future exports are aligned back to the frontend's expected `nodeData` and `license` shapes.

## Changed Files
- `src/galaxy/service/graph.js`
- `src/galaxy/utils/resolveNodeLicense.js`
- `hf-data/convert_script.js`
- `docs/generated/task_model.md`
- `docs/generated/decision_log.md`
- `docs/generated/handoff_note.md`

## Verification
- `npm run check:vibe` -> PASS
- Full export rerun and browser-side manual verification were not run in this environment.

## Rollback
- Revert the changes in `src/galaxy/service/graph.js`, `src/galaxy/utils/resolveNodeLicense.js`, and `hf-data/convert_script.js` to return to the previous export/consumption behavior.

## Remaining Risks
- Existing exported datasets that were generated with the broken script should now load, but a fresh export is still recommended to restore the canonical on-disk format.
- Any external tools that consumed the object-shaped `nodeData.json` written by the broken exporter would need to adjust back to the array contract after re-exporting.
