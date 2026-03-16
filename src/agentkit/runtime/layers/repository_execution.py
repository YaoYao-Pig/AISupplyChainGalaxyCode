from __future__ import annotations

from dataclasses import dataclass

from ..interfaces import Executor
from ..models import Action, ActionResult, EvidenceRef, PipelineState, Summary


@dataclass(slots=True)
class TaskBootstrapExecutor(Executor):
    """Records that a repository task has been bootstrapped through AgentKit before implementation begins."""

    def execute(self, action: Action, state: PipelineState) -> ActionResult:
        task_goal = action.params.get("goal", "")
        summary_text = f"Task bootstrapped through AgentKit pipeline: {task_goal}".strip()
        return ActionResult(
            action_id=action.id,
            status="success",
            summary=Summary(step_id=action.id, content=summary_text),
            evidence=[
                EvidenceRef(
                    path=f"runtime://task_bootstrap/{state.task_id}",
                    note="Repository task registered and approved for implementation entry.",
                )
            ],
            output={
                "task_goal": task_goal,
                "phase": state.current_phase,
                "task_id": state.task_id,
            },
        )
