from __future__ import annotations

from dataclasses import dataclass

from ..interfaces import Executor
from ..models import Action, ActionResult, EvidenceRef, PipelineState, Summary


@dataclass(slots=True)
class MockExecutor(Executor):
    fail_once_on: str | None = None
    _failed: bool = False

    def execute(self, action: Action, state: PipelineState) -> ActionResult:
        should_fail = self.fail_once_on and self.fail_once_on == action.id and not self._failed
        if should_fail:
            self._failed = True
            return ActionResult(
                action_id=action.id,
                status="failed",
                summary=Summary(step_id=action.id, content="Execution failed; requires replan."),
                evidence=[EvidenceRef(path="runtime://mock_executor", note="simulated failure")],
                output={"error": "simulated_failure"},
            )
        return ActionResult(
            action_id=action.id,
            status="success",
            summary=Summary(step_id=action.id, content="Action executed successfully."),
            evidence=[EvidenceRef(path="runtime://mock_executor", note="simulated success")],
            output={"result": "ok", "params": action.params},
        )
