from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class TaskStatus(str, Enum):
    INIT = "INIT"
    TASK_MODELING = "TASK_MODELING"
    READY_FOR_EXECUTION = "READY_FOR_EXECUTION"
    PRECHECK = "PRECHECK"
    EXECUTING = "EXECUTING"
    POSTCHECK = "POSTCHECK"
    REPLAN = "REPLAN"
    WAIT_FOR_APPROVAL = "WAIT_FOR_APPROVAL"
    VALIDATING_TASK = "VALIDATING_TASK"
    DELIVERING = "DELIVERING"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"


class PolicyDecision(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    REQUIRE_REVIEW = "require_review"


@dataclass(slots=True)
class EvidenceRef:
    path: str
    lines: str | None = None
    note: str | None = None


@dataclass(slots=True)
class Summary:
    step_id: str
    content: str
    created_at: str = field(default_factory=utc_now_iso)


@dataclass(slots=True)
class PolicyResult:
    decision: PolicyDecision
    reason: str
    risk_level: str = "low"


@dataclass(slots=True)
class Action:
    id: str
    action_type: str
    params: dict[str, Any]


@dataclass(slots=True)
class ActionResult:
    action_id: str
    status: str
    summary: Summary
    evidence: list[EvidenceRef] = field(default_factory=list)
    output: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class Task:
    id: str
    title: str
    goal: str
    constraints: list[str]
    success_criteria: list[str]
    input_sources: list[str] = field(default_factory=list)

    def validate(self) -> None:
        if not self.id.strip():
            raise ValueError("task.id is required")
        if not self.goal.strip():
            raise ValueError("task.goal is required")


@dataclass(slots=True)
class TaskModel:
    task: Task
    global_plan: list[str]
    next_actions: list[Action]
    risk_points: list[str] = field(default_factory=list)


@dataclass(slots=True)
class ExecutionRecord:
    step_id: int
    action: Action
    policy_result: PolicyResult
    result: ActionResult
    created_at: str = field(default_factory=utc_now_iso)


@dataclass(slots=True)
class PipelineState:
    task_id: str
    status: TaskStatus = TaskStatus.INIT
    current_phase: str = "init"
    summaries: list[Summary] = field(default_factory=list)
    evidence_refs: list[EvidenceRef] = field(default_factory=list)
    records: list[ExecutionRecord] = field(default_factory=list)
    retries: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)

    def add_record(self, record: ExecutionRecord) -> None:
        self.records.append(record)
        self.summaries.append(record.result.summary)
        self.evidence_refs.extend(record.result.evidence)


@dataclass(slots=True)
class RuntimeOutcome:
    status: TaskStatus
    state: PipelineState
    message: str
