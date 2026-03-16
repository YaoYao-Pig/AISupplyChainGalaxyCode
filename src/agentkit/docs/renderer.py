from __future__ import annotations

from dataclasses import dataclass
import re

from .models import DocumentContext


@dataclass(slots=True)
class TokenRenderer:
    strict: bool = True
    _pattern: re.Pattern[str] = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")

    def render(self, template: str, context: DocumentContext) -> str:
        rendered = template
        missing: list[str] = []

        for token in sorted(set(self._pattern.findall(template))):
            if token not in context.values:
                missing.append(token)
                continue
            rendered = re.sub(
                rf"\{{\{{\s*{re.escape(token)}\s*\}}\}}",
                str(context.values[token]),
                rendered,
            )

        if self.strict and missing:
            raise ValueError(f"missing render tokens: {', '.join(sorted(missing))}")
        return rendered
