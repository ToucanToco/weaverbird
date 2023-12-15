from typing import Any

import pytest
from pypika import Field, Query, functions
from weaverbird.backends.pypika_translator.translators.base import SQLTranslator
from weaverbird.pipeline import steps


class SplitEnabledTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query
    SUPPORT_SPLIT_PART = True

    @classmethod
    def _interval_to_seconds(cls, value):
        raise NotImplementedError


class SplitDisabledTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query
    SUPPORT_SPLIT_PART = False

    @classmethod
    def _interval_to_seconds(cls, value):
        raise NotImplementedError


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


def test_split_enabled(split_enabled_translator: SplitEnabledTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    delimiter = ","

    step = steps.SplitStep(column=column, delimiter=delimiter, number_cols_to_keep=2)
    ctx = split_enabled_translator.split(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        functions.SplitPart(Field(column), delimiter, 1).as_(f"{column}_1"),
        functions.SplitPart(Field(column), delimiter, 2).as_(f"{column}_2"),
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_split_disabled(split_disabled_translator: SplitDisabledTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    column = "name"
    delimiter = ","

    step = steps.SplitStep(column=column, delimiter=delimiter, number_cols_to_keep=2)
    with pytest.raises(NotImplementedError):
        split_disabled_translator.split(step=step, columns=selected_columns, **default_step_kwargs)
