from __future__ import annotations

from pathlib import Path

import yaml

from .models import (
    FullConfig,
    ModuleRulesConfig,
    PolicyRulesConfig,
    RuntimeConfig,
    SkillsIndexConfig,
    SystemProfileConfig,
)


def _load_yaml(path: str) -> dict:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"config {path} must be a mapping")
    return data


def load_full_config(config_dir: str) -> FullConfig:
    base = Path(config_dir)
    system_profile = SystemProfileConfig(**_load_yaml(str(base / "system_profile.yaml")))
    skills_index = SkillsIndexConfig(**_load_yaml(str(base / "skills_index.yaml")))
    policy_rules = PolicyRulesConfig(**_load_yaml(str(base / "policy_rules.yaml")))
    module_rules = ModuleRulesConfig(**_load_yaml(str(base / "module_rules.yaml")))
    runtime = RuntimeConfig(**_load_yaml(str(base / "runtime.yaml")))

    return FullConfig(
        system_profile=system_profile,
        skills_index=skills_index,
        policy_rules=policy_rules,
        module_rules=module_rules,
        runtime=runtime,
    )
