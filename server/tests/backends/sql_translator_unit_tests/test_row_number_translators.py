from typing import Any

import pytest
from pypika import Field, Order, Query

from weaverbird.backends.pypika_translator.translators.base import RowNumber, SQLTranslator
from weaverbird.backends.pypika_translator.utils.regex import (
    RegexNoEscapeMixin,
    RegexRegexpCriterionBuilder,
)
from weaverbird.pipeline import steps


class RowNumberEnabledTranslator(SQLTranslator, RegexRegexpCriterionBuilder, RegexNoEscapeMixin):
    DIALECT = "Base"
    QUERY_CLS = Query
    SUPPORT_ROW_NUMBER = True


class RowNumberDisabledTranslator(SQLTranslator, RegexRegexpCriterionBuilder, RegexNoEscapeMixin):
    DIALECT = "Base"
    QUERY_CLS = Query
    SUPPORT_ROW_NUMBER = False


ALL_TABLES = {"users": ["name", "pseudonyme", "age"]}
DB_SCHEMA = "test_schema"


@pytest.fixture
def row_number_enabled_translator():
    return RowNumberEnabledTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


@pytest.fixture
def row_number_disabled_translator():
    return RowNumberDisabledTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def get_top_query(sort_order, previous_step, group, rank_on, selected_columns, limit):
    age_field = Field(rank_on)
    name_field = Field(group)
    sub_query = Query.from_(previous_step).select(*selected_columns)
    rank_select = sub_query.select(
        RowNumber()
        .as_("row_number")
        .over(name_field)
        .orderby(age_field, order=getattr(Order, sort_order))
    )
    expected_query = (
        Query.from_(rank_select)
        .where(Field("row_number") <= limit)
        .orderby(*(Field(f) for f in [group, "row_number"]), order=Order.asc)
        .select(*selected_columns)
    )
    return expected_query


@pytest.mark.parametrize("sort_order", ["asc", "desc"])
def test_top_with_enabled_row_number(
    row_number_enabled_translator: RowNumberEnabledTranslator,
    sort_order: str,
    default_step_kwargs: dict[str, Any],
):
    previous_step = "previous_with"
    group = "name"
    rank_on = "age"
    selected_columns = ["*"]

    step = steps.TopStep(rank_on=rank_on, groups=[group], sort=sort_order, limit=100)
    ctx = row_number_enabled_translator.top(
        step=step, columns=selected_columns, **default_step_kwargs
    )

    expected_query = get_top_query(
        sort_order, previous_step, group, rank_on, selected_columns, step.limit
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


@pytest.mark.parametrize("sort_order", ["asc", "desc"])
def test_top_with_disabled_row_number(
    row_number_disabled_translator: RowNumberDisabledTranslator,
    sort_order: str,
    default_step_kwargs: dict[str, Any],
):
    group = "name"
    rank_on = "age"
    selected_columns = ["*"]

    step = steps.TopStep(rank_on=rank_on, groups=[group], sort=sort_order, limit=100)
    with pytest.raises(NotImplementedError):
        row_number_disabled_translator.top(
            step=step, columns=selected_columns, **default_step_kwargs
        )


def test_argmax_with_enabled_split_part(
    row_number_enabled_translator: RowNumberEnabledTranslator, default_step_kwargs: dict[str, Any]
):
    previous_step = "previous_with"
    group = "name"
    rank_on = "age"
    selected_columns = ["*"]

    step = steps.ArgmaxStep(column=rank_on, groups=[group])
    ctx = row_number_enabled_translator.argmax(
        step=step, columns=selected_columns, **default_step_kwargs
    )

    expected_query = get_top_query("desc", previous_step, group, rank_on, selected_columns, 1)

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_argmax_with_disabled_split_part(
    row_number_disabled_translator: RowNumberDisabledTranslator, default_step_kwargs: dict[str, Any]
):
    group = "name"
    rank_on = "age"
    selected_columns = ["*"]

    step = steps.ArgmaxStep(column=rank_on, groups=[group])
    with pytest.raises(NotImplementedError):
        row_number_disabled_translator.argmax(
            step=step, columns=selected_columns, **default_step_kwargs
        )


def test_argmin_with_enabled_split_part(
    row_number_enabled_translator: RowNumberEnabledTranslator, default_step_kwargs: dict[str, Any]
):
    previous_step = "previous_with"
    group = "name"
    rank_on = "age"
    selected_columns = ["*"]

    step = steps.ArgminStep(column=rank_on, groups=[group])
    ctx = row_number_enabled_translator.argmin(
        step=step, columns=selected_columns, **default_step_kwargs
    )

    expected_query = get_top_query("asc", previous_step, group, rank_on, selected_columns, 1)

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_argmin_with_disabled_split_part(
    row_number_disabled_translator: RowNumberDisabledTranslator, default_step_kwargs: dict[str, Any]
):
    group = "name"
    rank_on = "age"
    selected_columns = ["*"]

    step = steps.ArgminStep(column=rank_on, groups=[group])

    with pytest.raises(NotImplementedError):
        row_number_disabled_translator.argmin(
            step=step, columns=selected_columns, **default_step_kwargs
        )
