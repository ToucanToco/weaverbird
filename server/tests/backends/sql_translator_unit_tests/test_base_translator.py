from typing import Any

import pytest
from pypika import AliasedQuery, Case, Field, Order, Query, Schema, Table, functions
from pypika.enums import JoinType
from pypika.terms import LiteralValue, Term, ValueWrapper

from weaverbird.backends.pypika_translator.translators.base import SQLTranslator
from weaverbird.pipeline import conditions, steps
from weaverbird.pipeline.pipeline import DomainStep
from weaverbird.pipeline.steps.utils.combination import Reference


class BaseTranslator(SQLTranslator):
    DIALECT = "Base"
    QUERY_CLS = Query
    QUOTE_CHAR = '"'


ALL_TABLES = {
    "users": ["name", "pseudonyme", "age", "id", "project_id"],
    "projects": ["id", "name", "created_at"],
    "addresses": ["user_id", "street_name"],
}
DB_SCHEMA = "test_schema"


@pytest.fixture
def base_translator():
    return BaseTranslator(
        tables_columns=ALL_TABLES,
        db_schema=DB_SCHEMA,
    )


def test_get_query_builder(base_translator: BaseTranslator):
    steps = [DomainStep(domain="users")]

    schema = Schema(DB_SCHEMA)

    step_1_query = Query.from_(schema.users).select(*ALL_TABLES["users"])
    expected = (
        Query.with_(step_1_query, "__step_0_basetranslator__")
        .from_("__step_0_basetranslator__")
        .select(*ALL_TABLES["users"])
    )

    qb_context = base_translator.get_query_builder(steps=steps)
    assert qb_context.materialize().get_sql() == expected.get_sql()
    assert qb_context.columns == ALL_TABLES["users"]


class ErrorStep:
    name = "custom step"


def test_get_query_builder_raises_error(base_translator: BaseTranslator):
    pipeline_steps = [DomainStep(domain="users"), ErrorStep()]

    with pytest.raises(NotImplementedError):
        base_translator.get_query_builder(steps=pipeline_steps)


def test_get_query_builder_with_custom_query(base_translator: BaseTranslator):
    pipeline_steps = [steps.CustomSqlStep(query="SELECT 1")]

    step_1_query = Query.select(1)
    expected = (
        Query.with_(step_1_query, "__step_0_basetranslator__")
        .from_(AliasedQuery('"__step_0_basetranslator__"'))
        .select("*")
    )

    ctx = base_translator.get_query_builder(steps=pipeline_steps)
    assert ctx.materialize().get_sql() == expected.get_sql()


def test_get_query_builder_more_than_one_step(base_translator: BaseTranslator):
    to_rename = "age"
    rename_as = "old"
    pipeline_steps = [
        DomainStep(domain="users"),
        steps.RenameStep(toRename=[(to_rename, rename_as)]),
    ]

    schema = Schema(DB_SCHEMA)

    step_0_query = Query.from_(schema.users).select(*ALL_TABLES["users"])
    expected = (
        Query.with_(step_0_query, "__step_0_basetranslator__").from_(schema.users).select("*")
    )

    columns = (
        Field(col) if col is not to_rename else Field(col).as_(rename_as)
        for col in ALL_TABLES["users"]
    )
    expected_cols = (col if col != to_rename else rename_as for col in ALL_TABLES["users"])
    step_1_query = Query.from_(AliasedQuery('"__step_0_basetranslator__"')).select(*columns)

    expected = (
        Query.with_(step_0_query, "__step_0_basetranslator__")
        .with_(step_1_query, "__step_1_basetranslator__")
        .from_("__step_1_basetranslator__")
        .select(*expected_cols)
    )

    qb_context = base_translator.get_query_builder(steps=pipeline_steps)
    assert qb_context.materialize().get_sql() == expected.get_sql()


def test_get_query_str(base_translator: BaseTranslator):
    steps = [DomainStep(domain="users")]

    schema = Schema(DB_SCHEMA)

    step_1_query = Query.from_(schema.users).select(*ALL_TABLES["users"])
    expected = (
        Query.with_(step_1_query, "__step_0_basetranslator__")
        .from_("__step_0_basetranslator__")
        .select(*ALL_TABLES["users"])
        .get_sql()
    )

    query = base_translator.get_query_str(steps=steps)
    assert query == expected


