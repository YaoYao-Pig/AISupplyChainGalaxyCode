from __future__ import annotations

from pathlib import Path

import yaml

from .models import DocumentTemplate, TemplateMetadata, UpdateMode


class MarkdownTemplateLoader:
    def load(self, template_path: str) -> DocumentTemplate:
        source = Path(template_path)
        raw = source.read_text(encoding="utf-8")
        metadata_dict, body = self._split_front_matter(raw)
        metadata = TemplateMetadata(
            id=str(metadata_dict["id"]),
            title=str(metadata_dict["title"]),
            purpose=str(metadata_dict["purpose"]),
            owner_agent=str(metadata_dict["owner_agent"]),
            created_when=str(metadata_dict["created_when"]),
            updated_when=str(metadata_dict["updated_when"]),
            input_sources=[str(item) for item in metadata_dict.get("input_sources", [])],
            render_strategy=str(metadata_dict.get("render_strategy", "token_v1")),
            write_strategy=UpdateMode(str(metadata_dict.get("write_strategy", "overwrite"))),
            output_path=str(metadata_dict["output_path"]),
        )
        metadata.validate()
        return DocumentTemplate(metadata=metadata, body=body, source_path=str(source))

    @staticmethod
    def _split_front_matter(raw: str) -> tuple[dict[str, object], str]:
        if not raw.startswith("---\n"):
            raise ValueError("template must start with YAML front matter")
        parts = raw.split("---\n", 2)
        if len(parts) < 3:
            raise ValueError("template front matter is malformed")
        metadata = yaml.safe_load(parts[1]) or {}
        if not isinstance(metadata, dict):
            raise ValueError("template front matter must be a YAML mapping")
        body = parts[2].lstrip("\n")
        return metadata, body
