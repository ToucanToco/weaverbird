import pytest
from pypika import AliasedQuery, Case, Field, Order, Query, Schema, Table, functions
from pypika.terms import LiteralValue, ValueWrapper
from weaverbird.backends.pypika_translator.operators import RegexOp

from weaverbird.backends.pypika_translator.translators.base import RegexpMatching, RowNumber, SQLTranslator, StepTable
from weaverbird.exceptions import MissingTableNameError
from weaverbird.pipeline import conditions, steps
from weaverbird.pipeline.pipeline import DomainStep
from weaverbird.pipeline.steps.utils.combination import Reference
from pypika.terms import AnalyticFunction, BasicCriterion, LiteralValue 


class FilterTranslator(SQLTranslator):
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
def test_comparasion_filter(filter_translator: FilterTranslator, op: str):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    anonymous = "Jhon"

    condition = conditions.ComparisonCondition(column=column, operator=op, value=anonymous)

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = filter_translator.filter(step=step, table=step_table)

    import operator
    op_func = getattr(operator, op) 
    expected_query = (
        Query.from_(previous_step)
            .where(op_func(Field(column), anonymous))
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()


@pytest.mark.parametrize('op', ['in', 'nin'])
def test_inclusion_filter(filter_translator: FilterTranslator, op: str):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    inclusion = ["Jhon", "Doe"]

    condition = conditions.InclusionCondition(column=column, operator=op, value=inclusion)

    if op == 'in':
        op_func = Field(column).isin(inclusion)
    else:
        op_func = Field(column).notin(inclusion)

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = filter_translator.filter(step=step, table=step_table)
    expected_query = (
        Query.from_(previous_step)
            .where(op_func)
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()

@pytest.mark.parametrize('op', ['isnull', 'notnull'])
def test_null_filter(filter_translator: FilterTranslator, op: str):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"

    condition = conditions.NullCondition(column=column, operator=op)

    if op == 'isnull':
        op_func = Field(column).isnull()
    else:
        op_func = Field(column).isnotnull()

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = filter_translator.filter(step=step, table=step_table)
    expected_query = (
        Query.from_(previous_step)
            .where(op_func)
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()


@pytest.mark.parametrize('op', ['from', 'until'])
def test_datebound_filter(filter_translator: FilterTranslator, op: str):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    datetime = "04/05/2022"

    condition = conditions.DateBoundCondition(column=column, operator=op, value=datetime)

    if op == 'from':
        op_func = Field(column) <= datetime
    else:
        op_func = Field(column) >= datetime

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = filter_translator.filter(step=step, table=step_table)
    expected_query = (
        Query.from_(previous_step)
            .where(op_func)
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()

# MATCHES REGEXP

class REGEXPTranslator(SQLTranslator):
    DIALECT = "REGEXP"
    QUERY_CLS = Query
    REGEXP_OP = RegexOp.REGEXP

@pytest.fixture
def regexp_translator():
    return REGEXPTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_matches_regexp_filter(regexp_translator: REGEXPTranslator):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="matches", value=regex)

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = regexp_translator.filter(step=step, table=step_table)
    expected_query = (
        Query.from_(previous_step)
            .where(Field(column).regexp(regex))
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()

def test_notmatches_regexp_filter(regexp_translator: REGEXPTranslator):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="notmatches", value=regex)

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = regexp_translator.filter(step=step, table=step_table)
    expected_query = (
        Query.from_(previous_step)
            .where(Field(column).regexp(regex).negate())
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()

# MATCHES SIMILAR TO

class SimilarToTranslator(SQLTranslator):
    DIALECT = "SIMILAR TO"
    QUERY_CLS = Query
    REGEXP_OP = RegexOp.SIMILAR_TO

@pytest.fixture
def similar_to_translator():
    return SimilarToTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )

def test_matches_similar_to_filter(similar_to_translator: SimilarToTranslator):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="matches", value=regex)

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = similar_to_translator.filter(step=step, table=step_table)
    expected_query = (
        Query.from_(previous_step)
            .where(BasicCriterion(RegexpMatching.similar_to, Field(column), ValueWrapper(f"%{regex}%")))
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()

def test_notmatches_similar_to_filter(similar_to_translator: SimilarToTranslator):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="notmatches", value=regex)

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = similar_to_translator.filter(step=step, table=step_table)
    expected_query = (
        Query.from_(previous_step)
            .where(BasicCriterion(RegexpMatching.not_similar_to, Field(column), ValueWrapper(f"%{regex}%")))
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()


# MATCHES CONTAINS

class ContainsTranslator(SQLTranslator):
    DIALECT = "CONTAINS"
    QUERY_CLS = Query
    REGEXP_OP = RegexOp.CONTAINS

@pytest.fixture
def contains_translator():
    return ContainsTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )

def test_matches_contains_filter(contains_translator: ContainsTranslator):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="matches", value=regex)

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = contains_translator.filter(step=step, table=step_table)
    expected_query = (
        Query.from_(previous_step)
            .where(BasicCriterion(RegexpMatching.contains, Field(column), ValueWrapper(f"%{regex}%")))
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()

def test_notmatches_contains_filter(contains_translator: ContainsTranslator):
    selected_columns = ["name", "age"]
    previous_step = "previous_with"
    column = "name"
    regex = "Jane"

    condition = conditions.MatchCondition(column=column, operator="notmatches", value=regex)

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FilterStep(condition=condition)
    (query, _) = contains_translator.filter(step=step, table=step_table)
    expected_query = (
        Query.from_(previous_step)
            .where(BasicCriterion(RegexpMatching.not_contains, Field(column), ValueWrapper(f"%{regex}%")))
            .select(*selected_columns)
    )

    assert query.get_sql() == expected_query.get_sql()