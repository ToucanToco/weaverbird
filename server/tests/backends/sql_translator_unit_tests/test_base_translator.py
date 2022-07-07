import pytest
from pypika import AliasedQuery, Case, Field, Order, Query, Schema, Table, functions
from pypika.terms import LiteralValue, ValueWrapper

from weaverbird.backends.pypika_translator.translators.base import RowNumber, SQLTranslator, StepTable
from weaverbird.exceptions import MissingTableNameError
from weaverbird.pipeline import conditions, steps
from weaverbird.pipeline.pipeline import DomainStep
from weaverbird.pipeline.steps.utils.combination import Reference

class BaseTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query


ALL_TABLES = {"users": ["name", "pseudonyme", "age"]}
DB_SCHEMA = "test_schema"


@pytest.fixture
def base_translator():
    return BaseTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )

def test_get_query(base_translator: BaseTranslator):
    steps = [DomainStep(domain="users")]

    schema = Schema(DB_SCHEMA)

    step_1_query = Query.from_(schema.users).select(*ALL_TABLES["users"])
    expected = (
        Query.with_(step_1_query, "__step_0__")
        .from_(AliasedQuery('"__step_0__"'))
        .select("*")
    )

    query = base_translator.get_query(steps=steps)
    assert query.get_sql() == expected.get_sql()

class ErrorStep:
    name = "custom step"

def test_get_query_raises_error(base_translator: BaseTranslator):
    pipeline_steps = [DomainStep(domain="users"), ErrorStep()]
    
    with pytest.raises(NotImplementedError):
        base_translator.get_query(steps=pipeline_steps)

def test_get_query_with_custom_query(base_translator: BaseTranslator):
    pipeline_steps = [steps.CustomSqlStep(query="SELECT 1")]

    step_1_query = Query.select(1)
    expected = (
        Query.with_(step_1_query, "__step_0__")
        .from_(AliasedQuery('"__step_0__"'))
        .select("*")
    )

    query = base_translator.get_query(steps=pipeline_steps)
    assert query.get_sql() == expected.get_sql()

def test_get_query_more_than_one_step(base_translator: BaseTranslator):
    to_rename="age"
    rename_as="old"
    pipeline_steps = [DomainStep(domain="users"), steps.RenameStep(toRename=[(to_rename, rename_as)])]

    schema = Schema(DB_SCHEMA)

    step_0_query = Query.from_(schema.users).select(*ALL_TABLES["users"])
    expected = (
        Query.with_(step_0_query, "__step_0__")
        .from_(schema.users)
        .select("*")
    )

    rename_fields = lambda col: Field(col) if col is not to_rename else Field(col).as_(rename_as)
    columns = list(map(rename_fields, ALL_TABLES["users"]))
    step_1_query = (
        Query.from_(AliasedQuery('"__step_0__"'))
        .select(*columns)
    )

    expected = (
        Query.with_(step_0_query, "__step_0__")
        .with_(step_1_query, "__step_1__")
        .from_(AliasedQuery('"__step_1__"'))
        .select("*")
    )

    query = base_translator.get_query(steps=pipeline_steps)
    assert query.get_sql() == expected.get_sql()

def test_get_query_str(base_translator: BaseTranslator):
    steps = [DomainStep(domain="users")]

    schema = Schema(DB_SCHEMA)

    step_1_query = Query.from_(schema.users).select(*ALL_TABLES["users"])
    expected = (
        Query.with_(step_1_query, "__step_0__")
        .from_(AliasedQuery('"__step_0__"'))
        .select("*")
        .get_sql()
    )

    query = base_translator.get_query_str(steps=steps)
    assert query == expected


@pytest.mark.parametrize("agg_type", ["avg", "count", "count distinct", "max", "min", "sum"])
def test_get_aggregate_function(base_translator: BaseTranslator, agg_type):
    agg_func = base_translator._get_aggregate_function(agg_type)
    assert issubclass(agg_func, functions.AggregateFunction)


@pytest.mark.parametrize("agg_type", ["first", "last", "count distinct including empty"])
def test_get_aggregate_function_raise_expection(base_translator: BaseTranslator, agg_type):
    with pytest.raises(NotImplementedError):
        base_translator._get_aggregate_function(agg_type)


