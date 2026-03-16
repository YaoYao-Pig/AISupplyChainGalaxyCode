from __future__ import annotations

import json
from dataclasses import asdict, is_dataclass
from pathlib import Path

from ..interfaces import StateStore
from ..models import PipelineState, utc_now_iso


class JsonStateStore(StateStore):
    def __init__(self, root_dir: str) -> None:
        self.root_dir = Path(root_dir)
        self.root_dir.mkdir(parents=True, exist_ok=True)

    def load(self, task_id: str) -> PipelineState | None:
        path = self.root_dir / f"{task_id}.json"
        if not path.exists():
            return None
        payload = json.loads(path.read_text(encoding="utf-8"))
        return _state_from_dict(payload)

    def save(self, state: PipelineState) -> None:
        path = self.root_dir / f"{state.task_id}.json"
        serialized = _to_serializable(state)
        path.write_text(json.dumps(serialized, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _to_serializable(value):
    if is_dataclass(value):
        return {key: _to_serializable(item) for key, item in asdict(value).items()}
    if isinstance(value, list):
        return [_to_serializable(item) for item in value]
    if isinstance(value, dict):
        return {key: _to_serializable(item) for key, item in value.items()}
    return value


def _state_from_dict(payload: dict) -> PipelineState:
    from ..models import Action, ActionResult, EvidenceRef, ExecutionRecord, PolicyDecision, PolicyResult, Summary, TaskStatus

    state = PipelineState(
        task_id=payload["task_id"],
        status=TaskStatus(payload.get("status", TaskStatus.INIT.value)),
        current_phase=payload.get("current_phase", "init"),
        retries=payload.get("retries", 0),
        metadata=payload.get("metadata", {}),
    )
    state.summaries = [Summary(**item) for item in payload.get("summaries", [])]
    state.evidence_refs = [EvidenceRef(**item) for item in payload.get("evidence_refs", [])]
    records = []
    for item in payload.get("records", []):
        action = Action(**item["action"])
        result_payload = item["result"]
        result = ActionResult(
            action_id=result_payload["action_id"],
            status=result_payload["status"],
            summary=Summary(**result_payload["summary"]),
            evidence=[EvidenceRef(**ref) for ref in result_payload.get("evidence", [])],
            output=result_payload.get("output", {}),
        )
        policy_payload = item["policy_result"]
        policy_result = PolicyResult(
            decision=PolicyDecision(policy_payload["decision"]),
            reason=policy_payload["reason"],
            risk_level=policy_payload.get("risk_level", "low"),
        )
        records.append(
            ExecutionRecord(
                step_id=item["step_id"],
                action=action,
                policy_result=policy_result,
                result=result,
                created_at=item.get("created_at", utc_now_iso()),
            )
        )
    state.records = records
    return state
