# Handoff Note

- Task ID: fix-sidebar-license-metadata-missing
- Status: COMPLETED

## Summary
Restored right-sidebar license metadata by fixing license resolution upstream in the node details view-model path. The sidebar now prefers user-facing license fields (`license:` tag or `license_name`) and only uses normalized fallback data when necessary, while keeping existing Download and Like rendering untouched.

## Changed Files
- `src/galaxy/utils/resolveNodeLicense.js`
- `src/galaxy/store/baseNodeViewModel.js`
- `src/galaxy/nodeDetails/nodeDetailsStore.js`
- `docs/generated/task_model.md`
- `docs/generated/decision_log.md`
- `docs/generated/handoff_note.md`

## Verification
- `npm run check:vibe` -> PASS

## Rollback
- Revert the changes in the three source files above to return to the prior license-resolution behavior.

## Remaining Risks
- Other modules still reading `nodeData.license` or raw `license:` tags directly may need the same display-oriented resolver if they should surface `license_name` instead of placeholders like `license:None`.



