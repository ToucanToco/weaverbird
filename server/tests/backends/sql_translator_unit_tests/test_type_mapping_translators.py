import pytest
from pypika import AliasedQuery, Case, Field, Order, Query, Schema, Table, functions
from pypika.terms import LiteralValue, ValueWrapper

from weaverbird.backends.pypika_translator.translators.base import DataTypeMapping, RowNumber, SQLTranslator, StepTable
from weaverbird.exceptions import MissingTableNameError
from weaverbird.pipeline import conditions, steps
from weaverbird.pipeline.pipeline import DomainStep
from weaverbird.pipeline.steps.utils.combination import Reference

class MappingEnabledTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
    )

ALL_TABLES = {"users": ["name", "pseudonyme", "age"]}
DB_SCHEMA = "test_schema"

@pytest.fixture
def mapping_translator():
    return MappingEnabledTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_convert_with_enabled_split_part(mapping_translator: MappingEnabledTranslator):
    previous_step = "previous_with"
    selected_columns = ["*"]
    convert_columns = ["name", "age"]
    as_type = "text"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.ConvertStep(columns=convert_columns, data_type="text")
    (query, _) = mapping_translator.convert(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        functions.Cast(Field("name"), as_type).as_("name"),
        functions.Cast(Field("age"), as_type).as_("age"),
    )

    assert query.get_sql() == expected_query.get_sql()
