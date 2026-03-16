from pathlib import Path

from agentkit.config.loader import load_full_config
from agentkit.docs.template_loader import MarkdownTemplateLoader
from agentkit.runtime.models import Task


def test_task_schema_validation_requires_goal() -> None:
    task = Task(id="t-1", title="x", goal="", constraints=[], success_criteria=[])
    try:
        task.validate()
        assert False, "expected ValueError"
    except ValueError as exc:
        assert "task.goal" in str(exc)


def test_config_schema_loading() -> None:
    config = load_full_config("configs")
    assert config.system_profile.agent_name
    assert config.runtime.max_steps > 0


def test_template_metadata_schema_requires_title(tmp_path: Path) -> None:
    bad_template = tmp_path / "bad.md"
    bad_template.write_text(
        """---
id: project_charter
purpose: missing title
owner_agent: planner
created_when: task_modeling
updated_when: task_completed
input_sources: []
render_strategy: token_v1
write_strategy: overwrite
output_path: docs/generated/out.md
---
Body
""",
        encoding="utf-8",
    )

    loader = MarkdownTemplateLoader()
    try:
        loader.load(str(bad_template))
        assert False, "expected metadata validation error"
    except KeyError:
        assert True
