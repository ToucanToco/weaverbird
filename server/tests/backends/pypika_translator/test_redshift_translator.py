import pytest
from pypika import AliasedQuery, Case, Field, Order, Query, Schema, Table, functions
from pypika.terms import LiteralValue, ValueWrapper

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translators import ALL_TRANSLATORS
from weaverbird.backends.pypika_translator.translators.base import RowNumber, StepTable
from weaverbird.backends.pypika_translator.translators.redshift import RedshiftTranslator
from weaverbird.exceptions import MissingTableNameError
from weaverbird.pipeline import conditions, steps
from weaverbird.pipeline.pipeline import DomainStep
from weaverbird.pipeline.steps.utils.combination import Reference

ALL_TABLES = {"users": ["name", "pseudonyme", "age"]}
DB_SCHEMA = "test_schema"


@pytest.fixture
def redshift_translator():
    translator_cls = ALL_TRANSLATORS[SQLDialect.REDSHIFT]
    return translator_cls(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_get_query(redshift_translator: RedshiftTranslator):
    steps = [DomainStep(domain="users")]

    schema = Schema(DB_SCHEMA)
    step_1_query = Query.from_(schema.users).select(*ALL_TABLES["users"])
    expected = (
        Query.with_(step_1_query, "__step_0__").from_(AliasedQuery('"__step_0__"')).select("*")
    )

    query = redshift_translator.get_query(steps=steps)
    assert query.get_sql() == expected.get_sql()


def test_get_query_str(redshift_translator: RedshiftTranslator):
    steps = [DomainStep(domain="users")]

    schema = Schema(DB_SCHEMA)

    step_1_query = Query.from_(schema.users).select(*ALL_TABLES["users"])
    expected = (
        Query.with_(step_1_query, "__step_0__")
        .from_(AliasedQuery('"__step_0__"'))
        .select("*")
        .get_sql()
    )

    query = redshift_translator.get_query_str(steps=steps)
    assert query == expected


@pytest.mark.parametrize("agg_type", ["avg", "count", "count distinct", "max", "min", "sum"])
def test_get_aggregate_function(redshift_translator: RedshiftTranslator, agg_type):
    agg_func = redshift_translator._get_aggregate_function(agg_type)
    assert issubclass(agg_func, functions.AggregateFunction)


@pytest.mark.parametrize("agg_type", ["first", "last", "count distinct including empty"])
def test_get_aggregate_function_raise_expection(redshift_translator: RedshiftTranslator, agg_type):
    with pytest.raises(NotImplementedError):
        redshift_translator._get_aggregate_function(agg_type)


@pytest.mark.parametrize("agg_type", ["avg", "count", "count distinct", "max", "min", "sum"])
def test_aggregate(redshift_translator: RedshiftTranslator, agg_type):

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
    (query, new_step_table) = redshift_translator.aggregate(step=step, table=step_table)

    agg_func = redshift_translator._get_aggregate_function(agg_type)
    field = Field(agg_field)
    expected_query = (
        Query.from_(previous_step)
        .groupby(field)
        .orderby(field, order=Order.asc)
        .select(field, agg_func(field).as_(new_column))
    )

    assert query.get_sql() == expected_query.get_sql()


def get_top_query(sort_order, previous_step, group, rank_on, selected_columns, limit):
    age_field = Field(rank_on)
    name_field = Field(group)
    sub_query = Query.from_(previous_step).select(*selected_columns)
    rank_select = sub_query.select(
        RowNumber()
        .as_("row_number")
        .over(name_field)
        .orderby(age_field, order=Order.asc if sort_order == "asc" else Order.desc)
    )
    expected_query = (
        Query.from_(rank_select).where(Field("row_number") == limit).select(*selected_columns)
    )
    return expected_query


@pytest.mark.parametrize("sort_order", ["asc", "desc"])
def test_top(redshift_translator: RedshiftTranslator, sort_order):
    previous_step = "previous_with"
    group = "name"
    rank_on = "age"
    selected_columns = ["*"]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.TopStep(rank_on=rank_on, groups=[group], sort=sort_order, limit=100)
    (query, new_step_table) = redshift_translator.top(step=step, table=step_table)

    expected_query = get_top_query(
        sort_order, previous_step, group, rank_on, selected_columns, step.limit
    )

    assert query.get_sql() == expected_query.get_sql()


def test_argmax(redshift_translator: RedshiftTranslator):
    previous_step = "previous_with"
    group = "name"
    rank_on = "age"
    selected_columns = ["*"]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.ArgmaxStep(column=rank_on, groups=[group])
    (query, new_step_table) = redshift_translator.argmax(step=step, table=step_table)

    expected_query = get_top_query("desc", previous_step, group, rank_on, selected_columns, 1)

    assert query.get_sql() == expected_query.get_sql()


def test_argmin(redshift_translator: RedshiftTranslator):
    previous_step = "previous_with"
    group = "name"
    rank_on = "age"
    selected_columns = ["*"]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.ArgminStep(column=rank_on, groups=[group])
    (query, new_step_table) = redshift_translator.argmin(step=step, table=step_table)

    expected_query = get_top_query("asc", previous_step, group, rank_on, selected_columns, 1)

    assert query.get_sql() == expected_query.get_sql()


def test_comparetext(redshift_translator: RedshiftTranslator):
    previous_step = "previous_with"
    selected_columns = ["*"]
    new_column_name = "new_name"
    compare_a = "name"
    compare_b = "pseudonyme"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.CompareTextStep(
        newColumnName=new_column_name, strCol1=compare_a, strCol2=compare_b
    )
    (query, new_step_table) = redshift_translator.comparetext(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        Case().when(Field(compare_a) == Field(compare_b), True).else_(False).as_(new_column_name),
    )

    assert query.get_sql() == expected_query.get_sql()


def test_concatenate(redshift_translator: RedshiftTranslator):
    previous_step = "previous_with"
    selected_columns = ["*"]
    new_column_name = "new_name"
    concat_columns = ["name", "pseudonyme"]
    separator = ','

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.ConcatenateStep(
        columns=concat_columns, separator=separator, new_column_name=new_column_name
    )
    (query, new_step_table) = redshift_translator.concatenate(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        functions.Concat(Field("name"), separator, Field("pseudonyme")).as_(new_column_name),
    )

    assert query.get_sql() == expected_query.get_sql()


def test_convert(redshift_translator: RedshiftTranslator):
    previous_step = "previous_with"
    selected_columns = ["*"]
    convert_columns = ["name", "age"]
    as_type = "text"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.ConvertStep(columns=convert_columns, data_type="text")
    (query, new_step_table) = redshift_translator.convert(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        functions.Cast(Field("name"), as_type).as_("name"),
        functions.Cast(Field("age"), as_type).as_("age"),
    )

    assert query.get_sql() == expected_query.get_sql()


def test_customsql(redshift_translator: RedshiftTranslator):
    previous_step = "previous_with"
    selected_columns = ["*"]
    custom_query = "Select * from users"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.CustomSqlStep(query=custom_query)
    (query, new_step_table) = redshift_translator.customsql(step=step, table=step_table)

    assert query.get_sql() == custom_query


def test_customsql_fails(redshift_translator: RedshiftTranslator):
    selected_columns = ["*"]
    custom_query = "Select * from users"

    step_table = StepTable(columns=selected_columns)
    step = steps.CustomSqlStep(query=custom_query)
    with pytest.raises(MissingTableNameError):
        redshift_translator.customsql(step=step, table=step_table)


def test_delete(redshift_translator: RedshiftTranslator):
    previous_step = "previous_with"
    selected_columns = ALL_TABLES["users"]
    deleted_columns = ["name", "age"]
    left_columns = filter(lambda c: c not in deleted_columns, ALL_TABLES["users"])

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.DeleteStep(columns=deleted_columns)
    (query, new_step_table) = redshift_translator.delete(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *left_columns,
    )

    assert query.get_sql() == expected_query.get_sql()


def test_domain(redshift_translator: RedshiftTranslator):
    domain = "users"
    step = steps.DomainStep(domain=domain)
    (query, new_step_table) = redshift_translator.domain(step=step)

    schema = Schema(DB_SCHEMA)
    users = Table(domain, schema)
    expected_query = Query.from_(users).select(*ALL_TABLES["users"])

    assert query.get_sql() == expected_query.get_sql()


# this seems wrong for me...
def test_domain_with_wrong_domain_name(redshift_translator: RedshiftTranslator):
    domain = "people"
    step = steps.DomainStep(domain=domain)
    (query, new_step_table) = redshift_translator.domain(step=step)

    schema = Schema(DB_SCHEMA)
    people = Table(domain, schema)
    expected_query = Query.from_(people).select("*")

    assert query.get_sql() == expected_query.get_sql()


def test_domain_with_reference(redshift_translator: RedshiftTranslator):
    uid = "to be or not to be a query ?"
    type = "ref"
    step = steps.DomainStep(domain=Reference(type=type, uid=uid))
    with pytest.raises(NotImplementedError):
        redshift_translator.domain(step=step)


def test_duplicate(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    to_duplicate_columns = "name"
    new_column_name = "fancy name"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.DuplicateStep(column=to_duplicate_columns, new_column_name=new_column_name)
    (query, new_step_table) = redshift_translator.duplicate(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, Field(to_duplicate_columns).as_(new_column_name)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_fillna(redshift_translator: RedshiftTranslator):
    selected_columns = ["*"]
    previous_step = "previous_with"
    columns = ["name"]
    anonymous = "Jhon"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FillnaStep(columns=columns, value=anonymous)
    (query, new_step_table) = redshift_translator.fillna(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.Coalesce(Field(*columns), anonymous).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_filter(redshift_translator: RedshiftTranslator):
    # TODO
    ...


def test_formula(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    new_column_name = "fancy division"
    formula = "2/4"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FormulaStep(new_column=new_column_name, formula=formula)
    (query, new_step_table) = redshift_translator.formula(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, LiteralValue(formula).as_(new_column_name)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_fromdate(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "birthday"
    format = "dd/yy"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.FromdateStep(column=column, format=format)
    (query, new_step_table) = redshift_translator.fromdate(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.ToChar(Field(column), format).as_(column)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_ifthenelse(redshift_translator: RedshiftTranslator):
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
    (query, new_step_table) = redshift_translator.ifthenelse(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        Case()
        .when(Field(column) == value, LiteralValue(then))
        .else_(LiteralValue(reject))
        .as_(new_column_name),
    )

    assert query.get_sql() == expected_query.get_sql()


def test_lowercase(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.LowercaseStep(column=column)
    (query, new_step_table) = redshift_translator.lowercase(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Lower(Field(column)).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_uppercase(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.UppercaseStep(column=column)
    (query, new_step_table) = redshift_translator.uppercase(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Upper(Field(column)).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_percentage(redshift_translator: RedshiftTranslator):
    with pytest.raises(NotImplementedError):
        redshift_translator.percentage(
            step=steps.PercentageStep(column="", group=[], newColumnName=""),
            table=StepTable(columns=[], name=""),
        )


def test_replace(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    find = "a"
    replace_with = "b"
    replace = [(find, replace_with)]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.ReplaceStep(search_column=column, to_replace=replace)
    (query, new_step_table) = redshift_translator.replace(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Replace(Field(column), find, replace_with).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_select(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    columns = ["name"]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.SelectStep(columns=columns)
    (query, new_step_table) = redshift_translator.select(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(Field("name"))

    assert query.get_sql() == expected_query.get_sql()


def test_sort(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    columns = [{'column': "name", 'order': "asc"}]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.SortStep(columns=columns)
    (query, new_step_table) = redshift_translator.sort(step=step, table=step_table)

    expected_query = (
        Query.from_(previous_step).select(*selected_columns).orderby(Field("name"), order=Order.asc)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_split(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    delimiter = ","

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.SplitStep(column=column, delimiter=delimiter, number_cols_to_keep=2)
    (query, new_step_table) = redshift_translator.split(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        functions.SplitPart(Field(column), delimiter, 1).as_(f"{column}_1"),
        functions.SplitPart(Field(column), delimiter, 2).as_(f"{column}_2"),
    )

    assert query.get_sql() == expected_query.get_sql()


def test_substring(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    new_column_name = "name"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.SubstringStep(
        column=column, newColumnName=new_column_name, start_index=0, end_index=10
    )
    (query, new_step_table) = redshift_translator.substring(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.Substring(Field(column), 0, 11).as_("name")
    )

    assert query.get_sql() == expected_query.get_sql()


def test_text(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    new_column_name = "name"
    text = "Hello World"

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.TextStep(text=text, new_column=new_column_name)
    (query, new_step_table) = redshift_translator.text(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, ValueWrapper(text).as_(new_column_name)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_to_date(redshift_translator: RedshiftTranslator):
    # TODO
    ...


def test_trim(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    columns = [column]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.TrimStep(columns=columns)
    (query, new_step_table) = redshift_translator.trim(step=step, table=step_table)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Trim(Field(column)).as_(column)
    )

    assert query.get_sql() == expected_query.get_sql()


def test_uniquegroups(redshift_translator: RedshiftTranslator):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    columns = [column]

    step_table = StepTable(columns=selected_columns, name=previous_step)
    step = steps.UniqueGroupsStep(on=columns)
    (query, new_step_table) = redshift_translator.uniquegroups(step=step, table=step_table)

    expected_query = (
        Query.from_(previous_step)
        .select(Field(column))
        .groupby(Field(column))
        .orderby(Field(column), order=Order.asc)
    )

    assert query.get_sql() == expected_query.get_sql()
