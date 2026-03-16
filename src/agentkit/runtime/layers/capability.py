from __future__ import annotations

from dataclasses import dataclass

from ..interfaces import CapabilityRegistry


@dataclass(slots=True)
class StaticCapabilityRegistry(CapabilityRegistry):
    action_types: list[str]

    def available_actions(self) -> list[str]:
        return self.action_types
