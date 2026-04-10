# Handoff Note

- Task ID: fix-sidebar-license-metadata-missing
- Status: COMPLETED

## Summary
Restored right-sidebar license metadata by fixing license resolution upstream in the node details view-model path. The sidebar now falls back to normalized `fixed_license` data when raw `license` is absent, while keeping existing Download and Like rendering untouched.

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
- Other modules still reading `nodeData.license` directly may need the same fallback if upstream graph payloads have broadly shifted to `fixed_license`.
