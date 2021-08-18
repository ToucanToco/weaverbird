from distutils import log
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
        new_column_name = new_column_name.upper()
        log.debug(
            "before : change_name: "
            + old_column_name
            + "|"
            + new_column_name
            + "|"
            + table_name
            + "> table_metadata: "
            + str(self.tables_metadata[table_name].keys())
        )
        if " " in new_column_name:
            new_column_name = f'"{new_column_name}"'
        if old_column_name in self.tables_metadata[table_name]:
            self.tables_metadata[table_name][new_column_name] = self.tables_metadata[
                table_name
            ].pop(old_column_name)

        log.debug(
            "after : change_name: "
            + old_column_name
            + "|"
            + new_column_name
            + "|"
            + table_name
            + "> table_metadata: "
            + str(self.tables_metadata[table_name].keys())
        )

    def change_type(self, table_name: str, column_name: str, new_type: str):
        log.debug(
            "before : change_type: "
            + column_name
            + "|"
            + table_name
            + "> table_metadata: "
            + str(self.tables_metadata[table_name].keys())
        )
        self.tables_metadata[table_name][column_name] = new_type
        log.debug(
            "after : change_type: "
            + column_name
            + "|"
            + table_name
            + "> table_metadata: "
            + str(self.tables_metadata[table_name].keys())
        )

    def remove_column(self, table_name: str, column_name: str):
        log.debug(
            "before : remove_column: "
            + column_name
            + "|"
            + table_name
            + "> table_metadata: "
            + str(self.tables_metadata[table_name].keys())
        )
        try:
            del self.tables_metadata[table_name][column_name]
        except KeyError:
            raise TableMetadataUpdateError

        log.debug(
            "after : remove_column: "
            + column_name
            + "|"
            + table_name
            + "> table_metadata: "
            + str(self.tables_metadata[table_name].keys())
        )

    def add_column(self, table_name: str, column_name: str, column_type: str):
        if " " in column_name:
            column_name = f'"{column_name}"'

        column_name = column_name.upper()
        log.debug(
            "before : add_column: "
            + column_type
            + "|"
            + column_name
            + "|"
            + table_name
            + "> table_metadata: "
            + str(self.tables_metadata[table_name].keys())
        )
        if (
            column_name.upper() not in self.tables_metadata[table_name] and
            column_name.lower() not in self.tables_metadata[table_name]
        ):
            self.tables_metadata[table_name][column_name] = column_type
        log.debug(
            "after : add_column: "
            + column_type
            + "|"
            + column_name
            + "|"
            + table_name
            + "> table_metadata: "
            + str(self.tables_metadata[table_name].keys())
        )


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
