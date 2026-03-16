from __future__ import annotations

from pathlib import Path

from .models import DocumentUpdateResult, RenderedDocument
from .update_strategies import StrategyRegistry


class DocumentWriter:
    def __init__(self, strategies: StrategyRegistry | None = None) -> None:
        self._strategies = strategies or StrategyRegistry()

    def write(self, rendered: RenderedDocument, trigger: str) -> DocumentUpdateResult:
        target = Path(rendered.definition.resolved_output_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        strategy = self._strategies.resolve(rendered.metadata.write_strategy)
        output = strategy.write(target, rendered.content)
        return DocumentUpdateResult(
            document_id=rendered.definition.id,
            output_path=str(output),
            mode=rendered.metadata.write_strategy,
            trigger=trigger,
        )
