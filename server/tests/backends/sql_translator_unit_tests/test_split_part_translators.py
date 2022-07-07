import pytest
from pypika import AliasedQuery, Case, Field, Order, Query, Schema, Table, functions
from pypika.terms import LiteralValue, ValueWrapper

from weaverbird.backends.pypika_translator.translators.base import DataTypeMapping, RowNumber, SQLTranslator, StepTable
from weaverbird.exceptions import MissingTableNameError
from weaverbird.pipeline import conditions, steps
from weaverbird.pipeline.pipeline import DomainStep
from weaverbird.pipeline.steps.utils.combination import Reference

class SplitEnabledTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query
    SUPPORT_SPLIT_PART = True

class SplitDisabledTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query
    SUPPORT_SPLIT_PART = False

ALL_TABLES = {"users": ["name", "pseudonyme", "age"]}
DB_SCHEMA = "test_schema"

@pytest.fixture
def split_enabled_translator():
    return SplitEnabledTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )

@pytest.fixture
def split_disabled_translator():
    return SplitDisabledTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_split_enabled(split_enabled_translator: SplitEnabledTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    delimiter = ","

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.SplitStep(column=column, delimiter=delimiter, number_cols_to_keep=2)
    (query, _) = split_enabled_translator.split(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        functions.SplitPart(Field(column), delimiter, 1).as_(f"{column}_1"),
        functions.SplitPart(Field(column), delimiter, 2).as_(f"{column}_2"),
    )

    assert query.get_sql() == expected_query.get_sql()


def test_split_disabled(split_disabled_translator: SplitDisabledTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    delimiter = ","

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.SplitStep(column=column, delimiter=delimiter, number_cols_to_keep=2)
    with pytest.raises(NotImplementedError):
        split_disabled_translator.split(step=step, table=step_table)