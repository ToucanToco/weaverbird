import pytest
from pypika import Field, Query, functions

from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import SQLTranslator, StepTable
from weaverbird.pipeline import steps


class DateFormatTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TO_DATE


ALL_TABLES = {"users": ["name", "pseudonyme", "age"]}
DB_SCHEMA = "test_schema"


@pytest.fixture
def date_format_translators():
    return DateFormatTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_fromdate(date_format_translators: DateFormatTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "birthday"
    format = "dd/yy"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FromdateStep(column=column, format=format)
    (query, _) = date_format_translators.fromdate(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.ToChar(Field(column), format).as_(column)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_to_date(date_format_translators: DateFormatTranslator):
    # TODO
    ...
