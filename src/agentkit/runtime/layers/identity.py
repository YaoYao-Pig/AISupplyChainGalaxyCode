from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ..interfaces import IdentityProvider


@dataclass(slots=True)
class StaticIdentityProvider(IdentityProvider):
    profile: dict[str, Any]

    def get_identity(self) -> dict[str, Any]:
        return self.profile
