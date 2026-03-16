from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

import argparse
import json
import re

from agentkit.config.loader import load_full_config
from agentkit.docs.bootstrap import load_registry_from_templates
from agentkit.docs.fill_engine import RuntimeDocumentInput, create_default_fill_engine
from agentkit.docs.renderer import TokenRenderer
from agentkit.docs.service import DocumentService
from agentkit.docs.template_loader import MarkdownTemplateLoader
from agentkit.docs.writer import DocumentWriter
from agentkit.runtime.engine import DefaultPipelineEngine
from agentkit.runtime.layers.capability import StaticCapabilityRegistry
from agentkit.runtime.layers.identity import StaticIdentityProvider
from agentkit.runtime.layers.planning import MinimalPlanner
from agentkit.runtime.layers.persistent_state import JsonStateStore
from agentkit.runtime.layers.repository_execution import TaskBootstrapExecutor
from agentkit.runtime.layers.state import AutoApproveReviewHook
from agentkit.runtime.layers.validation import SimpleValidator
from agentkit.runtime.models import Task


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "task"


def _split_lines(values: list[str] | None) -> list[str]:
    if not values:
        return []
    items: list[str] = []
    for value in values:
        parts = [item.strip() for item in value.split("|")]
        items.extend(item for item in parts if item)
    return items


def _make_engine(config, state_store):
    return DefaultPipelineEngine(
        identity=StaticIdentityProvider(
            profile={"name": config.system_profile.agent_name, "role": config.system_profile.role}
        ),
        capability_registry=StaticCapabilityRegistry(action_types=[config.runtime.default_action_type, "external_write"]),
        planner=MinimalPlanner(default_action_type=config.runtime.default_action_type),
        executor=TaskBootstrapExecutor(),
        validator=SimpleValidator(blocked_action_types=set(config.policy_rules.blocked_action_types)),
        state_store=state_store,
        review_hook=AutoApproveReviewHook(approve=True),
        max_steps=config.runtime.max_steps,
    )


def _make_docs_service():
    registry = load_registry_from_templates("docs/templates")
    service = DocumentService(
        registry=registry,
        loader=MarkdownTemplateLoader(),
        renderer=TokenRenderer(strict=True),
        writer=DocumentWriter(),
    )
    return registry, service


def _write_runtime_snapshot(task: Task, state, output_path: str) -> None:
    payload = {
        "task": {
            "id": task.id,
            "title": task.title,
            "goal": task.goal,
            "constraints": task.constraints,
            "success_criteria": task.success_criteria,
            "input_sources": task.input_sources,
        },
        "state": {
            "task_id": state.task_id,
            "status": state.status.value,
            "current_phase": state.current_phase,
            "retries": state.retries,
            "record_count": len(state.records),
            "evidence_count": len(state.evidence_refs),
            "metadata": state.metadata,
            "summaries": [{"step_id": item.step_id, "content": item.content, "created_at": item.created_at} for item in state.summaries],
            "evidence_refs": [{"path": item.path, "lines": item.lines, "note": item.note} for item in state.evidence_refs],
        },
    }
    Path(output_path).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _build_task(args) -> Task:
    task_id = args.task_id or _slugify(args.title)
    title = args.title.strip()
    goal = args.goal.strip()
    constraints = _split_lines(args.constraint) or [
        "Follow AGENTS.md and docs/VIBECODING instructions",
        "Bootstrap through AgentKit before code changes",
    ]
    success_criteria = _split_lines(args.success_criteria) or [
        "AgentKit pipeline state persisted",
        "Required generated docs updated",
    ]
    input_sources = _split_lines(args.input_source) or ["AGENTS.md", "configs/", "docs/templates/"]

    return Task(
        id=task_id,
        title=title,
        goal=goal,
        constraints=constraints,
        success_criteria=success_criteria,
        input_sources=input_sources,
    )


def _print_result(task: Task, state, generated, config, reused_existing: bool) -> None:
    snapshot_path = Path(config.runtime.runtime_snapshot_path.format(task_id=task.id))
    print(f"Task status: {state.status.value}")
    print(f"Task id: {task.id}")
    print(f"State file: {Path(config.runtime.state_store_dir) / (task.id + '.json')}")
    print(f"Snapshot: {snapshot_path}")
    print(f"Generated docs: {len(generated)}")
    if reused_existing:
        print("Mode: reused existing completed state")
    for item in generated:
        print(f"- {item.document_id} -> {item.output_path} ({item.mode.value}, trigger={item.trigger})")


def start_task(args) -> int:
    config = load_full_config("configs")
    task = _build_task(args)
    state_store = JsonStateStore(config.runtime.state_store_dir)

    existing_state = state_store.load(task.id)
    reused_existing = False
    if existing_state is not None and not args.force:
        state = existing_state
        reused_existing = True
    else:
        engine = _make_engine(config, state_store)
        outcome = engine.run(task)
        state = outcome.state

    registry, docs_service = _make_docs_service()
    fill_engine = create_default_fill_engine(registry, docs_service)
    payload = RuntimeDocumentInput(task=task, state=state)

    generated = []
    for trigger in ["task_modeling", "postcheck", "task_completed"]:
        generated.extend(fill_engine.update_for_trigger(trigger, payload))

    snapshot_path = Path(config.runtime.runtime_snapshot_path.format(task_id=task.id))
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    _write_runtime_snapshot(task, state, str(snapshot_path))

    _print_result(task, state, generated, config, reused_existing)
    return 0


def show_status(args) -> int:
    config = load_full_config("configs")
    path = Path(config.runtime.state_store_dir) / f"{args.task_id}.json"
    if not path.exists():
        print(f"Task state not found: {path}")
        return 1
    print(path.read_text(encoding="utf-8"))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Repository AgentKit task bootstrap runner")
    subparsers = parser.add_subparsers(dest="command", required=True)

    start = subparsers.add_parser("start", help="Create or refresh a repository task through AgentKit")
    start.add_argument("--task-id", help="Stable task id. Defaults to a slug of the title.")
    start.add_argument("--title", required=True, help="Short task title.")
    start.add_argument("--goal", required=True, help="Task goal written in user-facing language.")
    start.add_argument("--constraint", action="append", help="Constraint list. Use multiple flags or | separators.")
    start.add_argument("--success-criteria", action="append", help="Success criteria. Use multiple flags or | separators.")
    start.add_argument("--input-source", action="append", help="Input sources. Use multiple flags or | separators.")
    start.add_argument("--force", action="store_true", help="Force a new bootstrap action even if state already exists.")
    start.set_defaults(func=start_task)

    status = subparsers.add_parser("status", help="Print persisted state for a task id")
    status.add_argument("task_id", help="Task id to inspect")
    status.set_defaults(func=show_status)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
