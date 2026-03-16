from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from .models import UpdateMode


class UpdateStrategy(ABC):
    mode: UpdateMode

    @abstractmethod
    def write(self, target: Path, content: str) -> Path:
        raise NotImplementedError


@dataclass(slots=True)
class OverwriteStrategy(UpdateStrategy):
    mode: UpdateMode = UpdateMode.OVERWRITE

    def write(self, target: Path, content: str) -> Path:
        target.write_text(content, encoding="utf-8")
        return target


@dataclass(slots=True)
class AppendStrategy(UpdateStrategy):
    mode: UpdateMode = UpdateMode.APPEND

    def write(self, target: Path, content: str) -> Path:
        with target.open("a", encoding="utf-8") as handle:
            if target.exists() and target.stat().st_size > 0:
                handle.write("\n\n")
            handle.write(content)
        return target


@dataclass(slots=True)
class SnapshotStrategy(UpdateStrategy):
    mode: UpdateMode = UpdateMode.SNAPSHOT

    def write(self, target: Path, content: str) -> Path:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        snapshot = target.with_name(f"{target.stem}.{stamp}{target.suffix}")
        snapshot.write_text(content, encoding="utf-8")
        return snapshot


@dataclass(slots=True)
class VersionedStrategy(UpdateStrategy):
    mode: UpdateMode = UpdateMode.VERSIONED

    def write(self, target: Path, content: str) -> Path:
        version = 1
        while True:
            versioned = target.with_name(f"{target.stem}.v{version}{target.suffix}")
            if not versioned.exists():
                versioned.write_text(content, encoding="utf-8")
                return versioned
            version += 1


@dataclass(slots=True)
class StrategyRegistry:
    overwrite: OverwriteStrategy = field(default_factory=OverwriteStrategy)
    append: AppendStrategy = field(default_factory=AppendStrategy)
    snapshot: SnapshotStrategy = field(default_factory=SnapshotStrategy)
    versioned: VersionedStrategy = field(default_factory=VersionedStrategy)

    def resolve(self, mode: UpdateMode) -> UpdateStrategy:
        mapping: dict[UpdateMode, UpdateStrategy] = {
            UpdateMode.OVERWRITE: self.overwrite,
            UpdateMode.APPEND: self.append,
            UpdateMode.SNAPSHOT: self.snapshot,
            UpdateMode.VERSIONED: self.versioned,
        }
        return mapping[mode]
