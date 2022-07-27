from typing import Any

import pytest
from pypika import CustomFunction
from pypika.queries import Query, Table

from weaverbird.backends.pypika_translator.translators.snowflake import SnowflakeTranslator
from weaverbird.pipeline import steps


@pytest.fixture
def snowflake_translator() -> SnowflakeTranslator:
    return SnowflakeTranslator(tables_columns={})


def test_evolution_abs_day(
    snowflake_translator: SnowflakeTranslator, default_step_kwargs: dict[str, Any]
) -> None:
    selected_columns = ["name", "brewing_date"]
    previous_step = "previous_with"
    new_column = "evol"

    step = steps.EvolutionStep(
        new_column=new_column,
        date_col='brewing_date',
        value_col='alcohol_degree',
        evolution_format='abs',
        evolution_type='vsLastDay',
    )
    DateAdd = CustomFunction('DATEADD', ['interval', 'increment', 'datecol'])
    right_table = Table('right_table')
    prev_table = Table(previous_step)
    ctx = snowflake_translator.evolution(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .select(
            *[prev_table.field(col) for col in selected_columns],
            (prev_table.field(step.value_col) - right_table.field(step.value_col)).as_(
                step.new_column
            ),
        )
        .left_join(
            Query.from_(previous_step)
            .select(
                step.value_col,
                DateAdd('day', 1, prev_table.field(step.date_col)).as_(step.date_col),
            )
            .as_('right_table')
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
        date_col='brewing_date',
        value_col='alcohol_degree',
        evolution_format='abs',
        evolution_type='vsLastDay',
        index_columns=['volume_ml'],
    )
    DateAdd = CustomFunction('DATEADD', ['interval', 'increment', 'datecol'])
    right_table = Table('right_table')
    prev_table = Table(previous_step)
    ctx = snowflake_translator.evolution(step=step, columns=selected_columns, **default_step_kwargs)
    expected_query = (
        Query.from_(previous_step)
        .select(
            *[prev_table.field(col) for col in selected_columns],
            (prev_table.field(step.value_col) - right_table.field(step.value_col)).as_(
                step.new_column
            ),
            *[prev_table.field(col).as_(f'left_table_{col}') for col in step.index_columns],
        )
        .left_join(
            Query.from_(previous_step)
            .select(
                step.value_col,
                DateAdd('day', 1, prev_table.field(step.date_col)).as_(step.date_col),
                *step.index_columns,
            )
            .as_('right_table')
        )
        .on_field(step.date_col, *step.index_columns)
        .orderby(step.date_col)
    )
    assert ctx.selectable.get_sql(quote_char='"') == expected_query.get_sql(quote_char='"')
