from typing import Any

import pytest
from pypika import Field, Query, functions
from weaverbird.backends.pypika_translator.translators.base import DataTypeMapping, SQLTranslator
from weaverbird.pipeline import steps


class MappingEnabledTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )


ALL_TABLES = {"users": ["name", "pseudonyme", "age"]}
DB_SCHEMA = "test_schema"


@pytest.fixture
def mapping_translator():
    return MappingEnabledTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_convert_with_enabled_split_part(
    mapping_translator: MappingEnabledTranslator, default_step_kwargs: dict[str, Any]
):
    previous_step = "previous_with"
    selected_columns = ["*"]
    convert_columns = ["name", "age"]
    as_type = "text"

    step = steps.ConvertStep(columns=convert_columns, data_type="text")
    ctx = mapping_translator.convert(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        functions.Cast(Field("name"), as_type).as_("name"),
        functions.Cast(Field("age"), as_type).as_("age"),
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()
