from typing import Literal

from pydantic import field_validator

from weaverbird.pipeline.steps.utils.base import BaseStep


class CustomSqlStep(BaseStep):
    name: Literal["customsql"] = "customsql"
    query: str
    columns: list[str] | None = None

    @staticmethod
    def _strip_query(query: str) -> str:
        return query.strip().strip(";")

    @field_validator("query")
    @classmethod
    def _validate_query(cls, query: str) -> str:
        assert ";" not in (stripped := cls._strip_query(query)), "Custom SQL queries must not contain semicolumns"
        return stripped


# /!\ Do not create CustomSqlStepWithVariables
# (variables should not be rendered using nosql_apply_parameters_to_query)
