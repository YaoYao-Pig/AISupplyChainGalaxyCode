from __future__ import annotations

from dataclasses import dataclass, field

from .models import DocumentDefinition


@dataclass(slots=True)
class DocumentRegistry:
    _definitions: dict[str, DocumentDefinition] = field(default_factory=dict)

    def register(self, definition: DocumentDefinition) -> None:
        if definition.id in self._definitions:
            raise ValueError(f"duplicate document id: {definition.id}")
        self._definitions[definition.id] = definition

    def get(self, document_id: str) -> DocumentDefinition:
        try:
            return self._definitions[document_id]
        except KeyError as exc:
            raise KeyError(f"unknown document id: {document_id}") from exc

    def list_ids(self) -> list[str]:
        return sorted(self._definitions.keys())

    def select_for_trigger(self, trigger: str) -> list[DocumentDefinition]:
        selected: list[DocumentDefinition] = []
        for definition in self._definitions.values():
            metadata = definition.metadata
            if trigger == metadata.created_when or trigger == metadata.updated_when:
                selected.append(definition)
        return sorted(selected, key=lambda item: item.id)
