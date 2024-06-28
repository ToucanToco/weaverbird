from typing import TYPE_CHECKING, Any, Literal, TypeAlias, TypeVar

from pypika import Field, Query, functions
from pypika.enums import Dialects
from pypika.queries import QueryBuilder, Selectable
from pypika.terms import (
    Case,
    CustomFunction,
    Function,
    Interval,
    LiteralValue,
    Term,
    ValueWrapper,
)

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    DateFormatMapping,
    FromTable,
    SQLTranslator,
    StepContext,
)
from weaverbird.pipeline.steps.date_extract import DATE_INFO
from weaverbird.pipeline.steps.duration import DURATIONS_IN_SECOND

Self = TypeVar("Self", bound="GoogleBigQueryTranslator")

if TYPE_CHECKING:
    from weaverbird.pipeline.steps import DurationStep, SplitStep, ToDateStep


class GBQDateTrunc(Function):
    """The date format and field parameters are inverted in GBQ"""

    def __init__(self, date_format: str, field: Field, alias: str | None = None):
        super().__init__("DATE_TRUNC", field, LiteralValue(date_format.upper()), alias=alias)


class GBQParseDateTime(Function):
    def __init__(self, term: str | Field, date_format: str) -> None:
        # Inverting date_format and term, because GBQ takes format first
        super().__init__("PARSE_DATETIME", date_format, term)


class GBQSplit(Function):
    def __init__(self, field: Field, delimiter: str | None = None) -> None:
        # Empty string is the same as None here
        args = ("SPLIT", field, Term.wrap_constant(delimiter)) if delimiter else ("SPLIT", field)
        super().__init__(*args)


GQBTimestampDiffUnit: TypeAlias = Literal["MICROSECOND", "MILLISECOND", "SECOND", "MINUTE", "HOUR", "DAY"]


class GBQTimestampDiff(Function):
    def __init__(self, end: Field, start: Field, unit: GQBTimestampDiffUnit) -> None:
        super().__init__("TIMESTAMP_DIFF", end, start, LiteralValue(unit))


class GoogleBigQueryQuery(Query):
    @classmethod
    def _builder(cls, **kwargs: Any) -> "GoogleBigQueryQueryBuilder":
        return GoogleBigQueryQueryBuilder(**kwargs)


class GoogleBigQueryValueWrapper(ValueWrapper):
    @classmethod
    def get_formatted_value(cls, value: Any, **kwargs):
        if isinstance(value, str):
            value = value.replace("'", r"\'")
            return f"'{value}'"
        return super().get_formatted_value(value, **kwargs)


class GoogleBigQueryQueryBuilder(QueryBuilder):
    QUOTE_CHAR = "`"
    SECONDARY_QUOTE_CHAR = "'"
    ALIAS_QUOTE_CHAR = None
    QUERY_ALIAS_QUOTE_CHAR = None
    QUERY_CLS = GoogleBigQueryQuery

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(dialect=SQLDialect.GOOGLEBIGQUERY, wrapper_cls=GoogleBigQueryValueWrapper, **kwargs)


class GoogleBigQueryDateAdd(Function):
    def __init__(self, *, target_column: Field, interval: Interval) -> None:
        super().__init__("DATE_ADD", functions.Cast(target_column, "DATETIME"), interval)


