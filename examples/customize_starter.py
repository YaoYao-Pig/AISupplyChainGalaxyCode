from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from agentkit.docs.bootstrap import load_registry_from_templates


def main() -> None:
    overrides = {
        "handoff_note": "docs/generated/team_handoff.md",
        "milestone_report": "docs/generated/releases/milestone.md",
    }
    registry = load_registry_from_templates("docs/templates", output_path_overrides=overrides)
    print("Customized output paths:")
    for doc_id in registry.list_ids():
        definition = registry.get(doc_id)
        print(f"- {doc_id}: {definition.resolved_output_path}")


if __name__ == "__main__":
    main()
