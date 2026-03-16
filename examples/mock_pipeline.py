from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from agentkit.config.loader import load_full_config
from agentkit.docs.bootstrap import load_registry_from_templates
from agentkit.docs.fill_engine import RuntimeDocumentInput, create_default_fill_engine
from agentkit.docs.renderer import TokenRenderer
from agentkit.docs.service import DocumentService
from agentkit.docs.template_loader import MarkdownTemplateLoader
from agentkit.docs.writer import DocumentWriter
from agentkit.runtime.engine import DefaultPipelineEngine
from agentkit.runtime.layers.capability import StaticCapabilityRegistry
from agentkit.runtime.layers.execution import MockExecutor
from agentkit.runtime.layers.identity import StaticIdentityProvider
from agentkit.runtime.layers.planning import MinimalPlanner
from agentkit.runtime.layers.state import AutoApproveReviewHook, InMemoryStateStore
from agentkit.runtime.layers.validation import SimpleValidator
from agentkit.runtime.models import Task


def main() -> None:
    config = load_full_config("configs")

    engine = DefaultPipelineEngine(
        identity=StaticIdentityProvider(
            profile={"name": config.system_profile.agent_name, "role": config.system_profile.role}
        ),
        capability_registry=StaticCapabilityRegistry(action_types=["mock_action", "external_write"]),
        planner=MinimalPlanner(default_action_type=config.runtime.default_action_type),
        executor=MockExecutor(),
        validator=SimpleValidator(blocked_action_types=set(config.policy_rules.blocked_action_types)),
        state_store=InMemoryStateStore(),
        review_hook=AutoApproveReviewHook(approve=True),
        max_steps=config.runtime.max_steps,
    )

    task = Task(
        id="starter-task-001",
        title="Bootstrap downstream project",
        goal="Create initial runtime state and docs",
        constraints=["No domain-specific logic", "Config-driven behavior"],
        success_criteria=["Runtime completes", "Documents generated"],
        input_sources=["configs/", "docs/templates/"],
    )

    outcome = engine.run(task)

    registry = load_registry_from_templates("docs/templates")
    docs_service = DocumentService(
        registry=registry,
        loader=MarkdownTemplateLoader(),
        renderer=TokenRenderer(strict=True),
        writer=DocumentWriter(),
    )
    fill_engine = create_default_fill_engine(registry, docs_service)
    payload = RuntimeDocumentInput(task=task, state=outcome.state)

    generated = []
    for trigger in ["task_modeling", "postcheck", "task_completed"]:
        generated.extend(fill_engine.update_for_trigger(trigger, payload))

    print(f"Task status: {outcome.status.value}")
    print(f"Updated documents: {len(generated)}")
    for item in generated:
        print(f"- {item.document_id} -> {item.output_path} ({item.mode.value}, trigger={item.trigger})")


if __name__ == "__main__":
    main()
