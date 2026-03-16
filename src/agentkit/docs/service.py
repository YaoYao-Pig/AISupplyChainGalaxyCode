from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .models import DocumentContext, RenderedDocument
from .registry import DocumentRegistry
from .renderer import TokenRenderer
from .template_loader import MarkdownTemplateLoader
from .writer import DocumentWriter


@dataclass(slots=True)
class DocumentService:
    registry: DocumentRegistry
    loader: MarkdownTemplateLoader
    renderer: TokenRenderer
    writer: DocumentWriter

    def render_document(self, document_id: str, context: dict[str, Any]) -> RenderedDocument:
        definition = self.registry.get(document_id)
        template = self.loader.load(definition.template_path)
        merged_context = {
            "id": template.metadata.id,
            "title": template.metadata.title,
            "purpose": template.metadata.purpose,
            **context,
        }
        rendered_text = self.renderer.render(template.body, DocumentContext(merged_context))
        metadata = template.metadata
        metadata.output_path = definition.resolved_output_path
        return RenderedDocument(definition=definition, metadata=metadata, content=rendered_text)

    def update_document(self, document_id: str, context: dict[str, Any], trigger: str) -> str:
        rendered = self.render_document(document_id, context)
        result = self.writer.write(rendered, trigger=trigger)
        return result.output_path

    def template_exists(self, document_id: str) -> bool:
        definition = self.registry.get(document_id)
        return Path(definition.template_path).exists()
