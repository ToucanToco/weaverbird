from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriberOrRunner,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import UnpivotStep


def translate_unpivot(
    step: UnpivotStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer_or_runner: SQLQueryDescriberOrRunner = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'UNPIVOT_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'step: {step}\n'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )
    unpivot_query = f"""SELECT {', '.join(step.keep + [step.unpivot_column_name.upper(),
                                                       step.value_column_name.upper()])}\
 FROM {query.query_name} UNPIVOT({step.value_column_name.upper()} FOR {step.unpivot_column_name.upper()} IN\
 {str(step.unpivot).replace('[', '(').replace(']', ')').replace("'", '')}"""

    transformed_query = f"""{query.transformed_query}, {query_name} AS ({unpivot_query}))"""
    unpivotted_value_column = query.metadata_manager.retrieve_query_metadata_column_by_name(
        step.unpivot[0]
    )
    unpivotted_value_column_type = (
        unpivotted_value_column.type if hasattr(unpivotted_value_column, 'type') else 'UNDEFINED'
    )
    query.metadata_manager.remove_query_metadata_columns(
        [
            c
            for c in query.metadata_manager.retrieve_query_metadata_columns().keys()
            if c not in step.keep
        ]
    )
    query.metadata_manager.add_query_metadata_column(
        column_name=step.unpivot_column_name, column_type='str'
    )
    query.metadata_manager.add_query_metadata_column(
        column_name=step.value_column_name,
        # We infer that type of value column will be the same as first unpivoted column's type.
        # If the provided columns to unpivot have mixed types the unpivot will fail.
        column_type=unpivotted_value_column_type,
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        '------------------------------------------------------------'
        f'SQLquery: {new_query.transformed_query}'
        '############################################################'
    )

    return new_query
