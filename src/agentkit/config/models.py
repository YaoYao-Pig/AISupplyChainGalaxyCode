from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class SystemProfileConfig:
    agent_name: str
    role: str
    boundaries: list[str] = field(default_factory=list)


@dataclass(slots=True)
class SkillsIndexConfig:
    skills: dict[str, dict[str, Any]]


@dataclass(slots=True)
class PolicyRulesConfig:
    blocked_action_types: list[str] = field(default_factory=list)
    review_action_types: list[str] = field(default_factory=list)


@dataclass(slots=True)
class ModuleRulesConfig:
    allowed_paths: list[str] = field(default_factory=list)
    disallowed_dependencies: list[dict[str, str]] = field(default_factory=list)


@dataclass(slots=True)
class RuntimeConfig:
    max_steps: int = 5
    default_action_type: str = "task_bootstrap"
    state_store_dir: str = "docs/generated/runtime_state"
    runtime_snapshot_path: str = "docs/generated/runtime_snapshot.{task_id}.json"
    required_entrypoint: str = "python tools/agentkit/run_task.py start"


@dataclass(slots=True)
class FullConfig:
    system_profile: SystemProfileConfig
    skills_index: SkillsIndexConfig
    policy_rules: PolicyRulesConfig
    module_rules: ModuleRulesConfig
    runtime: RuntimeConfig
