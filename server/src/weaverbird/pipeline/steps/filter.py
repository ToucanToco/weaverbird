from typing import Any, Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin

from ..conditions import Condition, ConditionWithVariables


class FilterStep(BaseStep):
    name: Literal["filter"] = "filter"
    condition: Condition


class FilterStepWithVariables(FilterStep, StepWithVariablesMixin):
    condition: ConditionWithVariables  # type:ignore[assignment]

    def model_dump(self, *, exclude_none: bool = False, **kwargs) -> dict[str, Any]:
        # we don't want to drop fields with value=None like:
        #     {'column': 'nullable_name', 'operator': 'eq', 'value': None}
        return super().model_dump(exclude_none=exclude_none, **kwargs)
