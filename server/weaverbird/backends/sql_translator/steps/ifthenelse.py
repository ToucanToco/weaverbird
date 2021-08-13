from distutils import log
from typing import List, Union

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    ConditionComboAnd,
    ConditionComboOr,
    InclusionCondition,
    MatchCondition,
    NullCondition,
    SimpleCondition,
)
from weaverbird.pipeline.steps import IfthenelseStep
from weaverbird.pipeline.steps.ifthenelse import IfThenElse


def complete_fields(query: SQLQuery) -> str:
    """
    We're going to complete missing field from the query
    """
    fields: list = []
    compiled_query: str = ""
    for table in [*query.metadata_manager.tables_metadata]:
        # TODO : changes the management columns on joins with duplicated columns
        for elt in query.metadata_manager.tables_metadata[table].keys():
            compiled_query += f'{elt}, ' if elt not in fields else ''

    return compiled_query


def format_condition(condition: Union[SimpleCondition, ConditionComboAnd, ConditionComboOr]):
    vqb_to_sql = {
        'eq': ' = ',
        'ne': ' != ',
        'lt': ' < ',
        'le': ' <= ',
        'gt': ' > ',
        'ge': ' >= ',
        'in': ' IN ',
        'nin': ' NOT IN ',
        'isnull': ' IS NULL ',
        'notnull': ' IS NOT NULL ',
        'matches': ' LIKE ',
        'notmatches': ' NOT LIKE ',
    }
    compiled_query: str = ""
    # for a composed condition
    if type(condition) in [ConditionComboAnd, ConditionComboOr]:
        composed_condition: List = (
            condition.and_ if type(condition) == ConditionComboAnd else condition.or_
        )
        for index, cond in enumerate(composed_condition):
            if index > 0:
                if type(condition) == ConditionComboAnd:
                    compiled_query += ' AND '
                if type(condition) == ConditionComboOr:
                    compiled_query += ' OR '
            compiled_query += format_condition(cond)
        compiled_query = "(" + compiled_query + ")"

    # for an normal condition
    if type(condition) in [ComparisonCondition, InclusionCondition, NullCondition, MatchCondition]:
        if type(condition) == NullCondition:
            composed_value: str = ""
        else:
            composed_value: str = str(
                tuple(condition.value) if type(condition.value) == list else condition.value
            ).replace(",)", ")")

        compiled_query += (
            f"""{condition.column + vqb_to_sql[condition.operator] + composed_value}"""
        )

    return compiled_query


def recurse_format_if_then_else(step: IfthenelseStep) -> str:
    """
    In a case of a nested if then else, we're going to loop until the type of else_value's step
    is different from IfthenelseStep type

    params:
    step: IfthenelseStep
    """
    composed_query: str = "/-*-/"
    # while we have a nested else, pack the query
    while type(step.else_value) in [IfThenElse, IfthenelseStep, SimpleCondition, ConditionComboAnd, ConditionComboOr]:
        composed_query = composed_query.replace(
            "/-*-/",
            f"""IFF({format_condition(step.condition)}, {step.then}, /-*-/)""",
        )
        step = step.else_value

    return composed_query.replace(
        "/-*-/",
        f"""IFF({format_condition(step.condition)}, {step.then}, {step.else_value})""",
    )


def translate_ifthenelse(
    step: IfthenelseStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'IFTHENELSE_STEP_{index}'

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {complete_fields(query)} {recurse_format_if_then_else(step)} AS {step.new_column}"""
        f""" FROM {query.query_name}) """,
    )

    for table in [*query.metadata_manager.tables_metadata]:
        query.metadata_manager.add_column(table, step.new_column, "str")

    new_query.selection_query = build_selection_query(query.metadata_manager.tables_metadata, query_name)
    new_query.metadata_manager = query.metadata_manager

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
