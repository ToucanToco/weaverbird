from typing import Any

import pytest
from pypika.functions import Cast, Extract
from pypika.queries import Query, Table
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.backends.pypika_translator.translators.base import DateAddWithoutUnderscore
from weaverbird.backends.pypika_translator.translators.snowflake import SnowflakeTranslator
from weaverbird.pipeline import steps
from weaverbird.pipeline.pipeline import Pipeline
from weaverbird.pipeline.steps import DateExtractStep, UnpivotStep


@pytest.fixture
def snowflake_translator() -> SnowflakeTranslator:
    return SnowflakeTranslator(tables_columns={})


def test_evolution_abs_day(snowflake_translator: SnowflakeTranslator, default_step_kwargs: dict[str, Any]) -> None:
    selected_columns = ["name", "brewing_date"]
    previous_step = "previous_with"
    new_column = "evol"

    step = steps.EvolutionStep(
        new_column=new_column,
        date_col="brewing_date",
        value_col="alcohol_degree",
        evolution_format="abs",
        evolution_type="vsLastDay",
    )

    right_table = Table("right_table")
    prev_table = Table(previous_step)
    ctx = snowflake_translator.evolution(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .select(
            *[prev_table.field(col) for col in selected_columns],
            (prev_table.field(step.value_col) - right_table.field(step.value_col)).as_(step.new_column),
        )
        .left_join(
            Query.from_(previous_step)
            .select(
                step.value_col,
                DateAddWithoutUnderscore("day", 1, prev_table.field(step.date_col)).as_(step.date_col),
            )
            .as_("right_table")
        )
        .on_field(step.date_col, *step.index_columns)
        .orderby(step.date_col)
    )
    assert ctx.selectable.get_sql(quote_char='"') == expected_query.get_sql(quote_char='"')


def test_evolution_perc_groups_day(
    snowflake_translator: SnowflakeTranslator, default_step_kwargs: dict[str, Any]
) -> None:
    selected_columns = ["name", "brewing_date"]
    previous_step = "previous_with"
    new_column = "evol"

    step = steps.EvolutionStep(
        new_column=new_column,
        date_col="brewing_date",
        value_col="alcohol_degree",
        evolution_format="abs",
        evolution_type="vsLastDay",
        index_columns=["volume_ml"],
    )
    right_table = Table("right_table")
    prev_table = Table(previous_step)
    ctx = snowflake_translator.evolution(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .select(
            *[prev_table.field(col) for col in selected_columns],
            (prev_table.field(step.value_col) - right_table.field(step.value_col)).as_(step.new_column),
            *[prev_table.field(col).as_(f"left_table_{col}") for col in step.index_columns],
        )
        .left_join(
            Query.from_(previous_step)
            .select(
                step.value_col,
                DateAddWithoutUnderscore(date_part="day", interval=1, term=prev_table.field(step.date_col)).as_(
                    step.date_col
                ),
                *step.index_columns,
            )
            .as_("right_table")
        )
        .on_field(step.date_col, *step.index_columns)
        .orderby(step.date_col)
    )
    assert ctx.selectable.get_sql(quote_char='"') == expected_query.get_sql(quote_char='"')


def test_date_extract_extract_kw(
    snowflake_translator: SnowflakeTranslator, default_step_kwargs: dict[str, Any]
) -> None:
    selected_columns = ["name", "brewing_date"]
    previous_step = "previous_with"
    prev_table = Table(previous_step)

    step = DateExtractStep(
        new_columns=["brewing_year", "brewing_month", "brewing_day"],
        date_info=["year", "month", "day"],
        column="brewing_date",
    )
    ctx = snowflake_translator.dateextract(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = Query.from_(previous_step).select(
        *[prev_table.field(col) for col in selected_columns],
        Cast(
            Extract(
                "year",
                Cast(prev_table.brewing_date, snowflake_translator.DATA_TYPE_MAPPING.timestamp),
            ),
            snowflake_translator.DATA_TYPE_MAPPING.integer,
        ).as_("brewing_year"),
        Cast(
            Extract(
                "month",
                Cast(prev_table.brewing_date, snowflake_translator.DATA_TYPE_MAPPING.timestamp),
            ),
            snowflake_translator.DATA_TYPE_MAPPING.integer,
        ).as_("brewing_month"),
        Cast(
            Extract(
                "day",
                Cast(prev_table.brewing_date, snowflake_translator.DATA_TYPE_MAPPING.timestamp),
            ),
            snowflake_translator.DATA_TYPE_MAPPING.integer,
        ).as_("brewing_day"),
    )
    assert ctx.selectable.get_sql(quote_char='"') == expected_query.get_sql(quote_char='"')


def test_date_extract_func(snowflake_translator: SnowflakeTranslator, default_step_kwargs: dict[str, Any]) -> None:
    selected_columns = ["name", "brewing_date"]
    previous_step = "previous_with"
    prev_table = Table(previous_step)

    step = DateExtractStep(
        new_columns=["brewing_week"],
        date_info=["isoWeek"],
        column="brewing_date",
    )
    ctx = snowflake_translator.dateextract(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = Query.from_(previous_step).select(
        *[prev_table.field(col) for col in selected_columns],
        Cast(
            Extract("week", prev_table.brewing_date),
            snowflake_translator.DATA_TYPE_MAPPING.integer,
        ).as_("brewing_week"),
    )
    assert ctx.selectable.get_sql(quote_char='"') == expected_query.get_sql(quote_char='"')


def test__build_unpivot_col(snowflake_translator: SnowflakeTranslator) -> None:
    unpivot = snowflake_translator._build_unpivot_col(
        step=UnpivotStep(
            keep=["foo", "bar"],
            unpivot=["too", "roo"],
            unpivot_column_name="yaaaa",
            value_column_name="booo",
            dropna=False,
        ),
        quote_char=None,
        secondary_quote_char="'",
    )
    assert unpivot == "UNPIVOT(booo FOR yaaaa IN (too, roo))"


def test_quoted_with_statement() -> None:
    steps = [{"name": "domain", "domain": "beers_tiny"}]
    query = translate_pipeline(
        sql_dialect=SQLDialect.SNOWFLAKE,
        pipeline=Pipeline(steps=steps),
        tables_columns={"beers_tiny": ["price_per_l", "test", "another-test"]},
    )
    assert query == 'SELECT "price_per_l","test","another-test" FROM "beers_tiny"'


def test_quoted_columns_with_special_chars() -> None:
    steps = [
        {"name": "domain", "domain": "beers_tiny"},
        {"name": "rename", "toRename": [("price_per_l", "price-per-l")]},
    ]
    query = translate_pipeline(
        sql_dialect=SQLDialect.SNOWFLAKE,
        pipeline=Pipeline(steps=steps),
        tables_columns={"beers_tiny": ["price_per_l", "test", "another-test"]},
    )
    assert query == (
        'WITH "__step_0_snowflaketranslator__" AS (SELECT "price_per_l","test","another-test" FROM "beers_tiny") '
        'SELECT "price_per_l" "price-per-l","test","another-test" FROM "__step_0_snowflaketranslator__"'
    )
