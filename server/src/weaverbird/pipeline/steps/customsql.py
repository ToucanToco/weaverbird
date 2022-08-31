from typing import Literal

from pydantic import validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin


class CustomSqlStep(BaseStep):
    name: Literal["customsql"] = "customsql"
    query: str

    @staticmethod
    def _strip_query(query: str) -> str:
        return query.strip().strip(";")

    @validator("query")
    def _validate_query(cls, query: str) -> str:
        assert ";" not in (
            stripped := cls._strip_query(query)
        ), "Custom SQL queries must not contain semicolumns"
        return stripped


class CustomSqlStepWithVariables(CustomSqlStep, StepWithVariablesMixin):
    ...