class GoogleBigQueryTranslator(SQLTranslator):
    DIALECT = SQLDialect.GOOGLEBIGQUERY
    QUERY_CLS = GoogleBigQueryQuery
    VALUE_WRAPPER_CLS = GoogleBigQueryValueWrapper
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="FLOAT64",
        integer="INTEGER",
        text="STRING",
        datetime="DATETIME",
        timestamp="TIMESTAMP",
    )
    DATE_FORMAT_MAPPING = DateFormatMapping(
        # https://cloud.google.com/bigquery/docs/reference/standard-sql/format-elements#format_elements_date_time
        day_number="%d",
        month_number="%m",
        month_short="%b",
        month_full="%B",
        year="%Y",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = False
    SUPPORT_UNPIVOT = True
    FROM_DATE_OP = FromDateOp.FORMAT_DATE
    REGEXP_OP = RegexOp.REGEXP_CONTAINS

    @classmethod
    def _add_date(cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None) -> Term:
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
        prev_step_table: FromTable,
        columns: list[str],
        step: "SplitStep",
    ) -> StepContext:
        col_field = prev_step_table[step.column]

        safe_offset = CustomFunction("SAFE_OFFSET", ["index"])

        # Sub-optimal, could do that in two sub_queries, one for splitting to a temp array col, and
        # another one to select eveything needed from the array col rather than splitting N times
        def gen_splitted_cols():
            for i in range(step.number_cols_to_keep):
                split_str = GBQSplit(col_field, step.delimiter).get_sql(
                    quote_char=GoogleBigQueryQueryBuilder.QUOTE_CHAR
                )
                safe_offset_str = safe_offset(i).get_sql(quote_char=GoogleBigQueryQueryBuilder.QUOTE_CHAR)
                # LiteralValue is ugly, but it does not seem like pypika supports "[]" array
                # accessing, and GBQ does not seem to provide functions to access array value.
                #
                # The IfNull is required because other backends use SPLIT_PART, which will return an
                # empty string rather than NULL
                yield functions.IfNull(LiteralValue(f"{split_str}[{safe_offset_str}]"), "").as_(
                    f"{step.column}_{i + 1}"
                )

        splitted_cols = list(gen_splitted_cols())
        query: QueryBuilder = prev_step_table.select(*columns, *splitted_cols)
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
            return functions.Extract("isoweek", cls._add_date(target_column=target_column, unit="weeks", duration=-1))

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
            return cls._add_date(target_column=cls._date_trunc("WEEK", target_column), duration=-1, unit="weeks")
        if date_unit == "firstDayOfIsoWeek":
            return cls._date_trunc("ISOWEEK", target_column)
        if date_unit == "firstDayOfPreviousIsoWeek":
            return cls._add_date(target_column=cls._date_trunc("ISOWEEK", target_column), duration=-1, unit="weeks")
        if date_unit == "firstDayOfPreviousMonth":
            return cls._add_date(target_column=cls._date_trunc("MONTH", target_column), duration=-1, unit="months")

        return super()._get_date_extract_func(date_unit=date_unit, target_column=target_column)

    def todate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "ToDateStep",
    ) -> StepContext:
        col_field = prev_step_table[step.column]
        if step.format is not None:
            date_selection = GBQParseDateTime(col_field, step.format)
        else:
            date_selection = functions.Cast(col_field, "DATETIME")

        query: QueryBuilder = prev_step_table.select(
            *(c for c in columns if c != step.column),
            date_selection.as_(step.column),
        )
        return StepContext(query, columns)

    @classmethod
    def _interval_to_seconds(cls, value: Selectable) -> functions.Function:
        # It is very tedious and inefficient to convert an INTERVAL to seconds in postgres
        raise NotImplementedError

    def duration(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "DurationStep",
    ) -> StepContext:
        as_seconds = GBQTimestampDiff(
            self._cast_to_timestamp(prev_step_table[step.end_date_column]),
            self._cast_to_timestamp(prev_step_table[step.start_date_column]),
            # NOTE: for consistency with other backends, we're calculating the true duration
            # here. By  passing a lower unit, we'd lose information
            "SECOND",
        )
        new_column = (as_seconds / DURATIONS_IN_SECOND[step.duration_in]).as_(step.new_column_name)
        query: QueryBuilder = prev_step_table.select(*columns, new_column)
        return StepContext(query, columns + [step.new_column_name])


SQLTranslator.register(GoogleBigQueryTranslator)


class ParseDatetime(functions.Function):
    def __init__(self, format: str, term: str | Field, alias: str | None = None) -> None:
        super().__init__("parse_datetime", format, term, alias=alias)
