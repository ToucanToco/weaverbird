from typing import TYPE_CHECKING, TypeVar

from pypika import CustomFunction, Table
from pypika.dialects import SnowflakeQuery
from pypika.queries import QueryBuilder

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    SQLTranslator,
    StepContext,
)

Self = TypeVar("Self", bound="SQLTranslator")

if TYPE_CHECKING:
    from weaverbird.pipeline.steps import EvolutionStep


class SnowflakeTranslator(SQLTranslator):
    DIALECT = SQLDialect.SNOWFLAKE
    QUERY_CLS = SnowflakeQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
        datetime="TIMESTAMP",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.TO_DATE
    QUOTE_CHAR = '\"'

    def evolution(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "EvolutionStep",
    ) -> StepContext:
        DATE_UNIT = {
            'vsLastYear': 'year',
            'vsLastMonth': 'month',
            'vsLastWeek': 'week',
            'vsLastDay': 'day',
        }
        DateAdd = CustomFunction('DATEADD', ['interval', 'increment', 'datecol'])

        prev_table = Table(prev_step_name)
        right_table = Table('right_table')
        new_col = step.new_column if step.new_column else 'evol'

        query: "QueryBuilder" = (
            self.QUERY_CLS.from_(prev_step_name)
            .select(
                *[prev_table.field(col) for col in columns],
                (
                    prev_table.field(step.value_col) - right_table.field(step.value_col)
                    if step.evolution_format == 'abs'
                    else prev_table.field(step.value_col) / right_table.field(step.value_col) - 1
                ).as_(new_col),
            )
            .left_join(
                self.QUERY_CLS.from_(prev_step_name)
                .select(
                    step.value_col,
                    DateAdd(DATE_UNIT[step.evolution_type], 1, prev_table.field(step.date_col)).as_(
                        step.date_col
                    ),
                )
                .as_('right_table')
            )
            .on_field(step.date_col, *step.index_columns)
            .orderby(step.date_col)
        )
        return StepContext(query, columns + [new_col])

    # This step is not handling all edge cases so it's commented for now
    # def cumsum(
    #     self: Self, *, step: "CumSumStep", table: StepTable
    # ) -> tuple["QueryBuilder", StepTable]:
    #     # !FIXME / TODO
    #     # Since "OVER (PARTITION BY..." and "rows UNBOUNDED PRECEDING" are
    #     # synthax used on snowflake for this step not available on redshift nor postgresql
    #     # a tweak should be made here to adapt that on pypika, something like
    #     # (https://pypika.readthedocs.io/en/latest/3_advanced.html?highlight=rank#ntile-and-rank),
    #     # this step is not
    #     # completed, an equivalent of this step can looks like :

    #     sub_query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(*table.columns)
    #     cumsum_col_list = [cumsum[1] or f"{cumsum[0]}_CUMSUM" for cumsum in step.to_cumsum]

    #     the_table = Table(table.name)
    #     reference_column_field: Field = the_table[step.reference_column]

    #     sub_query = (
    #         sub_query.select(
    #             *(
    #                 functions.Sum(the_table[cumsum[0]]).as_(cumsum[1] or f"{cumsum[0]}_CUMSUM")
    #                 for cumsum in step.to_cumsum
    #             ),
    #         )
    #         .orderby(reference_column_field, order=Order.asc)
    #         .groupby(*(step.groupby or [*table.columns]))
    #     )  # commented .over() .over(*groups_fields)

    #     query: "QueryBuilder" = (
    #         self.QUERY_CLS.from_(sub_query).select(*(*table.columns, *cumsum_col_list))
    #     ).from_(table.name)

    #     return query, StepTable(columns=[*table.columns, *cumsum_col_list])


SQLTranslator.register(SnowflakeTranslator)
