from typing import Any

import pytest
from pypika import Field, Query, functions
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import DateFormatMapping, SQLTranslator
from weaverbird.pipeline import steps


class DateFormatTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TIMESTAMP
    DATE_FORMAT_MAPPING = DateFormatMapping(
        day_number="%d",
        month_number="%m",
        month_short="%b",
        month_full="%M",
        year="%Y",
    )


ALL_TABLES = {"users": ["name", "pseudonyme", "age"]}
DB_SCHEMA = "test_schema"


@pytest.fixture
def date_format_translators():
    return DateFormatTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_fromdate(
    date_format_translators: DateFormatTranslator, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "birthday"
    format_ = "dd/yy"

    step = steps.FromdateStep(column=column, format=format_)
    ctx = date_format_translators.fromdate(
        step=step, columns=selected_columns, **default_step_kwargs
    )

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.ToChar(Field(column), format_).as_(column)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_to_date(date_format_translators: DateFormatTranslator):
    # TODO
    ...
