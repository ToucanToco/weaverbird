from typing import Any

import pytest
from pypika import Field, Query, functions
from pypika.terms import BasicCriterion, Function

from weaverbird.backends.pypika_translator.operators import RegexOp
from weaverbird.backends.pypika_translator.translators.athena import AthenaTranslator
from weaverbird.backends.pypika_translator.translators.base import SQLTranslator
from weaverbird.backends.pypika_translator.translators.googlebigquery import (
    GoogleBigQueryQuery,
    GoogleBigQueryTranslator,
)
from weaverbird.backends.pypika_translator.utils.regex import (
    RegexNoEscapeMixin,
    RegexPercentEscapeMixin,
    RegexpMatchingComparator,
    RegexRegexpCriterionBuilder,
    RegexSimilarToCriterionBuilder,
)
from weaverbird.pipeline import conditions, steps


class FilterTranslator(SQLTranslator, RegexRegexpCriterionBuilder, RegexNoEscapeMixin):
    DIALECT = "Filter"
    QUERY_CLS = Query


ALL_TABLES = {"users": ["name", "pseudonyme", "age"]}
DB_SCHEMA = "test_schema"


@pytest.fixture
def filter_translator():
    return FilterTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


@pytest.mark.parametrize('op', ['eq', 'ne', 'lt', 'le', 'gt', 'ge'])
def test_comparison_filter(
    filter_translator: FilterTranslator, op: str, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    anonymous = "Jhon"

    condition = conditions.ComparisonCondition(column=column, operator=op, value=anonymous)

    step = steps.FilterStep(condition=condition)
    ctx = filter_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)

    import operator

    op_func = getattr(operator, op)
    expected_query = (
        Query.from_(previous_step)
        .where(op_func(Field(column), anonymous))
        .select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


@pytest.mark.parametrize('op', ['in', 'nin'])
def test_inclusion_filter(
    filter_translator: FilterTranslator, op: str, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    inclusion = ["Jhon", "Doe"]

    condition = conditions.InclusionCondition(column=column, operator=op, value=inclusion)

    op_func = {'in': Field(column).isin, 'nin': Field(column).notin}

    step = steps.FilterStep(condition=condition)
    ctx = filter_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = (
        Query.from_(previous_step).where(op_func[op](inclusion)).select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


@pytest.mark.parametrize('op', ['isnull', 'notnull'])
def test_null_filter(
    filter_translator: FilterTranslator, op: str, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"

    condition = conditions.NullCondition(column=column, operator=op)

    op_func = {'isnull': Field(column).isnull, 'notnull': Field(column).isnotnull}

    step = steps.FilterStep(condition=condition)
    ctx = filter_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).where(op_func[op]()).select(*selected_columns)

    assert ctx.selectable.get_sql() == expected_query.get_sql()


@pytest.mark.parametrize('op', ['from', 'until'])
def test_datebound_filter(
    filter_translator: FilterTranslator, op: str, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    datetime = "04/05/2022"

    condition = conditions.DateBoundCondition(column=column, operator=op, value=datetime)

    from dateutil import parser as dateutil_parser

    value_str_time = dateutil_parser.parse(datetime).astimezone().strftime('%Y-%m-%d %H:%M:%S')
    if op == 'from':
        op_func = functions.Cast(Field(column), 'TIMESTAMP') >= functions.Cast(
            value_str_time, 'TIMESTAMP'
        )
    else:
        op_func = functions.Cast(Field(column), 'TIMESTAMP') <= functions.Cast(
            value_str_time, 'TIMESTAMP'
        )

    step = steps.FilterStep(condition=condition)
    ctx = filter_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = Query.from_(previous_step).where(op_func).select(*selected_columns)

    assert ctx.selectable.get_sql() == expected_query.get_sql()


# MATCHES REGEXP


class REGEXPTranslator(SQLTranslator, RegexRegexpCriterionBuilder, RegexPercentEscapeMixin):
    DIALECT = "REGEXP"
    QUERY_CLS = Query
    REGEXP_OP = RegexOp.REGEXP


@pytest.fixture
def regexp_translator():
    return REGEXPTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_matches_regexp_filter(
    regexp_translator: REGEXPTranslator, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="matches", value=regex)

    step = steps.FilterStep(condition=condition)
    ctx = regexp_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .where(Field(column).regexp(f'%{regex}%'))
        .select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_notmatches_regexp_filter(
    regexp_translator: REGEXPTranslator, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="notmatches", value=regex)

    step = steps.FilterStep(condition=condition)
    ctx = regexp_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .where(Field(column).regexp(f'%{regex}%').negate())
        .select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


# MATCHES SIMILAR TO


class SimilarToTranslator(SQLTranslator, RegexSimilarToCriterionBuilder, RegexNoEscapeMixin):
    DIALECT = "SIMILAR TO"
    QUERY_CLS = Query
    REGEXP_OP = RegexOp.SIMILAR_TO


@pytest.fixture
def similar_to_translator():
    return SimilarToTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_matches_similar_to_filter(
    similar_to_translator: SimilarToTranslator, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    field = Field(column)
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="matches", value=regex)

    step = steps.FilterStep(condition=condition)
    ctx = similar_to_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .where(
            BasicCriterion(RegexpMatchingComparator.SIMILAR_TO, field, field.wrap_constant(regex))
        )
        .select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_notmatches_similar_to_filter(
    similar_to_translator: SimilarToTranslator, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    field = Field(column)
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="notmatches", value=regex)

    step = steps.FilterStep(condition=condition)
    ctx = similar_to_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .where(
            BasicCriterion(
                RegexpMatchingComparator.SIMILAR_TO, field, field.wrap_constant(regex)
            ).negate()
        )
        .select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


# Athena is the only translator using REGEXP_LIKE, so we're using it here
@pytest.fixture
def regexp_like_translator() -> AthenaTranslator:
    return AthenaTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_matches_regexp_like_filter(
    regexp_like_translator: AthenaTranslator, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    field = Field(column)
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="matches", value=regex)

    step = steps.FilterStep(condition=condition)
    ctx = regexp_like_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .where(Function("REGEXP_LIKE", field, field.wrap_constant(regex)))
        .select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_notmatches_regexp__like_filter(
    regexp_like_translator: AthenaTranslator, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    field = Field(column)
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="notmatches", value=regex)

    step = steps.FilterStep(condition=condition)
    ctx = regexp_like_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .where(Function("REGEXP_LIKE", field, field.wrap_constant(regex)).negate())
        .select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


# GBQ is the only translator using CONTAINS, so we're using it directly here
@pytest.fixture
def gbq_translator() -> GoogleBigQueryTranslator:
    return GoogleBigQueryTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_matches_regexp_contains_filter(
    gbq_translator: GoogleBigQueryTranslator, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    field = Field(column)
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="matches", value=regex)

    step = steps.FilterStep(condition=condition)
    ctx = gbq_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        GoogleBigQueryQuery.from_(previous_step)
        .where(Function("REGEXP_CONTAINS", field, field.wrap_constant(regex)))
        .select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_notmatches_regexp__contains_filter(
    gbq_translator: GoogleBigQueryTranslator, default_step_kwargs: dict[str, Any]
):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    field = Field(column)
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="notmatches", value=regex)

    step = steps.FilterStep(condition=condition)
    ctx = gbq_translator.filter(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        GoogleBigQueryQuery.from_(previous_step)
        .where(Function("REGEXP_CONTAINS", field, field.wrap_constant(regex)).negate())
        .select(*selected_columns)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()
