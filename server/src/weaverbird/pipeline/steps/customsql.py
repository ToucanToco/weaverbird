from typing import Literal

from pydantic import validator

from weaverbird.pipeline.steps.utils.base import BaseStep


class CustomSqlStep(BaseStep):
    name: Literal["_customsql", "customsql"] = "customsql"
    query: str

    @staticmethod
    def _strip_query(query: str) -> str:
        return query.strip().strip(";")

    @validator("query")
    def _validate_query(cls, query: str) -> str:
        assert (
            len(query) > 3
        ), "CustomSql step query string should at least have more than 3 characters"
        return cls._strip_query(query)


# /!\ Do not create CustomSqlStepWithVariables
# (variables should not be rendered using nosql_apply_parameters_to_query)
