from pathlib import Path

from agentkit.docs.bootstrap import load_registry_from_templates
from agentkit.docs.fill_engine import RuntimeDocumentInput, create_default_fill_engine
from agentkit.docs.renderer import TokenRenderer
from agentkit.docs.service import DocumentService
from agentkit.docs.template_loader import MarkdownTemplateLoader
from agentkit.docs.writer import DocumentWriter
from agentkit.runtime.models import PipelineState, Summary, Task, TaskStatus


def test_fill_engine_updates_docs_from_typed_runtime_state(tmp_path: Path) -> None:
    overrides = {
        "project_charter": str(tmp_path / "project_charter.md"),
        "decision_log": str(tmp_path / "decision_log.md"),
        "milestone_report": str(tmp_path / "milestone_report.md"),
        "handoff_note": str(tmp_path / "handoff_note.md"),
        "task_model": str(tmp_path / "task_model.md"),
        "risk_register": str(tmp_path / "risk_register.md"),
    }
    registry = load_registry_from_templates("docs/templates", output_path_overrides=overrides)
    service = DocumentService(
        registry=registry,
        loader=MarkdownTemplateLoader(),
        renderer=TokenRenderer(strict=True),
        writer=DocumentWriter(),
    )
    engine = create_default_fill_engine(registry, service)

    task = Task(
        id="t-doc-1",
        title="Starter Task",
        goal="Generate docs from runtime state",
        constraints=["no business logic"],
        success_criteria=["docs updated"],
    )
    state = PipelineState(task_id=task.id, status=TaskStatus.POSTCHECK, current_phase="execution")
    state.summaries.append(Summary(step_id="s1", content="Action completed"))

    created = engine.update_for_trigger("task_modeling", RuntimeDocumentInput(task=task, state=state))
    updated = engine.update_for_trigger("postcheck", RuntimeDocumentInput(task=task, state=state))

    assert len(created) >= 2
    assert len(updated) >= 2
    assert Path(overrides["project_charter"]).exists()
    assert Path(overrides["task_model"]).exists()
    assert Path(overrides["decision_log"]).exists()
