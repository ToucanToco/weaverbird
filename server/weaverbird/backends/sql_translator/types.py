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
    query_metadata: Dict[str, str]

    def change_name(self, old_column_name: str, new_column_name: str):
        new_column_name = new_column_name.upper()
        log.debug(
            "\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            "before : change_name: "
            + f"\nold_column_name : {old_column_name} | new_column_name : {new_column_name}"
            + f"\n> query_metadata: {str(self.query_metadata.keys())}"
        )

        if " " in new_column_name:
            new_column_name = f'"{new_column_name}"'
        if old_column_name in self.query_metadata:
            self.query_metadata[new_column_name] = self.query_metadata.pop(old_column_name)

        log.debug(
            "\n----------------------------------------------"
            "after : change_name: "
            + f"\nold_column_name : {old_column_name} | new_column_name : {new_column_name}"
            + f"\n> query_metadata: {str(self.query_metadata.keys())}"
            "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
        )

    def change_type(self, column_name: str, new_type: str):
        log.debug(
            "\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            "before : change_type: "
            + f"\ncolumn_name : {column_name}"
            + f"\n> query_metadata: {str(self.query_metadata.keys())}"
        )
        self.query_metadata[column_name] = new_type
        log.debug(
            "\n----------------------------------------------"
            "after : change_type: "
            + f"\ncolumn_name : {column_name}"
            + f"\n> query_metadata: {str(self.query_metadata.keys())}"
            "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
        )

    def remove_column(self, column_name: str):
        log.debug(
            "\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            "before : remove_column: "
            + f"\ncolumn_name : {column_name}"
            + f"\n> query_metadata: {str(self.query_metadata.keys())}"
        )
        try:
            del self.query_metadata[column_name]
        except KeyError:
            raise TableMetadataUpdateError
        log.debug(
            "\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            "after : remove_column: "
            + f"\ncolumn_name : {column_name}"
            + f"\n> query_metadata: {str(self.query_metadata.keys())}"
        )

    def add_column(self, column_name: str, column_type: str):
        if " " in column_name:
            column_name = f'"{column_name}"'

        column_name = column_name.upper()
        log.debug(
            "\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            "before : add_column: "
            + f"\ncolumn_name : {column_name} --- column_type : {column_type}"
            + f"\n> query_metadata: {str(self.query_metadata.keys())}"
        )
        if (
            column_name.upper() not in self.query_metadata
            and column_name.lower() not in self.query_metadata
        ):
            self.query_metadata[column_name] = column_type
        log.debug(
            "\n----------------------------------------------"
            "after : add_column: "
            + f"\ncolumn_name : {column_name} --- column_type : {column_name}.{column_type}"
            + f"\n> query_metadata: {str(self.query_metadata.keys())}"
            "\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
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
