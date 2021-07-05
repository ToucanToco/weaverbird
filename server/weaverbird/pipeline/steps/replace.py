from typing import Any, List, Tuple, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class ReplaceStep(BaseStep):
    name = Field('replace', const=True)
    search_column: ColumnName
    to_replace: List[Tuple[Any, Any]] = Field(min_items=1)


class ReplaceStepWithVariable(ReplaceStep, StepWithVariablesMixin):
    to_replace: Union[TemplatedVariable, List[Tuple[TemplatedVariable, TemplatedVariable]]]
