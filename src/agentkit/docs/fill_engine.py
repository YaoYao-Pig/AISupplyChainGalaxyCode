from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from agentkit.runtime.models import PipelineState, Task

from .models import DocumentUpdateResult
from .registry import DocumentRegistry
from .service import DocumentService


@dataclass(slots=True)
class RuntimeDocumentInput:
    task: Task
    state: PipelineState


ContextBuilder = Callable[[RuntimeDocumentInput], dict[str, object]]


def _list_to_markdown(items: list[str]) -> str:
    if not items:
        return "- n/a"
    return "\n".join(f"- {item}" for item in items)


def _build_project_charter(payload: RuntimeDocumentInput) -> dict[str, object]:
    return {
        "task_id": payload.task.id,
        "mission": payload.task.title,
        "goal": payload.task.goal,
        "scope": "Reusable runtime, configs, docs",
        "constraints": _list_to_markdown(payload.task.constraints),
        "success_criteria": _list_to_markdown(payload.task.success_criteria),
    }


def _build_task_model(payload: RuntimeDocumentInput) -> dict[str, object]:
    actions = [f"{record.action.action_type}:{record.action.id}" for record in payload.state.records]
    return {
        "task_id": payload.task.id,
        "goal": payload.task.goal,
        "current_phase": payload.state.current_phase,
        "status": payload.state.status.value,
        "next_actions": _list_to_markdown(actions),
    }


def _build_decision_log(payload: RuntimeDocumentInput) -> dict[str, object]:
    step = payload.state.records[-1].step_id if payload.state.records else 0
    summary = payload.state.summaries[-1].content if payload.state.summaries else "No decisions yet"
    return {
        "task_id": payload.task.id,
        "step": step,
        "decision": payload.state.status.value,
        "rationale": summary,
    }


def _build_risk_register(payload: RuntimeDocumentInput) -> dict[str, object]:
    risks: list[str] = []
    if payload.state.retries > 0:
        risks.append(f"retries observed: {payload.state.retries}")
    if not risks:
        risks.append("no runtime risks observed")
    return {
        "task_id": payload.task.id,
        "risks": _list_to_markdown(risks),
        "mitigations": "- Use validation hooks and replan path",
    }


def _build_milestone_report(payload: RuntimeDocumentInput) -> dict[str, object]:
    return {
        "task_id": payload.task.id,
        "milestone_name": "task_bootstrapped",
        "status": payload.state.status.value,
        "record_count": len(payload.state.records),
        "evidence_count": len(payload.state.evidence_refs),
    }


def _build_handoff_note(payload: RuntimeDocumentInput) -> dict[str, object]:
    latest_summary = payload.state.summaries[-1].content if payload.state.summaries else "No summary"
    return {
        "task_id": payload.task.id,
        "status": payload.state.status.value,
        "summary": latest_summary,
        "follow_ups": "- Start implementation only after confirming impacted modules and risks\n- Keep runtime state and generated docs aligned with actual execution",
    }


DEFAULT_CONTEXT_BUILDERS: dict[str, ContextBuilder] = {
    "project_charter": _build_project_charter,
    "task_model": _build_task_model,
    "decision_log": _build_decision_log,
    "risk_register": _build_risk_register,
    "milestone_report": _build_milestone_report,
    "handoff_note": _build_handoff_note,
}


@dataclass(slots=True)
class RuntimeDocumentFillEngine:
    registry: DocumentRegistry
    service: DocumentService
    context_builders: dict[str, ContextBuilder]

    def update_for_trigger(self, trigger: str, payload: RuntimeDocumentInput) -> list[DocumentUpdateResult]:
        results: list[DocumentUpdateResult] = []
        definitions = self.registry.select_for_trigger(trigger)
        for definition in definitions:
            builder = self.context_builders.get(definition.id)
            if builder is None:
                continue
            rendered = self.service.render_document(definition.id, builder(payload))
            result = self.service.writer.write(rendered, trigger=trigger)
            results.append(result)
        return results


def create_default_fill_engine(registry: DocumentRegistry, service: DocumentService) -> RuntimeDocumentFillEngine:
    return RuntimeDocumentFillEngine(
        registry=registry,
        service=service,
        context_builders=dict(DEFAULT_CONTEXT_BUILDERS),
    )
