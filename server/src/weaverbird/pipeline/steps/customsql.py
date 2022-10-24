from typing import Literal

from pydantic import validator

from weaverbird.pipeline.steps.utils.base import BaseStep


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


# /!\ Do not create CustomSqlStepWithVariables
# (variables should not be rendered using nosql_apply_parameters_to_query)
