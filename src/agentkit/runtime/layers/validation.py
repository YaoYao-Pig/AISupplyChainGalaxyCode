from __future__ import annotations

from dataclasses import dataclass

from ..interfaces import Validator
from ..models import Action, ActionResult, PipelineState, PolicyDecision, PolicyResult


@dataclass(slots=True)
class SimpleValidator(Validator):
    blocked_action_types: set[str]

    def pre_check(self, action: Action, state: PipelineState) -> PolicyResult:
        if action.action_type in self.blocked_action_types:
            return PolicyResult(
                decision=PolicyDecision.DENY,
                reason=f"action type '{action.action_type}' is blocked",
                risk_level="high",
            )
        return PolicyResult(decision=PolicyDecision.ALLOW, reason="pre-check passed")

    def post_check(self, result: ActionResult, state: PipelineState) -> PolicyResult:
        if result.status != "success":
            return PolicyResult(
                decision=PolicyDecision.DENY,
                reason="post-check detected failed execution",
                risk_level="medium",
            )
        return PolicyResult(decision=PolicyDecision.ALLOW, reason="post-check passed")
