from pathlib import Path

from agentkit.docs.models import DocumentContext, DocumentDefinition
from agentkit.docs.registry import DocumentRegistry
from agentkit.docs.renderer import TokenRenderer
from agentkit.docs.service import DocumentService
from agentkit.docs.template_loader import MarkdownTemplateLoader
from agentkit.docs.writer import DocumentWriter


def test_document_rendering_and_append_mode(tmp_path: Path) -> None:
    output = tmp_path / "decision.md"
    template = tmp_path / "decision_log.md"
    template.write_text(
        """---
id: decision_log
title: Decision Log
purpose: test
owner_agent: test_agent
created_when: postcheck
updated_when: postcheck
input_sources: []
render_strategy: token_v1
write_strategy: append
output_path: ignored.md
---
## {{title}}\nEntry {{step}} - {{decision}}
""",
        encoding="utf-8",
    )

    registry = DocumentRegistry()
    loaded = MarkdownTemplateLoader().load(str(template))
    registry.register(
        DocumentDefinition(
            id="decision_log",
            template_path=str(template),
            metadata=loaded.metadata,
            output_path_override=str(output),
        )
    )

    service = DocumentService(
        registry=registry,
        loader=MarkdownTemplateLoader(),
        renderer=TokenRenderer(strict=True),
        writer=DocumentWriter(),
    )

    first = service.update_document("decision_log", {"step": "1", "decision": "ok"}, trigger="postcheck")
    second = service.update_document("decision_log", {"step": "2", "decision": "retry"}, trigger="postcheck")

    assert first == str(output)
    assert second == str(output)
    content = output.read_text(encoding="utf-8")
    assert "Decision Log" in content
    assert "Entry 1 - ok" in content
    assert "Entry 2 - retry" in content


def test_renderer_strict_mode_missing_token(tmp_path: Path) -> None:
    template = tmp_path / "missing.md"
    template.write_text(
        """---
id: task_model
title: Task Model
purpose: test
owner_agent: planning
created_when: task_modeling
updated_when: postcheck
input_sources: []
render_strategy: token_v1
write_strategy: overwrite
output_path: x.md
---
Missing {{required_token}}
""",
        encoding="utf-8",
    )
    loader = MarkdownTemplateLoader()
    loaded = loader.load(str(template))
    renderer = TokenRenderer(strict=True)

    try:
        renderer.render(loaded.body, DocumentContext({}))
        assert False, "expected missing token error"
    except ValueError as exc:
        assert "required_token" in str(exc)

