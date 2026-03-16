from agentkit.docs.bootstrap import load_registry_from_templates
from agentkit.docs.models import DEFAULT_DOCUMENT_TYPES


def test_registry_loading_from_templates() -> None:
    registry = load_registry_from_templates("docs/templates")
    ids = registry.list_ids()
    for required in DEFAULT_DOCUMENT_TYPES:
        assert required in ids


def test_registry_supports_output_override() -> None:
    registry = load_registry_from_templates(
        "docs/templates",
        output_path_overrides={"handoff_note": "docs/generated/custom_handoff.md"},
    )
    definition = registry.get("handoff_note")
    assert definition.resolved_output_path.endswith("custom_handoff.md")
