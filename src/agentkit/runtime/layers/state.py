from __future__ import annotations

from dataclasses import dataclass, field

from ..interfaces import ReviewHook, StateStore
from ..models import Action, PipelineState, PolicyResult


@dataclass(slots=True)
class InMemoryStateStore(StateStore):
    store: dict[str, PipelineState] = field(default_factory=dict)

    def load(self, task_id: str) -> PipelineState | None:
        return self.store.get(task_id)

    def save(self, state: PipelineState) -> None:
        self.store[state.task_id] = state


@dataclass(slots=True)
class AutoApproveReviewHook(ReviewHook):
    approve: bool = True

    def request_review(self, action: Action, policy_result: PolicyResult) -> bool:
        return self.approve