@pytest.mark.parametrize("agg_type", ["avg", "count", "count distinct", "max", "min", "sum"])
def test_aggregate(base_translator: BaseTranslator, agg_type):
    new_column = "avgAge"
    previous_step = "previous_with"
    agg_field = "age"

    step_table = StepTable(columns=["*"], name=previous_step)
    step = steps.AggregateStep(
        on=[agg_field],
        aggregations=[
            steps.Aggregation(new_columns=[new_column], agg_function=agg_type, columns=[agg_field])
        ],
    )
    (query, _) = base_translator.aggregate(step=step, table=step_table)

    agg_func = base_translator._get_aggregate_function(agg_type)
    field = Field(agg_field)
    expected_query = (
        Query.from_(previous_step)
        .groupby(field)
        .orderby(field, order=Order.asc)
        .select(field, agg_func(field).as_(new_column))
    )

    assert query.get_sql() == expected_query.get_sql()

@pytest.mark.parametrize("agg_type", ["avg", "count", "count distinct", "max", "min", "sum"])
def test_aggregate_with_original_granularity(base_translator: BaseTranslator, agg_type):
    original_select = ["*"]
    new_column = "avgAge"
    previous_step = "previous_with"
    agg_field = "age"

    step_table = StepTable(columns=original_select, name=previous_step)
    step = steps.AggregateStep(
        on=[agg_field],
        aggregations=[
            steps.Aggregation(new_columns=[new_column], agg_function=agg_type, columns=[agg_field])
        ],
        keepOriginalGranularity=True
    )
    (query, _) = base_translator.aggregate(step=step, table=step_table)

    original_query = Query.from_(previous_step).select(*original_select)
    agg_func = base_translator._get_aggregate_function(agg_type)
    field = Field(agg_field)
    agg_query = (
        Query.from_(previous_step)
        .groupby(field)
        .select(field, agg_func(field).as_(new_column))
    )

    expected_query = (
        Query.from_(original_query)
        .left_join(agg_query)
        .on_field(agg_field)
        .select(*original_select)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_comparetext(base_translator: BaseTranslator):
    previous_step = "previous_with"
    selected_columns = ["*"]
    new_column_name = "new_name"
    compare_a = "name"
    compare_b = "pseudonyme"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.CompareTextStep(
        newColumnName=new_column_name, strCol1=compare_a, strCol2=compare_b
    )
    (query, _) = base_translator.comparetext(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        Case().when(Field(compare_a) == Field(compare_b), True).else_(False).as_(new_column_name),
    )

    assert query.get_sql() == expected_query.get_sql()


def test_concatenate(base_translator: BaseTranslator):
    previous_step = "previous_with"
    selected_columns = ["*"]
    new_column_name = "new_name"
    concat_columns = ["name", "pseudonyme"]
    separator = ','

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.ConcatenateStep(
        columns=concat_columns, separator=separator, new_column_name=new_column_name
    )
    (query, _) = base_translator.concatenate(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        functions.Concat(Field("name"), separator, Field("pseudonyme")).as_(new_column_name),
    )

    assert query.get_sql() == expected_query.get_sql()


def test_customsql(base_translator: BaseTranslator):
    previous_step = "previous_with"
    selected_columns = ["*"]
    custom_query = "Select * from users"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.CustomSqlStep(query=custom_query)
    (query, _) = base_translator.customsql(step=step, table=step_table)

    assert query.get_sql() == custom_query


def test_customsql_fails(base_translator: BaseTranslator):
    selected_columns = ["*"]
    custom_query = "Select * from users"

    step_table = StepTable(columns=selected_columns)
    step = steps.CustomSqlStep(query=custom_query)
    with pytest.raises(MissingTableNameError):
        base_translator.customsql(step=step, table=step_table)


def test_delete(base_translator: BaseTranslator):
    previous_step = "previous_with"
    selected_columns = ALL_TABLES["users"]
    deleted_columns = ["name", "age"]
    left_columns = filter(lambda c: c not in deleted_columns, ALL_TABLES["users"])

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.DeleteStep(columns=deleted_columns)
    (query, _) = base_translator.delete(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *left_columns,
    )

    assert query.get_sql() == expected_query.get_sql()


def test_domain(base_translator: BaseTranslator):
    domain = "users"
    step = steps.DomainStep(domain=domain)
    (query, _) = base_translator.domain(step=step)

    schema = Schema(DB_SCHEMA)
    users = Table(domain, schema)
    expected_query = Query.from_(users).select(*ALL_TABLES["users"])

    assert query.get_sql() == expected_query.get_sql()


# this seems wrong for me...
def test_domain_with_wrong_domain_name(base_translator: BaseTranslator):
    domain = "people"
    step = steps.DomainStep(domain=domain)
    (query, _) = base_translator.domain(step=step)

    schema = Schema(DB_SCHEMA)
    people = Table(domain, schema)
    expected_query = Query.from_(people).select("*")

    assert query.get_sql() == expected_query.get_sql()


def test_domain_with_reference(base_translator: BaseTranslator):
    uid = "to be or not to be a query ?"
    type = "ref"
    step = steps.DomainStep(domain=Reference(type=type, uid=uid))
    with pytest.raises(NotImplementedError):
        base_translator.domain(step=step)


def test_duplicate(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    to_duplicate_columns = "name"
    new_column_name = "fancy name"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.DuplicateStep(column=to_duplicate_columns, new_column_name=new_column_name)
    (query, _) = base_translator.duplicate(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, Field(to_duplicate_columns).as_(new_column_name)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_fillna(base_translator: BaseTranslator):
    selected_columns = ["*"]
    previous_step = "previous_with"
    columns = ["name"]
    anonymous = "Jhon"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FillnaStep(columns=columns, value=anonymous)
    (query, _) = base_translator.fillna(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.Coalesce(Field(*columns), anonymous).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_formula(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    new_column_name = "fancy division"
    formula = "2/4"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FormulaStep(new_column=new_column_name, formula=formula)
    (query, _) = base_translator.formula(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, LiteralValue(formula).as_(new_column_name)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_ifthenelse(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    new_column_name = "fancy division"
    column = "name"
    value = "goerge"
    statement = conditions.ComparisonCondition(column=column, operator='eq', value=value)
    then = "a"
    reject = "b"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.IfthenelseStep(
        condition=statement, then=then, else_value=reject, newColumn=new_column_name
    )
    (query, _) = base_translator.ifthenelse(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        Case()
        .when(Field(column) == value, LiteralValue(then))
        .else_(LiteralValue(reject))
        .as_(new_column_name),
    )

    assert query.get_sql() == expected_query.get_sql()


def test_lowercase(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.LowercaseStep(column=column)
    (query, _) = base_translator.lowercase(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Lower(Field(column)).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_uppercase(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.UppercaseStep(column=column)
    (query, _) = base_translator.uppercase(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Upper(Field(column)).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_percentage(base_translator: BaseTranslator):
    with pytest.raises(NotImplementedError):
        base_translator.percentage(
            step=steps.PercentageStep(column="", group=[], newColumnName=""),
            table=StepTable(columns=[], name=""),
        )


def test_replace(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    find = "a"
    replace_with = "b"
    replace = [(find, replace_with)]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.ReplaceStep(search_column=column, to_replace=replace)
    (query, _) = base_translator.replace(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Replace(Field(column), find, replace_with).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_select(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    columns = ["name"]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.SelectStep(columns=columns)
    (query, _) = base_translator.select(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(Field("name"))

    assert query.get_sql() == expected_query.get_sql()


def test_sort(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    columns = [{'column': "name", 'order': "asc"}]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.SortStep(columns=columns)
    (query, _) = base_translator.sort(step=step, table=step_table)

    expected_query = (
        Query.from_(previous_step).select(*selected_columns).orderby(Field("name"), order=Order.asc)
    )

    assert query.get_sql() == expected_query.get_sql()

def test_substring(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    new_column_name = "name"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.SubstringStep(
        column=column, newColumnName=new_column_name, start_index=0, end_index=10
    )
    (query, _) = base_translator.substring(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.Substring(Field(column), 0, 11).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_text(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    new_column_name = "name"
    text = "Hello World"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.TextStep(text=text, new_column=new_column_name)
    (query, _) = base_translator.text(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, ValueWrapper(text).as_(new_column_name)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_trim(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    columns = [column]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.TrimStep(columns=columns)
    (query, _) = base_translator.trim(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Trim(Field(column)).as_(column)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_uniquegroups(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    columns = [column]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.UniqueGroupsStep(on=columns)
    (query, _) = base_translator.uniquegroups(step=step, table=step_table)

    expected_query = (
        Query.from_(previous_step)
        .select(Field(column))
        .groupby(Field(column))
        .orderby(Field(column), order=Order.asc)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_absolutevalue(base_translator: BaseTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "age"
    new_column = "abs_age"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.AbsoluteValueStep(column=column, new_column=new_column)
    (query, _) = base_translator.absolutevalue(step=step, table=step_table)

    expected_query = (
        Query.from_(previous_step)
        .select(*selected_columns, functions.Abs(Field(column)).as_(new_column))
    )

    assert query.get_sql() == expected_query.get_sql()