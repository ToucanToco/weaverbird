from typing import TYPE_CHECKING, Any, TypeVar

from pypika import Field, Query, Table, functions
from pypika.enums import Dialects
from pypika.queries import QueryBuilder
from pypika.terms import Case, CustomFunction, Function, Interval, LiteralValue, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    SQLTranslator,
    StepContext,
)
from weaverbird.pipeline.steps.date_extract import DATE_INFO

Self = TypeVar("Self", bound="GoogleBigQueryTranslator")

if TYPE_CHECKING:
    from weaverbird.pipeline.steps import SplitStep


class GBQDateTrunc(Function):
    """The date format and field parameters are inverted in GBQ"""

    def __init__(self, date_format: str, field: Field, alias: str | None = None):
        super().__init__("DATE_TRUNC", field, LiteralValue(date_format.upper()), alias=alias)


class GBQSplit(Function):
    def __init__(self, field: Field, delimiter: str | None = None) -> None:
        # Empty string is the same as None here
        args = ("SPLIT", field, Term.wrap_constant(delimiter)) if delimiter else ("SPLIT", field)
        super().__init__(*args)


class GoogleBigQueryQuery(Query):
    @classmethod
    def _builder(cls, **kwargs: Any) -> "GoogleBigQueryQueryBuilder":
        return GoogleBigQueryQueryBuilder(**kwargs)


class GoogleBigQueryQueryBuilder(QueryBuilder):
    QUOTE_CHAR = "`"
    SECONDARY_QUOTE_CHAR = "'"
    ALIAS_QUOTE_CHAR = None
    QUERY_ALIAS_QUOTE_CHAR = None
    QUERY_CLS = GoogleBigQueryQuery

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(dialect=SQLDialect.GOOGLEBIGQUERY, **kwargs)


class GoogleBigQueryDateAdd(Function):
    def __init__(self, *, target_column: Field, interval: Interval) -> None:
        super().__init__("DATE_ADD", target_column, interval)


class GoogleBigQueryTranslator(SQLTranslator):
    DIALECT = SQLDialect.GOOGLEBIGQUERY
    QUERY_CLS = GoogleBigQueryQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="FLOAT64",
        integer="INTEGER",
        text="STRING",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = False
    SUPPORT_UNPIVOT = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP_CONTAINS
    TO_DATE_OP = ToDateOp.TIMESTAMP

    @classmethod
    def _add_date(
        cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None
    ) -> Term:
        return GoogleBigQueryDateAdd(
            target_column=target_column,
            # Cheating a bit here: MySQL's syntax is compatible with GBQ for intervals
            interval=Interval(**{unit: duration, "dialect": Dialects.MYSQL}),
        )

    @classmethod
    def _day_of_week(cls, target_column: Field) -> Term:
        # GBQ takes 'dayofweek' rather than 'dow' and returns 1 for sunday rather than 0
        return functions.Extract("dayofweek", target_column) - 1

    def split(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "SplitStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]

        safe_offset = CustomFunction("SAFE_OFFSET", ["index"])

        # Sub-optimal, could do that in two sub_queries, one for splitting to a temp array col, and
        # another one to select eveything needed from the array col rather than splitting N times
        def gen_splitted_cols():
            for i in range(step.number_cols_to_keep):
                split_str = GBQSplit(col_field, step.delimiter).get_sql(
                    quote_char=GoogleBigQueryQueryBuilder.QUOTE_CHAR
                )
                safe_offset_str = safe_offset(i).get_sql(
                    quote_char=GoogleBigQueryQueryBuilder.QUOTE_CHAR
                )
                # LiteralValue is ugly, but it does not seem like pypika supports "[]" array
                # accessing, and GBQ does not seem to provide functions to access array value.
                #
                # The IfNull is required because other backends use SPLIT_PART, which will return an
                # empty string rather than NULL
                yield functions.IfNull(LiteralValue(f"{split_str}[{safe_offset_str}]"), "").as_(
                    f"{step.column}_{i + 1}"
                )

        splitted_cols = list(gen_splitted_cols())
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, *splitted_cols
        )
        return StepContext(query, columns + splitted_cols)

    @classmethod
    def _date_trunc(cls, date_part: str, target_column: Field) -> Term:
        return GBQDateTrunc(date_part, target_column)

    @classmethod
    def _get_date_extract_func(cls, *, date_unit: DATE_INFO, target_column: Field) -> Term:
        if date_unit == "dayOfYear":
            # GBQ takes 'dayofyear' rather than 'doy'
            return functions.Extract("dayofyear", target_column)
        if date_unit == "week":
            return functions.Extract("isoweek", target_column)
        if date_unit == "previousWeek":
            return functions.Extract(
                "isoweek", cls._add_date(target_column=target_column, unit="weeks", duration=-1)
            )

        if date_unit == "isoWeek":
            return (
                Case()
                .when(functions.Extract("WEEK(MONDAY)", target_column) == 0, 52)
                .else_(functions.Extract("WEEK(MONDAY)", target_column))
            )
        if date_unit == "previousIsoWeek":
            return (
                Case()
                .when(
                    functions.Extract(
                        "WEEK(MONDAY)",
                        cls._add_date(target_column=target_column, unit="weeks", duration=-1),
                    )
                    == 0,
                    52,
                )
                .else_(
                    functions.Extract(
                        "WEEK(MONDAY)",
                        cls._add_date(target_column=target_column, unit="weeks", duration=-1),
                    )
                )
            )

        if date_unit == "isoYear":
            return (
                Case()
                .when(
                    functions.Extract("WEEK(MONDAY)", target_column) != 0,
                    functions.Extract("year", target_column),
                )
                .else_(functions.Extract("year", target_column) - 1)
            )
        if date_unit == "firstDayOfWeek":
            return cls._date_trunc("WEEK", target_column)
        if date_unit == "firstDayOfPreviousWeek":
            return cls._add_date(
                target_column=cls._date_trunc("WEEK", target_column), duration=-1, unit="weeks"
            )
        if date_unit == "firstDayOfIsoWeek":
            return cls._date_trunc("ISOWEEK", target_column)
        if date_unit == "firstDayOfPreviousIsoWeek":
            return cls._add_date(
                target_column=cls._date_trunc("ISOWEEK", target_column), duration=-1, unit="weeks"
            )
        return super()._get_date_extract_func(date_unit=date_unit, target_column=target_column)


SQLTranslator.register(GoogleBigQueryTranslator)


class ParseDatetime(functions.Function):
    def __init__(self, format: str, term: str | Field, alias: str | None = None) -> None:
        super().__init__("parse_datetime", format, term, alias=alias)
