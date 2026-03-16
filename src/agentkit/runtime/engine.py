from __future__ import annotations

from dataclasses import dataclass

from .interfaces import (
    CapabilityRegistry,
    Executor,
    IdentityProvider,
    PipelineEngine,
    Planner,
    ReviewHook,
    StateStore,
    Validator,
)
from .models import ExecutionRecord, PipelineState, PolicyDecision, RuntimeOutcome, Task, TaskStatus


@dataclass(slots=True)
class DefaultPipelineEngine(PipelineEngine):
    identity: IdentityProvider
    capability_registry: CapabilityRegistry
    planner: Planner
    executor: Executor
    validator: Validator
    state_store: StateStore
    review_hook: ReviewHook
    max_steps: int = 5

    def run(self, task: Task) -> RuntimeOutcome:
        task.validate()
        state = self.state_store.load(task.id) or PipelineState(task_id=task.id)
        state.metadata["identity"] = self.identity.get_identity()
        state.metadata["capabilities"] = self.capability_registry.available_actions()

        state.status = TaskStatus.TASK_MODELING
        task_model = self.planner.model_task(task, state)
        self.state_store.save(state)

        steps = 0
        while task_model.next_actions and steps < self.max_steps:
            action = task_model.next_actions.pop(0)
            state.status = TaskStatus.PRECHECK
            pre = self.validator.pre_check(action, state)

            if pre.decision == PolicyDecision.REQUIRE_REVIEW:
                state.status = TaskStatus.WAIT_FOR_APPROVAL
                if not self.review_hook.request_review(action, pre):
                    state.status = TaskStatus.FAILED
                    self.state_store.save(state)
                    return RuntimeOutcome(status=state.status, state=state, message="review rejected")

            if pre.decision == PolicyDecision.DENY:
                state.status = TaskStatus.REPLAN
                state.retries += 1
                task_model = self.planner.replan(task, state, pre.reason)
                self.state_store.save(state)
                steps += 1
                continue

            state.status = TaskStatus.EXECUTING
            result = self.executor.execute(action, state)

            state.status = TaskStatus.POSTCHECK
            post = self.validator.post_check(result, state)
            record = ExecutionRecord(step_id=len(state.records) + 1, action=action, policy_result=post, result=result)
            state.add_record(record)

            if post.decision == PolicyDecision.DENY:
                state.status = TaskStatus.REPLAN
                state.retries += 1
                task_model = self.planner.replan(task, state, post.reason)
                self.state_store.save(state)
                steps += 1
                continue

            steps += 1
            self.state_store.save(state)

        state.status = TaskStatus.COMPLETED if state.records else TaskStatus.FAILED
        message = "completed" if state.status == TaskStatus.COMPLETED else "failed"
        self.state_store.save(state)
        return RuntimeOutcome(status=state.status, state=state, message=message)
