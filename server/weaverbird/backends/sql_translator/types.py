from typing import Any, Callable, Dict, List, Optional, Protocol, Tuple

from pydantic import BaseModel

from weaverbird.pipeline import Pipeline


class SQLStepTranslationReport(BaseModel):
    step_index: int


class SQLPipelineTranslationReport(BaseModel):
    sql_steps_translation_reports: List[SQLStepTranslationReport]


class TableMetadataUpdateError(Exception):
    ...


class SqlQueryMetadataManager(BaseModel):
    tables_metadata: Dict[str, Dict[str, str]]

    def change_name(self, old_column_name: str, new_column_name: str, table_name: str):
        self.tables_metadata[table_name][new_column_name] = self.tables_metadata[table_name].pop(
            old_column_name
        )

    def change_type(self, table_name: str, column_name: str, new_type: str):
        self.tables_metadata[table_name][column_name] = new_type

    def remove_column(self, table_name: str, column_name: str):
        try:
            del self.tables_metadata[table_name][column_name]
        except KeyError:
            raise TableMetadataUpdateError

    def add_column(self, table_name: str, column_name: str, column_type: str):
        self.tables_metadata[table_name][column_name] = column_type


class SQLQuery(BaseModel):
    query_name: Optional[str]
    transformed_query: Optional[str]
    selection_query: Optional[str]
    metadata_manager: Optional[SqlQueryMetadataManager]


SQLQueryRetriever = Callable[[str], str]
SQLQueryDescriber = Callable[[str, str], str]

SQLPipelineTranslator = Callable[
    [Pipeline, SQLQueryRetriever, SQLQueryDescriber], Tuple[str, SQLPipelineTranslationReport]
]


class SQLStepTranslator(Protocol):
    def __call__(
        self,
        step: Any,
        query: SQLQuery,
        index,
        sql_query_retriever: Optional[SQLQueryRetriever],
        sql_query_describer: Optional[SQLQueryDescriber],
        sql_translate_pipeline: Optional[SQLPipelineTranslator],
    ) -> str:
        ...
