from agentkit.runtime.engine import DefaultPipelineEngine
from agentkit.runtime.layers.capability import StaticCapabilityRegistry
from agentkit.runtime.layers.execution import MockExecutor
from agentkit.runtime.layers.identity import StaticIdentityProvider
from agentkit.runtime.layers.planning import MinimalPlanner
from agentkit.runtime.layers.state import AutoApproveReviewHook, InMemoryStateStore
from agentkit.runtime.layers.validation import SimpleValidator
from agentkit.runtime.models import Task, TaskStatus


def test_runtime_failure_then_replan() -> None:
    failing_id = "replan-1-step-1"
    engine = DefaultPipelineEngine(
        identity=StaticIdentityProvider(profile={"name": "agent", "role": "runtime"}),
        capability_registry=StaticCapabilityRegistry(action_types=["mock_action"]),
        planner=MinimalPlanner(default_action_type="mock_action"),
        executor=MockExecutor(fail_once_on=failing_id),
        validator=SimpleValidator(blocked_action_types=set()),
        state_store=InMemoryStateStore(),
        review_hook=AutoApproveReviewHook(approve=True),
        max_steps=5,
    )

    task = Task(
        id="replan-1",
        title="replan",
        goal="recover from one failure",
        constraints=[],
        success_criteria=["done"],
    )
    outcome = engine.run(task)

    assert outcome.status == TaskStatus.COMPLETED
    assert outcome.state.retries == 1
    assert len(outcome.state.records) >= 2