@pytest.mark.parametrize("agg_type", ["avg", "count", "count distinct", "max", "min", "sum"])
def test_get_aggregate_function(base_translator: BaseTranslator, agg_type):
    agg_func = base_translator._get_aggregate_function(agg_type)
    assert issubclass(agg_func, functions.AggregateFunction)


@pytest.mark.parametrize("agg_type", ["first", "last"])
def test__get_window_function(base_translator: BaseTranslator, agg_type):
    agg_func = base_translator._get_window_function(agg_type)
    assert issubclass(agg_func, functions.AggregateFunction)


@pytest.mark.parametrize("agg_type", ["count distinct including empty"])
def test_aggregate_raise_expection(
    base_translator: BaseTranslator, agg_type: str, default_step_kwargs: dict[str, Any]
):

    new_column = "countDistinctAge"
    agg_field = "age"

    step = steps.AggregateStep(
        on=[agg_field],
        aggregations=[
            steps.Aggregation(new_columns=[new_column], agg_function=agg_type, columns=[agg_field])
        ],
    )
    with pytest.raises(NotImplementedError):
        base_translator.aggregate(step=step, columns=["*"], **default_step_kwargs)


@pytest.mark.parametrize("agg_type", ["avg", "count", "count distinct", "max", "min", "sum"])
def test_aggregate(
    base_translator: BaseTranslator, agg_type: str, default_step_kwargs: dict[str, Any]
):
    new_column = "avgAge"
    previous_step = "previous_with"
    agg_field = "age"

    step = steps.AggregateStep(
        on=[agg_field],
        aggregations=[
            steps.Aggregation(new_columns=[new_column], agg_function=agg_type, columns=[agg_field])
        ],
    )
    ctx = base_translator.aggregate(step=step, columns=["*"], **default_step_kwargs)

    agg_func = base_translator._get_aggregate_function(agg_type)
    field = Field(agg_field)
    expected_query = (
        Query.from_(previous_step)
        .groupby(field)
        .orderby(agg_field)
        .select(field, agg_func(field).as_(new_column))
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


@pytest.mark.parametrize("agg_type", ["avg", "count", "count distinct", "max", "min", "sum"])
def test_aggregate_with_original_granularity(
    base_translator: BaseTranslator, agg_type: str, default_step_kwargs: dict[str, Any]
):
    original_select = ["*"]
    new_column = "avgAge"
    previous_step = "previous_with"
    agg_field = "age"

    step = steps.AggregateStep(
        on=[agg_field],
        aggregations=[
            steps.Aggregation(new_columns=[new_column], agg_function=agg_type, columns=[agg_field])
        ],
        keepOriginalGranularity=True,
    )
    ctx = base_translator.aggregate(step=step, columns=original_select, **default_step_kwargs)

    agg_func = base_translator._get_aggregate_function(agg_type)
    field = Field(agg_field)
    agg_query = (
        Query.from_(previous_step).groupby(field).select(field, agg_func(field).as_(new_column))
    )

    expected_query = (
        Query.from_(previous_step)
        .select(*original_select)
        .left_join(agg_query)
        .on_field(agg_field)
        .select(*original_select)
        .orderby(agg_field)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_comparetext(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    new_column_name = "new_name"
    compare_a = "name"
    compare_b = "pseudonyme"
    previous_step = "previous_with"
    selected_columns = ["*"]
    step = steps.CompareTextStep(
        newColumnName=new_column_name, strCol1=compare_a, strCol2=compare_b
    )
    ctx = base_translator.comparetext(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        Case().when(Field(compare_a) == Field(compare_b), True).else_(False).as_(new_column_name),
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_concatenate(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    previous_step = "previous_with"
    selected_columns = ["*"]
    new_column_name = "new_name"
    concat_columns = ["name", "pseudonyme"]
    separator = ","

    step = steps.ConcatenateStep(
        columns=concat_columns, separator=separator, new_column_name=new_column_name
    )
    ctx = base_translator.concatenate(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        functions.Concat(Field("name"), separator, Field("pseudonyme")).as_(new_column_name),
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_customsql(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["*"]
    custom_query = "Select * from users"

    step = steps.CustomSqlStep(query=custom_query)
    ctx = base_translator.customsql(step=step, columns=selected_columns, **default_step_kwargs)

    assert ctx.selectable.get_sql() == custom_query


def test_delete(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    previous_step = "previous_with"
    selected_columns = ALL_TABLES["users"]
    deleted_columns = ["name", "age"]
    left_columns = [c for c in ALL_TABLES["users"] if c not in deleted_columns]

    step = steps.DeleteStep(columns=deleted_columns)
    ctx = base_translator.delete(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *left_columns,
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_domain(base_translator: BaseTranslator):
    domain = "users"
    step = steps.DomainStep(domain=domain)
    ctx = base_translator._domain(step=step)

    schema = Schema(DB_SCHEMA)
    users = Table(domain, schema)
    expected_query = Query.from_(users).select(*ALL_TABLES["users"])

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_domain_with_source_rows_subset(base_translator: BaseTranslator, mocker):
    mocker.patch.object(base_translator, "_source_rows_subset", new=42)

    domain = "users"
    step = steps.DomainStep(domain=domain)
    ctx = base_translator._domain(step=step)

    schema = Schema(DB_SCHEMA)
    users = Table(domain, schema)
    expected_query = Query.from_(users).select(*ALL_TABLES["users"]).limit(42)

    assert ctx.selectable.get_sql() == expected_query.get_sql()


# this seems wrong for me...
def test_domain_with_wrong_domain_name(base_translator: BaseTranslator):
    domain = "people"
    step = steps.DomainStep(domain=domain)
    ctx = base_translator._domain(step=step)

    schema = Schema(DB_SCHEMA)
    people = Table(domain, schema)
    expected_query = Query.from_(people).select("*")

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_domain_with_reference(base_translator: BaseTranslator):
    uid = "to be or not to be a query ?"
    type = "ref"
    step = steps.DomainStep(domain=Reference(type=type, uid=uid))
    with pytest.raises(NotImplementedError):
        base_translator._domain(step=step)


def test_duplicate(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    to_duplicate_columns = "name"
    new_column_name = "fancy name"

    step = steps.DuplicateStep(column=to_duplicate_columns, new_column_name=new_column_name)
    ctx = base_translator.duplicate(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, Field(to_duplicate_columns).as_(new_column_name)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_fillna(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["*"]
    previous_step = "previous_with"
    columns = ["name"]
    anonymous = "Jhon"

    step = steps.FillnaStep(columns=columns, value=anonymous)
    ctx = base_translator.fillna(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.Coalesce(Field(*columns), anonymous).as_("name")
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_formula(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    new_column_name = "fancy division"
    formula = "2 / 4 + [column name] * other_col"

    step = steps.FormulaStep(new_column=new_column_name, formula=formula)
    ctx = base_translator.formula(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        (
            Term.wrap_constant(2) / functions.NullIf(Term.wrap_constant(4), 0)
            + Field("column name") * Field("other_col")
        ).as_(new_column_name),
    )
    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_ifthenelse_columns(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    new_column_name = "fancy division"
    column = "name"
    value = "goerge"
    statement = conditions.ComparisonCondition(column=column, operator="eq", value=value)
    then = "a"
    reject = "b"

    step = steps.IfthenelseStep(
        condition=statement, then=then, else_value=reject, newColumn=new_column_name
    )
    ctx = base_translator.ifthenelse(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        Case().when(Field(column) == value, Field(then)).else_(Field(reject)).as_(new_column_name),
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_ifthenelse_strings(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    new_column_name = "fancy division"
    column = "name"
    value = "goerge"
    statement = conditions.ComparisonCondition(column=column, operator="eq", value=value)
    then = "'a'"
    reject = '"b"'

    step = steps.IfthenelseStep(
        condition=statement, then=then, else_value=reject, newColumn=new_column_name
    )
    ctx = base_translator.ifthenelse(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns,
        Case().when(Field(column) == value, "a").else_("b").as_(new_column_name),
    )
    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_lowercase(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"

    step = steps.LowercaseStep(column=column)
    ctx = base_translator.lowercase(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Lower(Field(column)).as_("name")
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_uppercase(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"

    step = steps.UppercaseStep(column=column)
    ctx = base_translator.uppercase(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Upper(Field(column)).as_("name")
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_percentage(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    with pytest.raises(NotImplementedError):
        base_translator.percentage(
            step=steps.PercentageStep(column="", group=[], newColumnName=""),
            columns=[],
            **default_step_kwargs,
        )


def test_replace(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    find = "a"
    replace_with = "b"
    replace = [(find, replace_with)]

    step = steps.ReplaceStep(search_column=column, to_replace=replace)
    ctx = base_translator.replace(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Replace(Field(column), find, replace_with).as_("name")
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_select(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    columns = ["name"]

    step = steps.SelectStep(columns=columns)
    ctx = base_translator.select(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(Field("name"))

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_sort(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    columns = [{"column": "name", "order": "asc"}]

    step = steps.SortStep(columns=columns)
    ctx = base_translator.sort(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = (
        Query.from_(previous_step).select(*selected_columns).orderby(Field("name"), order=Order.asc)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_substring(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    new_column_name = "name"

    step = steps.SubstringStep(
        column=column, newColumnName=new_column_name, start_index=0, end_index=10
    )
    ctx = base_translator.substring(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.Substring(Field(column), 0, 11).as_("name")
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_text(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    new_column_name = "name"
    text = "Hello World"

    step = steps.TextStep(text=text, new_column=new_column_name)
    ctx = base_translator.text(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, ValueWrapper(text).as_(new_column_name)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_trim(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    columns = [column]

    step = steps.TrimStep(columns=columns)
    ctx = base_translator.trim(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        Field("pseudonyme"), functions.Trim(Field(column)).as_(column)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_uniquegroups(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "name"
    columns = [column]

    step = steps.UniqueGroupsStep(on=columns)
    ctx = base_translator.uniquegroups(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = (
        Query.from_(previous_step)
        .select(Field(column))
        .groupby(Field(column))
        .orderby(Field(column))
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_absolutevalue(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    selected_columns = ["name", "pseudonyme"]
    previous_step = "previous_with"
    column = "age"
    new_column = "abs_age"

    step = steps.AbsoluteValueStep(column=column, new_column=new_column)
    ctx = base_translator.absolutevalue(step=step, columns=selected_columns, **default_step_kwargs)

    expected_query = Query.from_(previous_step).select(
        *selected_columns, functions.Abs(Field(column)).as_(new_column)
    )

    assert ctx.selectable.get_sql() == expected_query.get_sql()


# Join tests
@pytest.mark.parametrize(
    "join_type, join_type_variant",
    [("left", JoinType.left), ("left outer", JoinType.left_outer), ("inner", JoinType.inner)],
)
def test_join_simple(
    base_translator: BaseTranslator,
    join_type: str,
    join_type_variant: JoinType,
    default_step_kwargs: dict[str, Any],
):
    right_domain = "projects"
    selected_columns = ["name", "project_id"]
    join_columns = [("project_id", "id")]
    previous_step = "previous_with"

    step = steps.JoinStep(
        right_pipeline=[steps.DomainStep(domain=right_domain)], type=join_type, on=join_columns
    )
    ctx = base_translator.join(step=step, columns=selected_columns, **default_step_kwargs)

    left_table = Table(previous_step)
    right_table = Table("__step_0_basetranslator__")
    expected_query = (
        Query.from_(previous_step)
        .select(
            *(left_table[col] for col in selected_columns),
            right_table.id,
            Field("name", table=right_table, alias="name_right"),
            right_table.created_at,
        )
        .join(right_table, join_type_variant)
        .on(left_table.project_id == right_table.id)
        .orderby(left_table.project_id)
    )
    assert ctx.selectable.get_sql() == expected_query.get_sql()


def test_append_simple(base_translator: BaseTranslator, default_step_kwargs: dict[str, Any]):
    right_domain = "projects"
    selected_columns = ["name", "created_at"]
    right_selected_columns = ["name", "user_id"]
    previous_step = "previous_with"

    step = steps.AppendStep(
        pipelines=[
            [
                steps.DomainStep(domain=right_domain),
                steps.SelectStep(columns=right_selected_columns),
            ]
        ]
    )
    ctx = base_translator.append(step=step, columns=selected_columns, **default_step_kwargs)

    right_table = Table("__step_1_basetranslator__")
    expected_query = (
        Query.from_(previous_step)
        .select(*selected_columns, LiteralValue("NULL").as_("user_id"))
        .union_all(
            Query.from_(right_table).select(
                "name", LiteralValue("NULL").as_("created_at"), "user_id"
            )
        )
        .orderby("name", "created_at", "user_id")
    )
    assert ctx.selectable.get_sql() == expected_query.get_sql()
