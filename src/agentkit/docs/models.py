from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class UpdateMode(str, Enum):
    OVERWRITE = "overwrite"
    APPEND = "append"
    SNAPSHOT = "snapshot"
    VERSIONED = "versioned"


DEFAULT_DOCUMENT_TYPES = (
    "project_charter",
    "task_model",
    "decision_log",
    "risk_register",
    "milestone_report",
    "handoff_note",
)


@dataclass(slots=True)
class TemplateMetadata:
    id: str
    title: str
    purpose: str
    owner_agent: str
    created_when: str
    updated_when: str
    input_sources: list[str]
    render_strategy: str
    write_strategy: UpdateMode
    output_path: str

    def validate(self) -> None:
        required = {
            "id": self.id,
            "title": self.title,
            "purpose": self.purpose,
            "owner_agent": self.owner_agent,
            "created_when": self.created_when,
            "updated_when": self.updated_when,
            "output_path": self.output_path,
        }
        for key, value in required.items():
            if not str(value).strip():
                raise ValueError(f"template metadata '{key}' is required")


@dataclass(slots=True)
class DocumentTemplate:
    metadata: TemplateMetadata
    body: str
    source_path: str


@dataclass(slots=True)
class DocumentDefinition:
    id: str
    template_path: str
    metadata: TemplateMetadata
    output_path_override: str | None = None

    @property
    def resolved_output_path(self) -> str:
        return self.output_path_override or self.metadata.output_path


@dataclass(slots=True)
class RenderedDocument:
    definition: DocumentDefinition
    metadata: TemplateMetadata
    content: str
    rendered_at: str = field(default_factory=utc_now_iso)


@dataclass(slots=True)
class DocumentContext:
    values: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class DocumentUpdateResult:
    document_id: str
    output_path: str
    mode: UpdateMode
    trigger: str
