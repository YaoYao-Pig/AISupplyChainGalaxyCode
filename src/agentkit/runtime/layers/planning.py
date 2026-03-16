from __future__ import annotations

from dataclasses import dataclass

from ..interfaces import Planner
from ..models import Action, PipelineState, Task, TaskModel


@dataclass(slots=True)
class MinimalPlanner(Planner):
    default_action_type: str = "mock_action"

    def model_task(self, task: Task, state: PipelineState) -> TaskModel:
        state.current_phase = "planning"
        action = Action(
            id=f"{task.id}-step-1",
            action_type=self.default_action_type,
            params={"goal": task.goal},
        )
        return TaskModel(
            task=task,
            global_plan=["model_task", "execute_actions", "validate_task"],
            next_actions=[action],
            risk_points=[],
        )

    def replan(self, task: Task, state: PipelineState, reason: str) -> TaskModel:
        state.current_phase = "replan"
        action = Action(
            id=f"{task.id}-replan-{len(state.records) + 1}",
            action_type=self.default_action_type,
            params={"goal": task.goal, "replan_reason": reason},
        )
        return TaskModel(
            task=task,
            global_plan=["replan", "execute_actions", "validate_task"],
            next_actions=[action],
            risk_points=[reason],
        )
