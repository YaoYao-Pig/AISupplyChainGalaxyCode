from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from .models import (
    Action,
    ActionResult,
    PipelineState,
    PolicyResult,
    RuntimeOutcome,
    Task,
    TaskModel,
)


class IdentityProvider(ABC):
    @abstractmethod
    def get_identity(self) -> dict[str, Any]:
        raise NotImplementedError


class CapabilityRegistry(ABC):
    @abstractmethod
    def available_actions(self) -> list[str]:
        raise NotImplementedError


class Planner(ABC):
    @abstractmethod
    def model_task(self, task: Task, state: PipelineState) -> TaskModel:
        raise NotImplementedError

    @abstractmethod
    def replan(self, task: Task, state: PipelineState, reason: str) -> TaskModel:
        raise NotImplementedError


class Executor(ABC):
    @abstractmethod
    def execute(self, action: Action, state: PipelineState) -> ActionResult:
        raise NotImplementedError


class Validator(ABC):
    @abstractmethod
    def pre_check(self, action: Action, state: PipelineState) -> PolicyResult:
        raise NotImplementedError

    @abstractmethod
    def post_check(self, result: ActionResult, state: PipelineState) -> PolicyResult:
        raise NotImplementedError


class StateStore(ABC):
    @abstractmethod
    def load(self, task_id: str) -> PipelineState | None:
        raise NotImplementedError

    @abstractmethod
    def save(self, state: PipelineState) -> None:
        raise NotImplementedError


class ReviewHook(ABC):
    @abstractmethod
    def request_review(self, action: Action, policy_result: PolicyResult) -> bool:
        raise NotImplementedError


class PipelineEngine(ABC):
    @abstractmethod
    def run(self, task: Task) -> RuntimeOutcome:
        raise NotImplementedError
