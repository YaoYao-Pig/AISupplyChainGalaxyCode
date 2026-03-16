from agentkit.runtime.engine import DefaultPipelineEngine
from agentkit.runtime.layers.capability import StaticCapabilityRegistry
from agentkit.runtime.layers.execution import MockExecutor
from agentkit.runtime.layers.identity import StaticIdentityProvider
from agentkit.runtime.layers.planning import MinimalPlanner
from agentkit.runtime.layers.state import AutoApproveReviewHook, InMemoryStateStore
from agentkit.runtime.layers.validation import SimpleValidator
from agentkit.runtime.models import Task, TaskStatus


def test_runtime_happy_path() -> None:
    engine = DefaultPipelineEngine(
        identity=StaticIdentityProvider(profile={"name": "agent", "role": "runtime"}),
        capability_registry=StaticCapabilityRegistry(action_types=["mock_action"]),
        planner=MinimalPlanner(default_action_type="mock_action"),
        executor=MockExecutor(),
        validator=SimpleValidator(blocked_action_types=set()),
        state_store=InMemoryStateStore(),
        review_hook=AutoApproveReviewHook(approve=True),
        max_steps=3,
    )

    task = Task(
        id="happy-1",
        title="happy",
        goal="execute one action",
        constraints=[],
        success_criteria=["done"],
    )
    outcome = engine.run(task)

    assert outcome.status == TaskStatus.COMPLETED
    assert len(outcome.state.records) == 1
    assert outcome.state.retries == 0
