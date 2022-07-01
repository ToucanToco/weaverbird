from pypika.dialects import SnowflakeQuery

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import DataTypeMapping, SQLTranslator


class SnowflakeTranslator(SQLTranslator):
    DIALECT = SQLDialect.SNOWFLAKE
    QUERY_CLS = SnowflakeQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.TO_DATE

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
