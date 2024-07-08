from abc import ABC, abstractmethod
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, Literal, TypeVar, Union, cast, get_args
from uuid import uuid4

from dateutil import parser as dateutil_parser
from pypika import (
    AliasedQuery,
    Case,
    Criterion,
    Field,
    Order,
    Query,
    Schema,
    Table,
    Tables,
    analytics,
    functions,
)
from pypika.enums import Comparator, Dialects, JoinType
from pypika.functions import Extract, ToDate
from pypika.queries import QueryBuilder as QueryBuilder
from pypika.queries import Selectable
from pypika.terms import (
    AnalyticFunction,
    BasicCriterion,
    Function,
    Interval,
    LiteralValue,
    Term,
    ValueWrapper,
)
from pypika.utils import format_quotes

from weaverbird.backends.pandas_executor.steps.utils.dates import evaluate_relative_date
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators import ALL_TRANSLATORS
from weaverbird.backends.pypika_translator.utils.formula import formula_to_term
from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    DateBoundCondition,
    InclusionCondition,
    MatchCondition,
    NullCondition,
)
from weaverbird.pipeline.dates import RelativeDate
from weaverbird.pipeline.pipeline import Pipeline
from weaverbird.pipeline.steps import ConvertStep, DomainStep, FilterStep, TopStep
from weaverbird.pipeline.steps.date_extract import DATE_INFO
from weaverbird.pipeline.steps.duration import DURATIONS_IN_SECOND
from weaverbird.pipeline.steps.utils.combination import PipelineOrDomainNameOrReference, Reference

from .exceptions import ForbiddenSQLStep, UnknownTableColumns

Self = TypeVar("Self", bound="SQLTranslator")

if TYPE_CHECKING:
    from weaverbird.pipeline import PipelineStep
    from weaverbird.pipeline.conditions import Condition, SimpleCondition
    from weaverbird.pipeline.steps import (
        AbsoluteValueStep,
        AggregateStep,
        AppendStep,
        ArgmaxStep,
        ArgminStep,
        CompareTextStep,
        ConcatenateStep,
        CumSumStep,
        CustomSqlStep,
        DateExtractStep,
        DeleteStep,
        DuplicateStep,
        DurationStep,
        EvolutionStep,
        FillnaStep,
        FormulaStep,
        FromdateStep,
        IfthenelseStep,
        JoinStep,
        LowercaseStep,
        PercentageStep,
        RankStep,
        RenameStep,
        ReplaceStep,
        ReplaceTextStep,
        SelectStep,
        SortStep,
        SplitStep,
        SubstringStep,
        TextStep,
        ToDateStep,
        TrimStep,
        UniqueGroupsStep,
        UnpivotStep,
        UppercaseStep,
    )
    from weaverbird.pipeline.steps.aggregate import AggregateFn
    from weaverbird.pipeline.steps.evolution import EVOLUTION_TYPE


@dataclass(kw_only=True)
class DataTypeMapping:
    boolean: str
    date: str
    float: str
    integer: str
    text: str
    datetime: str
    timestamp: str


@dataclass(kw_only=True)
class DateFormatMapping:
    day_number: str  # day number (01-31)
    month_number: str  # month number (01–12)
    month_short: str  # abbreviated month name (e.g. Dec)
    month_full: str  # full month name (e.g. December)
    year: str  # year (4 or more digits)


@dataclass
class StepContext:
    selectable: Selectable
    columns: list[str]
    builder: QueryBuilder | None = None


@dataclass(kw_only=True)
class QueryBuilderContext:
    builder: QueryBuilder
    columns: list[str]
    table_name: str
    last_step_unwrapped: bool

    def materialize(self, *, offset: int | None = None, limit: int | None = None) -> QueryBuilder:
        if self.last_step_unwrapped:
            qb = self.builder
        else:
            # In case we have no columns, select everything by default.
            # NOTE: This is the only place where a wildcard should ever be used: Since we're
            # materializing the query, the columns won't be used by downstream consumers, so no other
            # step will actually use the wildcard as a column name.
            #
            # Note that this will only work for queries consisting of a single CustomSQL step, as all
            # other steps require a valid column list to work properly
            columns = self.columns or ["*"]
            qb = self.builder.from_(self.table_name).select(*columns)
        if offset is not None:
            qb = qb.offset(offset)
        if limit is not None:
            qb = qb.limit(limit)
        return qb


class FromTable:
    """A class representing a table-like object that can be selected from"""

    def __init__(
        self, *, table_name: str, builder: QueryBuilder | None, query_class: type[Query], schema: str | None = None
    ) -> None:
        self._table_name = table_name
        self._schema = schema
        self._pypika_table = Table(self._table_name, schema=schema)
        self._builder = builder
        self._query_class = query_class

    @property
    def name(self) -> str:
        return self._table_name

    def table(self) -> Table:
        return self._pypika_table

    def __getitem__(self, item: Any) -> Field:
        field = self._pypika_table.__getitem__(item)
        assert isinstance(field, Field)
        return field

    def select(self, *columns: str | Field | LiteralValue) -> QueryBuilder:
        if self._builder is not None:
            return self._builder.from_(self._pypika_table).select(*columns)
        return self._query_class.from_(self._pypika_table).select(*columns)

    def update_builder_if_exists(self, new_builder: QueryBuilder) -> None:
        """If this table object has a builder, set it to the new one.

        This is used for combine steps: In case they are nested, and we want to unwrap the last one,
        the step needs to select on the builder it has updated rather than on the alias for the
        previous step's table.

        Since this method only updates the builder if it exists, it only has an impact on
        an unwrapped step, i.e. the last of a pipeline
        """
        if self._builder is not None:
            self._builder = new_builder


class CustomQuery(AliasedQuery):
    def get_sql(self, **kwargs: Any) -> str:
        return cast(str, self.query)


class DateTrunc(Function):
    def __init__(self, date_format: str, field: Field, alias: str | None = None):
        super().__init__("DATE_TRUNC", date_format, field, alias=alias)


class DateAddWithoutUnderscore(functions.Function):
    """PyPika's DateAdd is DATE_ADD, Some of our target engines require DATEADD"""

    def __init__(self, date_part, interval, term, alias=None):
        date_part = getattr(date_part, "value", date_part)
        super().__init__("DATEADD", LiteralValue(date_part), interval, term, alias=alias)


class SQLTranslator(ABC):
    DIALECT: SQLDialect
    QUERY_CLS: Query
    VALUE_WRAPPER_CLS = ValueWrapper
    DATA_TYPE_MAPPING: DataTypeMapping
    DATE_FORMAT_MAPPING: DateFormatMapping
    # supported extra functions
    SUPPORT_ROW_NUMBER: bool
    SUPPORT_SPLIT_PART: bool
    SUPPORT_UNPIVOT: bool = False
    # which operators should be used
    FROM_DATE_OP: FromDateOp
    REGEXP_OP: RegexOp
    TO_DATE_OP: ToDateOp
    EVOLUTION_DATE_UNIT: dict["EVOLUTION_TYPE", str] = {
        "vsLastYear": "years",
        "vsLastMonth": "months",
        "vsLastWeek": "weeks",
        "vsLastDay": "days",
    }

    def __init__(
        self: Self,
        *,
        tables_columns: Mapping[str, Sequence[str]] | None = None,
        db_schema: str | None = None,
        known_instances: dict[int, str] | None = None,
        source_rows_subset: int | None = None,
    ) -> None:
        self._tables_columns: Mapping[str, Sequence[str]] = tables_columns or {}
        self._db_schema_name = db_schema
        self._db_schema: Schema | None = Schema(db_schema) if db_schema is not None else None
        self._known_instances: dict[int, str] = known_instances or {}
        self._step_count = 0
        self._source_rows_subset = source_rows_subset
        self.__id = uuid4().int

    def __init_subclass__(cls) -> None:
        ALL_TRANSLATORS[cls.DIALECT] = cls

    def _id(self: Self) -> str:
        if self.__id in self._known_instances:
            return self._known_instances[self.__id]
        if len(self._known_instances.keys()) == 0:
            id_ = self._known_instances[self.__id] = self.__class__.__name__.lower()
            return id_
        else:
            id_ = self.__class__.__name__.lower() + str(len(self._known_instances.keys()))
            self._known_instances[self.__id] = id_
            return id_

    def _step_name(self: Self, idx: int) -> str:
        return f"__step_{idx}_{self._id()}__"

    def _next_step_name(self: Self) -> str:
        name = self._step_name(self._step_count)
        self._step_count += 1
        return name

    def _extract_columns_from_customsql_step(self: Self, *, step: "CustomSqlStep") -> list[str]:
        if step.columns:
            return step.columns
        # In case there are several provided tables, we cannot figure out which columns to use
        if len(self._tables_columns) != 1:
            raise UnknownTableColumns("Expected columns to be specified for exactly one table")
        return list(list(self._tables_columns.values())[0])

    def _step_context_from_first_step(self, step: "DomainStep | CustomSqlStep") -> StepContext:
        if step.name == "domain":
            return self._domain(step=step)
        else:  # CustomSql step
            columns = self._extract_columns_from_customsql_step(step=step)
            return StepContext(self._custom_query(step=step), columns)

    def _merge_first_steps(self: Self, *, domain_step: "DomainStep", second_step: TopStep | FilterStep) -> StepContext:
        columns = self._extract_columns_from_domain_step(step=domain_step)
        # If we have a reference, self._extract_columns_from_domain_step raises
        assert isinstance(domain_step.domain, str)
        table = FromTable(
            table_name=domain_step.domain, builder=None, query_class=self.QUERY_CLS, schema=self._db_schema
        )
        step_method: Callable[..., StepContext] = getattr(self, second_step.name)

        # If we have a top step, ensure we can have at most source_rows_subset results
        if (
            self._source_rows_subset is not None
            and isinstance(second_step, TopStep)
            and self._source_rows_subset < second_step.limit
        ):
            second_step = second_step.model_copy(update={"limit": self._source_rows_subset})

        ctx = step_method(step=second_step, prev_step_table=table, builder=None, columns=columns)

        # If we have a filter step, add a limit on source_rows_subset
        if self._source_rows_subset is not None and isinstance(second_step, FilterStep):
            ctx.selectable = ctx.selectable.limit(self._source_rows_subset)

        return ctx

    def _ensure_term_uses_wrapper(self: Self, term: Term):
        """(ugly) monkey patch to make sure pypika term uses the right wrapper"""
        from functools import partial

        term.wrap_constant = partial(term.wrap_constant, wrapper_cls=self.VALUE_WRAPPER_CLS)

    def _step_method(self, step_name: str) -> Callable[..., StepContext]:
        if (step_method := getattr(self, step_name, None)) is None:
            raise NotImplementedError(f"[{self.DIALECT}] step {step_name} is not implemented")
        return step_method

    def get_query_builder(
        self: Self,
        *,
        steps: Sequence["PipelineStep"],
        query_builder: QueryBuilder | None = None,
        unwrap_last_step: bool = False,
    ) -> QueryBuilderContext:
        if len(steps) < 0:
            ValueError("No steps provided")
        assert steps[0].name == "domain" or steps[0].name == "customsql"
        self._step_count = 0

        # A single custom SQL step must always be wrapped in a CTE, as we cannot apply offset and
        # limit on it directly
        if len(steps) == 1 and steps[0].name == "customsql":
            unwrap_last_step = False

        if len(steps) > 1 and isinstance(steps[0], DomainStep) and isinstance(steps[1], FilterStep | TopStep):
            ctx = self._merge_first_steps(domain_step=steps[0], second_step=steps[1])
            remaining_steps = steps[2:]
        else:
            ctx = self._step_context_from_first_step(steps[0])
            remaining_steps = steps[1:]

        table_name = self._next_step_name()
        if not remaining_steps:
            if unwrap_last_step:
                # if we want to unwrap the last step, we return the query as-is, without a CTE
                return QueryBuilderContext(
                    builder=ctx.selectable, columns=ctx.columns, table_name=table_name, last_step_unwrapped=True
                )
            else:
                # otherwise, we wrap it in a CTE
                builder = (query_builder if query_builder is not None else self.QUERY_CLS).with_(
                    ctx.selectable, table_name
                )
                return QueryBuilderContext(
                    builder=builder, columns=ctx.columns, table_name=table_name, last_step_unwrapped=False
                )

        builder = (query_builder if query_builder is not None else self.QUERY_CLS).with_(ctx.selectable, table_name)

        # In case we want to unwrap, the last step will be treated differently
        if unwrap_last_step:
            last_step = remaining_steps[-1]
            remaining_steps = remaining_steps[:-1]
        else:
            last_step = None

        for step in remaining_steps:
            step_method = self._step_method(step.name)
            from_table = FromTable(table_name=table_name, builder=None, query_class=self.QUERY_CLS)
            ctx = step_method(step=step, prev_step_table=from_table, builder=builder, columns=ctx.columns)
            table_name = self._next_step_name()
            builder = (ctx.builder or builder).with_(ctx.selectable, table_name)

        if last_step is not None:
            from weaverbird.pipeline.steps import AggregateStep, AppendStep, JoinStep, UnpivotStep

            step_method = self._step_method(last_step.name)

            # Unpivot steps must always be wrapped in a CTE, as they return a LiteralValue rather
            # than a query
            if isinstance(last_step, AppendStep | JoinStep | UnpivotStep):
                from_table = FromTable(table_name=table_name, builder=None, query_class=self.QUERY_CLS)
                ctx = step_method(step=last_step, prev_step_table=from_table, builder=builder, columns=ctx.columns)
                table_name = self._next_step_name()
                assert ctx.builder is not None
                builder = ctx.builder.with_(ctx.selectable, table_name)
                return self._unwrap_combination_step(builder=builder, columns=ctx.columns, table_name=table_name)

            # Aggregate step without group-by and with granularity has to select from previous_step_table and from
            # current_step in order to keep all fields. That's why step must always be wrapped in a CTE.
            elif isinstance(last_step, AggregateStep) and not last_step.on and last_step.keep_original_granularity:
                from_table = FromTable(table_name=table_name, builder=builder, query_class=self.QUERY_CLS)
                ctx = step_method(step=last_step, prev_step_table=from_table, builder=builder, columns=ctx.columns)
                table_name = self._next_step_name()
                builder = builder.with_(ctx.selectable, table_name)
                return QueryBuilderContext(
                    builder=builder, columns=ctx.columns, table_name=table_name, last_step_unwrapped=False
                )
            else:
                from_table = FromTable(table_name=table_name, builder=builder, query_class=self.QUERY_CLS)
                ctx = step_method(step=last_step, prev_step_table=from_table, builder=builder, columns=ctx.columns)
                return QueryBuilderContext(
                    builder=ctx.selectable, columns=ctx.columns, table_name=table_name, last_step_unwrapped=True
                )

        else:
            return QueryBuilderContext(
                builder=builder, columns=ctx.columns, table_name=table_name, last_step_unwrapped=False
            )

    def get_query_str(
        self: Self, *, steps: Sequence["PipelineStep"], offset: int | None = None, limit: int | None = None
    ) -> str:
        # If a pipeline ends with a top step and limit is set, it will override the top step's limit.
        if limit and isinstance(steps[-1], TopStep):
            if limit > steps[-1].limit:
                limit = steps[-1].limit

        # This method is used by translate_pipeline. We are at the top level here, not in a nested
        # builder, so we want to unwrap the last step
        return (
            self.get_query_builder(steps=steps, unwrap_last_step=True).materialize(offset=offset, limit=limit).get_sql()
        )

    # All other methods implement step from https://weaverbird.toucantoco.com/docs/steps/,
    # the name of the method being the name of the step and the kwargs the rest of the params
    def _get_aggregate_function(self: Self, agg_function: "AggregateFn") -> type[functions.AggregateFunction] | None:
        match agg_function:
            case "avg":
                return functions.Avg
            case "count":
                return functions.Count
            case "count distinct":
                return CountDistinct
            case "max":
                return functions.Max
            case "min":
                return functions.Min
            case "sum":
                return functions.Sum
            case _:
                return None

    def _get_window_function(self: Self, window_function: "AggregateFn") -> analytics.AnalyticFunction | None:
        match window_function:
            case "first":
                return analytics.FirstValue
            case "last":
                return analytics.LastValue
            case _:
                return None

    @classmethod
    def _adapt_date_format(cls, format: str) -> str:
        """
        We have some custom formats written with the syntax
        https://pandas.pydata.org/docs/reference/api/pandas.Period.strftime.html
        that need to be adapted for the SQL engine
        """
        return (
            format.replace("%d", cls.DATE_FORMAT_MAPPING.day_number)
            .replace("%m", cls.DATE_FORMAT_MAPPING.month_number)
            .replace("%b", cls.DATE_FORMAT_MAPPING.month_short)
            .replace("%B", cls.DATE_FORMAT_MAPPING.month_full)
            .replace("%Y", cls.DATE_FORMAT_MAPPING.year)
        )

    def absolutevalue(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "AbsoluteValueStep",
    ) -> StepContext:
        col_field = prev_step_table[step.column]
        query: Selectable = prev_step_table.select(*columns, functions.Abs(col_field).as_(step.new_column))
        return StepContext(query, columns + [step.new_column])

    def aggregate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "AggregateStep",
    ) -> StepContext:
        agg_selected: list[Field] = []
        window_selected: list[tuple[int, Field]] = []
        window_subquery_list: list[Tables] = []

        def _build_window_subquery() -> Any:
            min_window_index = min(c[0] for c in window_selected)
            first_wq = Table(f"wq{min_window_index}")
            merged_query = (
                self.QUERY_CLS.from_(window_subquery_list[0])
                .select(
                    *step.on,
                    *[getattr(first_wq, col[1].alias) for col in window_selected if col[0] == min_window_index],
                )
                .as_("window_subquery")
            )
            for index, sq in enumerate(window_subquery_list[1:]):
                wq_temp = Table(f"wq{min_window_index + index + 1}")
                merged_query = (
                    merged_query.join(sq)
                    .on_field(*step.on)
                    .select(
                        *[
                            getattr(wq_temp, col[1].alias)
                            for col in window_selected
                            if col[0] == min_window_index + index + 1
                        ]
                    )
                    .as_("window_subquery")
                )
            return merged_query

        # Handle aggregation and analytics functions in distinct subqueries

        # Save which columns have already been aggregated to avoid ambiguous columns double selections
        agg_col_names = []

        for step_index, aggregation in enumerate(step.aggregations):
            if agg_fn := self._get_aggregate_function(aggregation.agg_function):
                for agg_column_name, new_column_name in zip(aggregation.columns, aggregation.new_columns, strict=True):
                    if new_column_name not in agg_col_names:
                        column_field = prev_step_table[agg_column_name]
                        new_agg_col = agg_fn(column_field).as_(new_column_name)
                        agg_selected.append(new_agg_col)
                        agg_col_names.append(new_column_name)

            elif window_fn := self._get_window_function(aggregation.agg_function):
                agg_cols: list[Field] = []
                for window_index, window_column_name in enumerate(aggregation.columns):
                    column_field = prev_step_table[window_column_name]
                    step_on_formatted = [format_quotes(col, builder.QUOTE_CHAR) for col in step.on]
                    new_window_col = (
                        window_fn(column_field)
                        .over(*step_on_formatted)
                        .orderby(column_field)
                        .rows(analytics.Preceding(), analytics.Following())
                        .as_(aggregation.new_columns[window_index])
                    )

                    agg_col_names.append(aggregation.new_columns[window_index])
                    window_selected.append((step_index, new_window_col))
                    agg_cols.append(new_window_col)
                window_subquery_list.append(
                    prev_step_table.select(*step.on, *agg_cols).distinct().as_(f"wq{step_index}")
                )

            else:  # pragma: no cover
                raise NotImplementedError(
                    f"[{self.DIALECT}] Aggregation for {aggregation.agg_function!r} is not yet implemented"
                )

        if window_subquery_list and agg_selected:
            window_table = Table("window_subquery")
            all_windows_subquery = _build_window_subquery()
            agg_query = (
                prev_step_table.select(*agg_selected, *step.on).groupby(*step.on).orderby(*step.on, order=Order.asc)
            ).as_("agg_subquery")
            agg_table = Table("agg_subquery")
            merged_selected: list[str | Field] = [
                *step.on,
                *[getattr(agg_table, col.alias) for col in agg_selected],
                *[getattr(window_table, col[1].alias) for col in window_selected],
            ]
            if step.on:
                merged_query = (
                    self.QUERY_CLS.from_(agg_query)
                    .select(*merged_selected)
                    .inner_join(all_windows_subquery)
                    .on_field(*step.on)
                )
            else:
                # If there is no `step.on` columns to join, just put the 2 subqueries side by side:
                merged_query = self.QUERY_CLS.from_(agg_query).from_(all_windows_subquery).select(*merged_selected)
        elif agg_selected:
            selected_cols = [*step.on, *agg_selected]
            merged_query = prev_step_table.select(*selected_cols).groupby(*step.on)
        elif window_subquery_list:
            merged_query = _build_window_subquery()
        else:
            merged_query = prev_step_table.select(*step.on).groupby(*step.on)
        query: QueryBuilder
        selected_col_names: list[str]

        if step.keep_original_granularity:
            if step.on:
                query = (
                    prev_step_table.select(
                        *columns,
                        *(Field(agg_col, table=merged_query) for agg_col in agg_col_names),
                    )
                    .left_join(merged_query)
                    .on_field(*step.on)
                )
            else:
                # If there is no `step.on` columns to join, just put the 2 subqueries side by side:
                all_agg_col_names = [col for col in agg_col_names if col not in columns]
                query = (
                    self.QUERY_CLS.from_(prev_step_table.name)
                    .from_(merged_query)
                    .select(
                        *columns,
                        *(Field(agg_col, table=merged_query) for agg_col in all_agg_col_names),
                    )
                )
            selected_col_names = [*columns, *agg_col_names]
            return StepContext(query.orderby(*step.on) if step.on else query, selected_col_names)

        else:
            selected_col_names = [
                *step.on,
                *(f.alias for f in agg_selected),
                *(f[1].alias for f in window_selected),
            ]
            return StepContext(
                merged_query.orderby(*step.on) if step.on else merged_query,
                selected_col_names,
            )

    @staticmethod
    def _pipeline_or_domain_name_or_reference_to_pipeline(
        pipeline: "PipelineOrDomainNameOrReference", message: str | None = None
    ) -> list["PipelineStep"]:
        try:
            return Pipeline(steps=pipeline).steps
        except Exception as exc:
            message = message or f"could not convert {pipeline} to pipeline: {exc}"
            raise NotImplementedError(message) from exc

    def _unwrap_combination_step(
        self, *, builder: "QueryBuilder", columns: list[str], table_name: str
    ) -> QueryBuilderContext:
        """This is a helper method allowing to unwrap combination steps.

        It is required because unwrapping an append step would be highly uneffective:
        Since unwrapping a step makes it extract columns from the last CTE at the root level,
        unwrapping an append step would result in this form:

        (
            WITH
                __s0_pipe1__ AS (SELECT a AS aa FROM a),
                __s0_pipe2__ AS (SELECT b AS bb FROM b)
            SELECT aa FROM __s0_pipe1__
        )
        UNION ALL
        (SELECT bb FROM __s0_pipe2__)

        This does not work, as every query needs to have the whole context. Here, the DB will error
        on the second query, complaining that __s0_pipe2__ does not exist.

        We could provide the builder with the entire context to every query, but it would result in
        the following form:

        (
            WITH
                __s0_pipe1__ AS (SELECT a AS aa FROM a),
                __s0_pipe2__ AS (SELECT b AS bb FROM b)
            SELECT aa FROM __s0_pipe1__
        )
        UNION ALL
        (
            WITH
                __s0_pipe1__ AS (SELECT a AS aa FROM a),
                __s0_pipe2__ AS (SELECT b AS bb FROM b)
            SELECT bb FROM __s0_pipe2__
        )

        This would cause every step to be re-executed for every appended dataset, which would be
        extremely costly.

        Another solution would be to just provide the context of its own builder to every pipeline,
        to have something like this:

        (WITH __s0_pipe1__ AS (SELECT a AS aa FROM a) SELECT aa FROM __s0_pipe1__)
        UNION ALL
        (WITH __s0_pipe2__ AS (SELECT b AS bb FROM b) SELECT bb FROM __s0_pipe2__)

        But this would not work either: if the append step is not in the last position, we would end
        up with nested CTEs, which is not supported.

        Thus, we chose to always treat the append step as if it was not in the last position in the
        pipeline, meaning we generate a query as follows.

        WITH __s0_pipe1__ AS (SELECT a AS aa FROM a),
        WITH __s0_pipe2__ AS (SELECT b AS bb FROM b),
        WITH __s1_pipe1__ AS ((SELECT aa, NULL FROM __s0_pipe1__) UNION ALL (SELECT NULL, bb FROM __s0_pipe2__)),
        ...

        In case the append step is in the last position in the pipeline, this method will simply
        unwrap the result by selecting all columns returned by the step and applying the same ordering
        as the step does to ensure result consistency.

        This is also needed for join steps, due to the following behaviour in pypika: In case the join
        step is the last step of the pipeline, and it contains an append step, the following form
        would be generated for the append step:
        WITH __s1_pipe0__ AS (
            (SELECT a AS aa, NULL as bb FROM __s0_pipe0__)
            UNION ALL
            (SELECT NULL AS aa, b AS bb FROM __s0_pipe1__)
            ORDER BY aa, bb
        )

        However, when a top-level SELECT statement is made immediately after, the table name gets
        prepended to the columns in the ORDER BY statement, resulting in this form:
        WITH __s1_pipe0__ AS (
            (SELECT a AS aa, NULL as bb FROM __s0_pipe0__)
            UNION ALL
            (SELECT NULL AS aa, b AS bb FROM __s0_pipe1__)
            ORDER BY __s0_pipe0__.aa, __s0_pipe1__.bb
        )

        This is invalid SQL, as the tables are not part of a FROM statement.
        """
        query = builder.from_(table_name).select(*columns).orderby(*columns)
        return QueryBuilderContext(builder=query, columns=columns, table_name=table_name, last_step_unwrapped=True)

    def append(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "AppendStep",
    ) -> StepContext:
        pipelines = [self._pipeline_or_domain_name_or_reference_to_pipeline(pipeline) for pipeline in step.pipelines]
        tables: list[str] = []
        column_lists: list[list[str]] = []

        for pipeline in pipelines:
            pipeline_ctx = self.__class__(
                tables_columns=self._tables_columns,
                db_schema=self._db_schema_name,
                known_instances=self._known_instances,
            ).get_query_builder(steps=pipeline, query_builder=builder)
            tables.append(pipeline_ctx.table_name)
            column_lists.append(pipeline_ctx.columns)
            builder = pipeline_ctx.builder

        # By default, UNION ALL will append columns by index in SQL, and only append as much columns
        # as available in the first SELECT statement. Also, the columns are appended in the order of
        # the select statement, which is not what we want either (a merge by name is probably what's
        # expected by the user)
        columns_to_add = []
        for column_list in column_lists:
            for col in column_list:
                if col not in columns and col not in columns_to_add:
                    columns_to_add.append(col)

        all_columns = columns + columns_to_add

        query = prev_step_table.select(*columns, *(LiteralValue("NULL").as_(col) for col in columns_to_add))
        for table, column_list in zip(tables, column_lists, strict=True):
            query = query.union_all(
                self.QUERY_CLS.from_(table).select(
                    *(
                        # Selecting either the column from the dataset if it is available, or NULL
                        # AS "col" otherwise. We iterate over all_columns rather than column_list in
                        # order to have a merge by name
                        col if col in column_list else LiteralValue("NULL").as_(col)
                        for col in all_columns
                    )
                )
            )

        return StepContext(query.orderby(*all_columns), all_columns, builder)

    def argmax(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "ArgmaxStep",
    ) -> StepContext:
        from weaverbird.pipeline.steps import TopStep

        return self.top(
            builder=builder,
            prev_step_table=prev_step_table,
            columns=columns,
            step=TopStep(rank_on=step.column, sort="desc", limit=1, groups=step.groups),
        )

    def argmin(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "ArgminStep",
    ) -> StepContext:
        from weaverbird.pipeline.steps import TopStep

        return self.top(
            builder=builder,
            prev_step_table=prev_step_table,
            columns=columns,
            step=TopStep(rank_on=step.column, sort="asc", limit=1, groups=step.groups),
        )

    def comparetext(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "CompareTextStep",
    ) -> StepContext:
        query: QueryBuilder = prev_step_table.select(
            *columns,
            Case()
            .when(prev_step_table[step.str_col_1] == prev_step_table[step.str_col_2], True)
            .else_(False)
            .as_(step.new_column_name),
        )
        return StepContext(query, columns + [step.new_column_name])

    def concatenate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "ConcatenateStep",
    ) -> StepContext:
        # from step.columns = ["city", "age", "username"], step.separator = " -> "
        # create [Field("city"), " -> ", Field("age"), " -> ", Field("username")]
        tokens = [prev_step_table[step.columns[0]]]
        for col in step.columns[1:]:
            tokens.append(step.separator)
            tokens.append(prev_step_table[col])

        query = prev_step_table.select(*columns, functions.Concat(*tokens).as_(step.new_column_name))
        return StepContext(query, columns + [step.new_column_name])

    def convert(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "ConvertStep",
    ) -> StepContext:
        col_fields: list[Field] = [prev_step_table[col] for col in step.columns]
        query: QueryBuilder = prev_step_table.select(
            *(c for c in columns if c not in step.columns),
            *(
                functions.Cast(col_field, getattr(self.DATA_TYPE_MAPPING, step.data_type)).as_(col_field.name)
                for col_field in col_fields
            ),
        )
        return StepContext(query, columns)

    def cumsum(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "CumSumStep",
    ) -> StepContext:
        partition_over = [Field(group) for group in step.groupby] if step.groupby else ["NULL"]
        order_by = Field(step.reference_column)
        cumsum_cols = [
            analytics.Sum(Field(col))
            .over(*partition_over)
            .orderby(order_by)
            .rows(analytics.Preceding())
            .as_(new_col or f"{col}_cumsum")
            for col, new_col in step.to_cumsum
        ]
        cumsum_colnames = [col.alias for col in cumsum_cols]
        # In case some cumsum columns have overwritten previously exising columns, don't select twice
        original_column_names = [col for col in columns if col not in cumsum_colnames]
        query = (
            prev_step_table.select(*original_column_names, *cumsum_cols)
            # Depending on the backend, results are ordered by partition or by reference colum, so
            # we choose an arbitrary ordering here
            .orderby(order_by)
        )
        return StepContext(query, original_column_names + cumsum_colnames)

    def _custom_query(self: Self, *, step: "CustomSqlStep") -> CustomQuery:
        return CustomQuery(name="custom_from", query=step.query)

    def customsql(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "CustomSqlStep",
    ) -> StepContext:
        raise ForbiddenSQLStep("CustomSQL steps are only allowed at the start of the pipeline")

    @classmethod
    def _day_of_week(cls, target_column: Field) -> Term:
        return Extract("dow", target_column)

    @classmethod
    def _date_trunc(cls, date_part: str, target_column: Field) -> Term:
        return DateTrunc(date_part, target_column)

    @classmethod
    def _get_date_extract_func(cls, *, date_unit: DATE_INFO, target_column: Field) -> Term:
        if (lowered_date_unit := date_unit.lower()) in (
            "seconds",
            "minutes",
            "hour",
            "day",
            "week",
            "month",
            "quarter",
            "year",
            "yearofweek",
        ):
            return Extract(lowered_date_unit.removesuffix("s"), cls._cast_to_timestamp(target_column))
        # ms aren't supported by snowflake's EXTRACT, even if the docs state otherwise:
        # https://community.snowflake.com/s/question/0D50Z00008dWkrpSAC/supported-time-parts-in-datepart
        elif lowered_date_unit == "milliseconds":
            return Extract("second", cls._cast_to_timestamp(target_column)) * 1000
        elif lowered_date_unit == "dayofweek":
            return (cls._day_of_week(target_column) % 7) + 1
        elif lowered_date_unit == "dayofyear":
            return Extract("doy", target_column)
        elif lowered_date_unit == "isoweek":
            return Extract("week", target_column)
        elif lowered_date_unit == "isodayofweek":
            # We want monday as 1, sunday as 7. Redshift goes from sunday as 0 to saturday as 6
            return Case().when(cls._day_of_week(target_column) == 0, 7).else_(cls._day_of_week(target_column))
        elif lowered_date_unit == "firstdayofyear":
            return cls._date_trunc("year", target_column)
        elif lowered_date_unit == "firstdayofmonth":
            return cls._date_trunc("month", target_column)
        elif lowered_date_unit == "firstdayofweek":
            # 'week' considers monday to be the first day of the week, we want sunday. Thus, we
            # shift the timestamp back and forth
            return cls._add_date(
                target_column=cls._date_trunc(
                    "week", cls._add_date(target_column=target_column, duration=1, unit="days")
                ),
                duration=-1,
                unit="days",
            )
        elif lowered_date_unit == "firstdayofquarter":
            return cls._date_trunc("quarter", target_column)
        elif lowered_date_unit == "firstdayofisoweek":
            return cls._date_trunc("week", target_column)
        elif lowered_date_unit == "previousday":
            return cls._add_date(target_column=target_column, unit="days", duration=-1)
        elif lowered_date_unit == "previousyear":
            return Extract(
                "year",
                cls._add_date(target_column=target_column, unit="years", duration=-1),
            )
        elif lowered_date_unit == "previousmonth":
            return Extract(
                "month",
                cls._add_date(target_column=target_column, unit="months", duration=-1),
            )
        elif lowered_date_unit == "previousweek":
            return Extract("week", cls._add_date(target_column=target_column, unit="weeks", duration=-1))
        elif lowered_date_unit == "previousisoweek":
            return Extract("week", cls._add_date(target_column=target_column, unit="weeks", duration=-1))
        elif lowered_date_unit == "previousquarter":
            return Extract(
                "quarter",
                cls._add_date(
                    target_column=cls._date_trunc("quarter", target_column),
                    unit="months",
                    duration=-3,
                ),
            )
        elif lowered_date_unit == "firstdayofpreviousyear":
            return cls._add_date(target_column=cls._date_trunc("year", target_column), unit="years", duration=-1)
        elif lowered_date_unit == "firstdayofpreviousmonth":
            return cls._add_date(target_column=cls._date_trunc("month", target_column), unit="months", duration=-1)
        elif lowered_date_unit == "firstdayofpreviousquarter":
            # Postgres does not support quarters in intervals
            return cls._add_date(target_column=cls._date_trunc("year", target_column), unit="months", duration=-3)
        elif lowered_date_unit == "firstdayofpreviousweek":
            return cls._add_date(
                target_column=cls._add_date(
                    target_column=cls._date_trunc(
                        "week", cls._add_date(target_column=target_column, unit="days", duration=1)
                    ),
                    unit="days",
                    duration=-1,
                ),
                unit="weeks",
                duration=-1,
            )
        elif lowered_date_unit == "firstdayofpreviousisoweek":
            return cls._add_date(target_column=cls._date_trunc("week", target_column), unit="weeks", duration=-1)
        # Postgres supports EXTRACT(isoyear) but redshift doesn't so...
        elif lowered_date_unit == "isoyear":
            return Extract("year", cls._date_trunc("week", target_column))

    def dateextract(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "DateExtractStep",
    ) -> StepContext:
        from weaverbird.pipeline.steps.date_extract import TIMESTAMP_DATE_PARTS

        date_col = prev_step_table[step.column]
        extracted_dates: list[LiteralValue] = []

        for date_info, new_column_name in zip(step.date_info, step.new_columns, strict=True):
            col_field = self._get_date_extract_func(date_unit=date_info, target_column=date_col)

            if date_info not in get_args(TIMESTAMP_DATE_PARTS):
                col_field = functions.Cast(col_field, self.DATA_TYPE_MAPPING.integer)

            extracted_dates.append(col_field.as_(new_column_name))
        query = prev_step_table.select(*columns, *extracted_dates)

        return StepContext(query, columns + [col.alias for col in extracted_dates])

    def delete(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "DeleteStep",
    ) -> StepContext:
        new_columns = [c for c in columns if c not in step.columns]
        query = prev_step_table.select(*new_columns)
        return StepContext(query, new_columns)

    def _extract_columns_from_domain_step(self: Self, *, step: "DomainStep") -> list[str]:
        if isinstance(step.domain, Reference):
            raise NotImplementedError(f"[{self.DIALECT}] Cannot resolve a reference to a query")
        try:
            return list(self._tables_columns[step.domain])
        except KeyError as exc:
            raise UnknownTableColumns(f"Table {exc} not in table_columns") from exc

    # Prefixing domain with a '_', as it is a special case and should not be returned by
    # getattr(self, step_name)
    def _domain(self: Self, *, step: "DomainStep") -> StepContext:
        selected_cols = self._extract_columns_from_domain_step(step=step)
        query: QueryBuilder = self.QUERY_CLS.from_(Table(step.domain, schema=self._db_schema)).select(*selected_cols)
        if self._source_rows_subset:
            query = query.limit(self._source_rows_subset)
        return StepContext(query, selected_cols)

    def duplicate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "DuplicateStep",
    ) -> StepContext:
        query: QueryBuilder = prev_step_table.select(*columns, prev_step_table[step.column].as_(step.new_column_name))
        return StepContext(query, columns + [step.new_column_name])

    @classmethod
    @abstractmethod
    def _interval_to_seconds(cls, value: Selectable) -> functions.Function:
        """Converts an INTERVAL SQL type to a duration in seconds"""

    def duration(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "DurationStep",
    ) -> StepContext:
        as_seconds = functions.Cast(
            self._interval_to_seconds(
                self._cast_to_timestamp(prev_step_table[step.end_date_column])
                - self._cast_to_timestamp(prev_step_table[step.start_date_column]),
            ),
            self.DATA_TYPE_MAPPING.float,
        )
        new_column = (as_seconds / DURATIONS_IN_SECOND[step.duration_in]).as_(step.new_column_name)

        query: QueryBuilder = prev_step_table.select(*columns, new_column)
        return StepContext(query, columns + [step.new_column_name])

    @classmethod
    def _add_date(cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None) -> Term:
        return target_column + Interval(**{unit: duration, "dialect": dialect})

    def evolution(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "EvolutionStep",
    ) -> StepContext:
        lagged_date = self._add_date(
            target_column=prev_step_table[step.date_col],
            duration=1,
            unit=self.EVOLUTION_DATE_UNIT[step.evolution_type],
        ).as_(step.date_col)
        right_table = Table("right_table")
        new_col = step.new_column if step.new_column else "evol"

        query: QueryBuilder = (
            prev_step_table.select(
                *(prev_step_table[col] for col in columns),
                (
                    prev_step_table[step.value_col] - right_table.field(step.value_col)
                    if step.evolution_format == "abs"
                    # (value -  prev_value) / abs(prev_value) or NULL if prev_value == 0
                    else Case()
                    .when(
                        functions.Cast(right_table.field(step.value_col), self.DATA_TYPE_MAPPING.float) == 0,
                        LiteralValue("NULL"),
                    )
                    .else_(
                        functions.Cast(prev_step_table[step.value_col], self.DATA_TYPE_MAPPING.float)
                        - functions.Cast(right_table.field(step.value_col), self.DATA_TYPE_MAPPING.float)
                    )
                    / functions.Abs(functions.Cast(right_table.field(step.value_col), self.DATA_TYPE_MAPPING.float))
                ).as_(new_col),
                *[prev_step_table[col].as_(f"left_table_{col}") for col in step.index_columns],
            )
            .left_join(
                prev_step_table.select(
                    step.value_col,
                    lagged_date,
                    *step.index_columns,
                ).as_("right_table"),
            )
            .on_field(step.date_col, *step.index_columns)
            .orderby(step.date_col)
        )
        return StepContext(query, columns + [new_col])

    def fillna(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "FillnaStep",
    ) -> StepContext:
        query: QueryBuilder = prev_step_table.select(
            *(c for c in columns if c not in step.columns),
            *(functions.Coalesce(prev_step_table[col_name], step.value).as_(col_name) for col_name in step.columns),
        )
        return StepContext(query, columns)

    @staticmethod
    def _cast_to_timestamp(value: str | datetime | Field | Term) -> functions.Function:
        return functions.Cast(value, "TIMESTAMP")

    def _get_single_condition_criterion(
        self: Self, condition: "SimpleCondition", prev_step_table: FromTable
    ) -> Criterion:
        column_field = prev_step_table[condition.column]
        self._ensure_term_uses_wrapper(column_field)

        # NOTE: type ignore comments below are because of 'Expected type in class pattern; found
        # "Any"' mypy errors. Seems like mypy 0.990 does not like typing.Annotated
        match condition:
            case ComparisonCondition():  # type:ignore[misc]
                import operator

                # Handle special case of checking (in)equality to NULL
                if condition.value is None:
                    if condition.operator == "eq":
                        return column_field.isnull()
                    elif condition.operator == "ne":
                        return column_field.isnotnull()

                op = getattr(operator, condition.operator)
                return op(column_field, condition.value)

            case InclusionCondition():  # type:ignore[misc]
                if condition.operator == "in":
                    if None in condition.value:
                        # handle special case of having NULL amongst selected values
                        case_null = column_field.isnull()
                        other_cases = column_field.isin([v for v in condition.value if v is not None])
                        return Criterion.any([case_null, other_cases])
                    else:
                        return column_field.isin(condition.value)
                elif condition.operator == "nin":
                    if None in condition.value:
                        # handle special case of having NULL amongst excluded values
                        case_null = column_field.isnotnull()
                        other_cases = column_field.notin([v for v in condition.value if v is not None])
                        return Criterion.all([case_null, other_cases])
                    else:
                        return column_field.notin(condition.value)

            case MatchCondition():  # type:ignore[misc]
                compliant_regex = _compliant_regex(condition.value, self.DIALECT)

                if condition.operator == "matches":
                    # Casting the field to str first as it is the only compatible type for regex
                    casted_field = functions.Cast(column_field, self.DATA_TYPE_MAPPING.text)
                    match self.REGEXP_OP:
                        case RegexOp.REGEXP:
                            return BasicCriterion(
                                RegexpMatching.regexp,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.SIMILAR_TO:
                            return BasicCriterion(
                                RegexpMatching.similar_to,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.CONTAINS:
                            return BasicCriterion(
                                RegexpMatching.contains,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_CONTAINS:
                            return functions.Function(
                                RegexOp.REGEXP_CONTAINS.value,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_LIKE:
                            return functions.Function(
                                RegexOp.REGEXP_LIKE.value,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_CONTAINS:
                            return functions.Function(
                                RegexOp.NOT_REGEXP_CONTAINS.value,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_LIKE:
                            return functions.Function(
                                RegexOp.NOT_REGEXP_LIKE.value,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case _:
                            raise NotImplementedError(f"[{self.DIALECT}] doesn't have regexp operator")

                elif condition.operator == "notmatches":
                    # Casting the field to str first as it is the only compatible type for regex
                    casted_field = functions.Cast(column_field, self.DATA_TYPE_MAPPING.text)
                    match self.REGEXP_OP:
                        case RegexOp.REGEXP:
                            return casted_field.regexp(compliant_regex).negate()
                        case RegexOp.SIMILAR_TO:
                            return BasicCriterion(
                                RegexpMatching.not_similar_to,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.CONTAINS:
                            return BasicCriterion(
                                RegexpMatching.not_contains,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_CONTAINS:
                            return functions.Function(
                                RegexOp.NOT_REGEXP_CONTAINS.value,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_LIKE:
                            return functions.Function(
                                RegexOp.NOT_REGEXP_LIKE.value,
                                casted_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case _:
                            raise NotImplementedError(f"[{self.DIALECT}] doesn't have regexp operator")

            case NullCondition():  # type:ignore[misc]
                if condition.operator == "isnull":
                    return column_field.isnull()
                elif condition.operator == "notnull":
                    return column_field.isnotnull()

            case DateBoundCondition():  # type:ignore[misc]
                if isinstance(condition.value, RelativeDate | datetime | str):
                    if isinstance(condition.value, RelativeDate):
                        dt = evaluate_relative_date(condition.value)
                    elif isinstance(condition.value, datetime):
                        dt = condition.value
                    else:
                        dt = dateutil_parser.parse(condition.value)
                    dt = dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt.astimezone(UTC)
                    value_to_compare = self._cast_to_timestamp(dt.strftime("%Y-%m-%d %H:%M:%S"))

                elif isinstance(condition.value, functions.Function):
                    value_to_compare = condition.value

                if condition.operator == "from":
                    return self._cast_to_timestamp(column_field) >= value_to_compare
                elif condition.operator == "until":
                    return self._cast_to_timestamp(column_field) <= value_to_compare

            case _:  # pragma: no cover
                raise KeyError(f"Operator {condition.operator!r} does not exist")

    def _get_filter_criterion(self: Self, condition: "Condition", prev_step_table: FromTable) -> Criterion:
        from weaverbird.pipeline.conditions import ConditionComboAnd, ConditionComboOr

        # NOTE: type ignore comments below are because of 'Expected type in class pattern; found
        # "Any"' mypy errors. Seems like mypy 0.990 does not like typing.Annotated
        match condition:
            case ConditionComboOr():  # type:ignore[misc]
                return Criterion.any(
                    self._get_filter_criterion(condition, prev_step_table) for condition in condition.or_
                )
            case ConditionComboAnd():  # type:ignore[misc]
                return Criterion.all(
                    self._get_filter_criterion(condition, prev_step_table) for condition in condition.and_
                )
            case _:
                return self._get_single_condition_criterion(condition, prev_step_table)

    def filter(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "FilterStep",
    ) -> StepContext:
        query = prev_step_table.select(*columns).where(self._get_filter_criterion(step.condition, prev_step_table))
        return StepContext(query, columns)

    def formula(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "FormulaStep",
    ) -> StepContext:
        formula = formula_to_term(step.formula, prev_step_table)
        query = prev_step_table.select(*(columns), formula.as_(step.new_column))
        return StepContext(query, columns + [step.new_column])

    def fromdate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "FromdateStep",
    ) -> StepContext:
        col_field = prev_step_table[step.column]

        match self.FROM_DATE_OP:
            case FromDateOp.DATE_FORMAT:
                convert_fn = DateFormat
            case FromDateOp.TO_CHAR:
                convert_fn = functions.ToChar
            case FromDateOp.FORMAT_DATE:
                convert_fn = FormatDate
            case _:
                raise NotImplementedError(f"[{self.DIALECT}] doesn't have from date operator")

        query = prev_step_table.select(
            *(c for c in columns if c != step.column),
            convert_fn(col_field, self._adapt_date_format(step.format)).as_(step.column),
        )
        return StepContext(query, columns)

    def _build_ifthenelse_case(
        self,
        *,
        if_: "Condition",
        then_: Any,
        # We can't use | with a quoted type in python 3.11
        else_: Union["Condition", Any],
        prev_step_table: FromTable,
        case_: Case,
    ) -> Case:
        import json

        from weaverbird.pipeline.steps.ifthenelse import IfThenElse

        try:
            # if the value is a string
            then_value = json.loads(then_)
            case_ = case_.when(self._get_filter_criterion(if_, prev_step_table), then_value)
        except (json.JSONDecodeError, TypeError):
            # the value is a formula or a string literal that can't be parsed
            then_value = formula_to_term(then_, prev_step_table)
            case_ = case_.when(self._get_filter_criterion(if_, prev_step_table), LiteralValue(then_value))

        if isinstance(else_, IfThenElse):
            return self._build_ifthenelse_case(
                if_=else_.condition,
                then_=else_.then,
                else_=else_.else_value,
                prev_step_table=prev_step_table,
                case_=case_,
            )
        else:
            try:
                # the value is a string
                else_value = json.loads(else_)  # type: ignore
                return case_.else_(else_value)
            except (json.JSONDecodeError, TypeError):
                # the value is a formula or a string literal that can't be parsed
                else_value = formula_to_term(else_, prev_step_table)
                return case_.else_(else_value)

    def ifthenelse(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "IfthenelseStep",
    ) -> StepContext:
        query = prev_step_table.select(
            *(column for column in columns if column != step.new_column),
            self._build_ifthenelse_case(
                if_=step.condition,
                then_=step.then,
                else_=step.else_value,
                prev_step_table=prev_step_table,
                case_=Case(),
            ).as_(step.new_column),
        )
        return StepContext(query, columns + [step.new_column])

    @staticmethod
    def _get_join_type(join_type: Literal["left", "inner", "left outer"]) -> JoinType:
        match join_type:
            case "left":
                return JoinType.left
            case "left outer":
                return JoinType.left_outer
            case "inner":
                return JoinType.inner

    @staticmethod
    def _field_list_to_name_list(fields: list[Field]) -> list[str]:
        return [field.alias or field.name for field in fields]

    def join(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "JoinStep",
    ) -> StepContext:
        steps = self._pipeline_or_domain_name_or_reference_to_pipeline(step.right_pipeline)

        right_builder_ctx = self.__class__(
            tables_columns=self._tables_columns,
            db_schema=self._db_schema_name,
            known_instances=self._known_instances,
        ).get_query_builder(steps=steps, query_builder=builder)
        left_table = prev_step_table.table()
        right_table = Table(right_builder_ctx.table_name)

        left_cols = [Field(col, table=left_table) for col in columns]
        # Simply checking if a column is in left columns and right columns is not enough to
        # determine if it needs to be aliased. In case of nested joins where a column is used in
        # three or more datasets (not unlikely with columns like "id" or "name"), the aliased column
        # may need to be suffixed several times. The join/inner_pypika_nested.yaml fixture shows an
        # example of this kind of situation
        right_cols: list[Field] = []
        for col in right_builder_ctx.columns:
            if col not in (all_cols := self._field_list_to_name_list(left_cols + right_cols)):
                right_cols.append(Field(col, table=right_table))
                continue
            alias = col
            while (alias := f"{alias}_right") in all_cols:
                pass
            right_cols.append(Field(col, table=right_table, alias=alias))

        prev_step_table.update_builder_if_exists(right_builder_ctx.builder)
        query = (
            prev_step_table.select(*left_cols, *right_cols)
            .join(right_table, self._get_join_type(step.type))
            .on(Criterion.all(Field(f[0], table=left_table) == Field(f[1], table=right_table) for f in step.on))
            # Order of results is not consistent depending on the SQL Engine (inconsistencies
            # observed with Athena and BigQuery).
            .orderby(*(c[0] for c in step.on))
        )
        return StepContext(
            query,
            [c.name for c in left_cols] + [c.alias or c.name for c in right_cols],
            right_builder_ctx.builder,
        )

    def lowercase(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "LowercaseStep",
    ) -> StepContext:
        col_field: Field = prev_step_table[step.column]
        query: QueryBuilder = prev_step_table.select(
            *(c for c in columns if c != step.column),
            functions.Lower(col_field).as_(step.column),
        )
        return StepContext(query, columns)

    def percentage(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "PercentageStep",
    ) -> StepContext:
        new_col_name = step.new_column_name or f"{step.column}_percentage"

        sum_col_name = f"__{step.column}_sum__"
        sum_col = functions.Sum(prev_step_table[step.column]).as_(sum_col_name)

        # If we have groups, we need to select them as well, and group the sum by the groups
        if len(step.group) > 0:
            agg_query = prev_step_table.select(sum_col, *step.group).groupby(*step.group)
        # Otherwise we just need a simple sum
        else:
            agg_query = prev_step_table.select(sum_col)

        perc_column = (
            functions.Cast(prev_step_table[step.column], self.DATA_TYPE_MAPPING.float) / agg_query[sum_col_name]
        ).as_(new_col_name)

        query = prev_step_table.select(*columns, perc_column)

        # If we have groups, we need to join on the groups
        if len(step.group) > 0:
            query = query.left_join(agg_query).on(
                Criterion.all(prev_step_table[field] == agg_query[field] for field in step.group)
            )

        # Otherwise, a cross join is enough
        else:
            # final .cross required by Pypika, otherwise we'd get a Joiner rather than a Selectable
            query = query.cross_join(agg_query).cross()

        return StepContext(query, columns + [new_col_name])

    def rank(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "RankStep",
    ) -> StepContext:
        col_field = prev_step_table[step.value_col]
        new_col_name = step.new_column_name or f"{step.value_col}_rank"

        analytics_fn = analytics.Rank if step.method == "standard" else analytics.DenseRank
        rank_column = (
            (analytics_fn().over(*(Field(group) for group in step.groupby)) if step.groupby else analytics_fn())
            .orderby(col_field, order=Order.desc if step.order == "desc" else Order.asc)
            .as_(new_col_name)
        )

        query = prev_step_table.select(*columns, rank_column)
        return StepContext(query, columns=columns + [new_col_name])

    def rename(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "RenameStep",
    ) -> StepContext:
        new_names_mapping: dict[str, str] = dict(step.to_rename)

        selected_col_fields: list[Field] = []

        for col_name in columns:
            if col_name in new_names_mapping:
                selected_col_fields.append(Field(name=col_name, alias=new_names_mapping[col_name]))
            else:
                selected_col_fields.append(Field(name=col_name))

        query = prev_step_table.select(*selected_col_fields)
        return StepContext(query, [f.alias or f.name for f in selected_col_fields])

    def replacetext(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "ReplaceTextStep",
    ) -> StepContext:
        col_field = prev_step_table[step.search_column]

        replaced_col = functions.Replace(col_field, step.old_str, step.new_str)

        query: QueryBuilder = prev_step_table.select(
            *(c for c in columns if c != step.search_column),
            replaced_col.as_(step.search_column),
        )

        return StepContext(query, columns)

    def replace(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "ReplaceStep",
    ) -> StepContext:
        col_field = prev_step_table[step.search_column]

        # Do a nested `replace` to replace many values on the same column
        replaced_col = col_field
        for old_name, new_name in step.to_replace:
            replaced_col = functions.Replace(replaced_col, old_name, new_name)

        query = prev_step_table.select(
            *(c for c in columns if c != step.search_column), replaced_col.as_(step.search_column)
        )

        return StepContext(query, columns)

    def select(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "SelectStep",
    ) -> StepContext:
        query = prev_step_table.select(*step.columns)
        return StepContext(query, step.columns)

    def sort(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "SortStep",
    ) -> StepContext:
        query = prev_step_table.select(*columns)

        for column_sort in step.columns:
            query = query.orderby(column_sort.column, order=Order.desc if column_sort.order == "desc" else Order.asc)

        return StepContext(query, columns)

    @staticmethod
    def _wrap_split_part(term: Term) -> Term:
        """Wraps calls to SplitPart if needed"""
        return term

    def split(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "SplitStep",
    ) -> StepContext:
        if self.SUPPORT_SPLIT_PART:
            col_field = prev_step_table[step.column]
            new_cols = [f"{step.column}_{i + 1}" for i in range(step.number_cols_to_keep)]
            query: QueryBuilder = prev_step_table.select(
                *columns,
                *(
                    self._wrap_split_part(functions.SplitPart(col_field, step.delimiter, i + 1)).as_(new_cols[i])
                    for i in range(step.number_cols_to_keep)
                ),
            )
            return StepContext(query, columns + new_cols)

        raise NotImplementedError(f"[{self.DIALECT}] split is not implemented")

    def substring(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "SubstringStep",
    ) -> StepContext:
        step.new_column_name = f"{step.column}_substr" if step.new_column_name is None else step.new_column_name
        col_field = prev_step_table[step.column]
        query: QueryBuilder = prev_step_table.select(
            *columns,
            functions.Substring(col_field, step.start_index, (step.end_index - step.start_index) + 1).as_(
                step.new_column_name
            ),
        )
        return StepContext(query, columns + [step.new_column_name])

    def text(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "TextStep",
    ) -> StepContext:
        # Since we're using WITH...AS syntax, we add an explicit cast here to provide type
        # context to the engine. Without that, we might encounter "failed to find conversion
        # function from "unknown" to text" errors
        value = step.text

        if isinstance(value, datetime):
            # ValueWrapper(value) would produce an iso8601 string which
            # is not properly handled by some backends
            value_wrapped = self.VALUE_WRAPPER_CLS(value.strftime("%Y-%m-%d %H:%M:%S"))
        else:
            value_wrapped = self.VALUE_WRAPPER_CLS(value)

        if isinstance(value, datetime):
            value_wrapped = functions.Cast(value_wrapped, self.DATA_TYPE_MAPPING.datetime)
        elif isinstance(value, int):
            value_wrapped = functions.Cast(value_wrapped, self.DATA_TYPE_MAPPING.integer)
        elif isinstance(value, float):
            value_wrapped = functions.Cast(value_wrapped, self.DATA_TYPE_MAPPING.float)
        elif isinstance(value, bool):
            value_wrapped = functions.Cast(value_wrapped, self.DATA_TYPE_MAPPING.boolean)
        else:
            value_wrapped = functions.Cast(value_wrapped, self.DATA_TYPE_MAPPING.text)

        query = prev_step_table.select(*columns, value_wrapped.as_(step.new_column))
        return StepContext(query, columns + [step.new_column])

    def todate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "ToDateStep",
    ) -> StepContext:
        col_field: Field = prev_step_table[step.column]

        if step.format is not None:
            match self.TO_DATE_OP:
                case ToDateOp.STR_TO_DATE:
                    convert_fn = StrToDate
                case ToDateOp.PARSE_DATE:
                    convert_fn = ParseDate
                case ToDateOp.DATE_PARSE:
                    convert_fn = DateParse
                case ToDateOp.TIMESTAMP:
                    convert_fn = functions.Timestamp
                case ToDateOp.TO_TIMESTAMP_NTZ:
                    convert_fn = ToTimestampNTZ
                case ToDateOp.TO_TIMESTAMP:
                    convert_fn = ToTimestamp
                case ToDateOp.TO_DATE:
                    convert_fn = ToDate
                case _:
                    raise NotImplementedError(f"[{self.DIALECT}] todate has no set operator")
            date_selection = (
                self._cast_to_timestamp(convert_fn(col_field, self._adapt_date_format(step.format)))
                if convert_fn != ToDateOp.TIMESTAMP
                else convert_fn(col_field, self._adapt_date_format(step.format))
            )
        else:
            date_selection = self._cast_to_timestamp(col_field)

        query: QueryBuilder = prev_step_table.select(
            *(c for c in columns if c != step.column),
            date_selection.as_(col_field.name),
        )
        return StepContext(query, columns)

    def top(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "TopStep",
    ) -> StepContext:
        if step.groups:
            if self.SUPPORT_ROW_NUMBER:
                sub_query = prev_step_table.select(*columns)

                rank_on_field: Field = prev_step_table[step.rank_on]
                groups_fields: list[Field] = [prev_step_table[group] for group in step.groups]
                sub_query = sub_query.select(
                    RowNumber()
                    .over(*groups_fields)
                    .orderby(rank_on_field, order=Order.desc if step.sort == "desc" else Order.asc)
                    .as_("row_number")
                )
                query: QueryBuilder = (
                    self.QUERY_CLS.from_(sub_query)
                    .select(*columns)
                    .where(Field("row_number") <= step.limit)
                    # The order of returned results is not necessarily consistent. This ensures we
                    # always get the results in the same order
                    .orderby(*(Field(f) for f in step.groups + ["row_number"]), order=Order.asc)
                )
                return StepContext(query, columns)

            else:
                raise NotImplementedError(f"[{self.DIALECT}] top is not implemented with groups")

        query = (
            prev_step_table.select(*columns)
            .orderby(step.rank_on, order=Order.desc if step.sort == "desc" else Order.asc)
            .limit(step.limit)
        )
        return StepContext(query, columns)

    def trim(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "TrimStep",
    ) -> StepContext:
        col_fields = [prev_step_table[col] for col in step.columns]
        query = prev_step_table.select(
            *(c for c in columns if c not in step.columns),
            *(functions.Trim(col_field).as_(col_field.name) for col_field in col_fields),
        )
        return StepContext(query, columns)

    def uniquegroups(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "UniqueGroupsStep",
    ) -> StepContext:
        from weaverbird.pipeline.steps import AggregateStep

        return self.aggregate(
            step=AggregateStep(on=step.on, aggregations=[], keep_original_granularity=False),
            builder=builder,
            prev_step_table=prev_step_table,
            columns=columns,
        )

    @classmethod
    def _build_unpivot_col(
        cls,
        *,
        step: "UnpivotStep",
        quote_char: str | None,
        secondary_quote_char: str,
    ) -> str:
        value_col = format_quotes(step.value_column_name, quote_char)
        unpivot_col = format_quotes(step.unpivot_column_name, quote_char)
        in_cols = ", ".join(format_quotes(col, quote_char) for col in step.unpivot)

        if cls.SUPPORT_UNPIVOT:
            return f"UNPIVOT({value_col} FOR {unpivot_col} IN ({in_cols}))"
        in_single_quote_cols = ", ".join(format_quotes(col, secondary_quote_char) for col in step.unpivot)
        return f" t1 CROSS JOIN UNNEST(ARRAY[{in_single_quote_cols}], ARRAY[{in_cols}]) t2 ({unpivot_col}, {value_col})"

    def unpivot(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "UnpivotStep",
    ) -> StepContext:
        # Casting all columns to float first
        builder_ctx = self.__class__(
            tables_columns={prev_step_table.name: columns},
            # Since we're on a virtual table here (created by WITH...AS), we don't want a schema
            # name to be prepended
            db_schema=None,
            known_instances=self._known_instances,
        ).get_query_builder(
            steps=[
                DomainStep(domain=prev_step_table.name),
                ConvertStep(columns=step.unpivot, data_type="float"),
            ],
            query_builder=builder,
        )

        unpivot = self._build_unpivot_col(
            step=step,
            quote_char=builder.QUOTE_CHAR,
            secondary_quote_char=builder.SECONDARY_QUOTE_CHAR,
        )

        prev_step_table_name = builder_ctx.table_name

        cols = step.keep + [step.unpivot_column_name] + [step.value_column_name]
        query = LiteralValue(f"{self.QUERY_CLS.from_(prev_step_table_name).select(*cols)!s} {unpivot}")
        return StepContext(query, cols, builder_ctx.builder)

    def uppercase(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_table: FromTable,
        columns: list[str],
        step: "UppercaseStep",
    ) -> StepContext:
        col_field = prev_step_table[step.column]
        query: QueryBuilder = prev_step_table.select(
            *(c for c in columns if c != step.column), functions.Upper(col_field).as_(step.column)
        )
        return StepContext(query, columns)


class CountDistinct(functions.Count):
    def __init__(self, param: str | Field, alias: str | None = None) -> None:
        super().__init__(param, alias)
        self._distinct = True


class DateFormat(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("DATE_FORMAT", term, date_format, alias=alias)


# Of course GBQ must have a different name AND inverted arguments
class FormatDate(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("FORMAT_DATE", date_format, term, alias=alias)


class RowNumber(AnalyticFunction):
    def __init__(self, **kwargs: Any) -> None:
        super().__init__("ROW_NUMBER", **kwargs)


class StrToDate(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("STR_TO_DATE", term, date_format, alias=alias)


class ParseDate(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("PARSE_DATE", term, date_format, alias=alias)


class DateParse(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("DATE_PARSE", term, date_format, alias=alias)


class ToTimestampNTZ(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("TO_TIMESTAMP_NTZ", term, date_format, alias=alias)


class ToTimestamp(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("TO_TIMESTAMP", term, date_format, alias=alias)


class RegexpMatching(Comparator):
    similar_to = " SIMILAR TO "
    not_similar_to = " NOT SIMILAR TO "
    contains = " CONTAINS "
    not_contains = " NOT CONTAINS "
    regexp = " REGEXP "


def _compliant_regex(pattern: str, dialect: SQLDialect) -> str:
    """
    Like LIKE, the SIMILAR TO operator succeeds only if its pattern matches the entire string;
    this is unlike common regular expression behavior wherethe pattern
    can match any part of the string
    (see https://www.postgresql.org/docs/current/functions-matching.html#FUNCTIONS-SIMILARTO-REGEXP)

    For some special cases like googlebigquery or athena, we don't need to add
    those %
    """

    if dialect in (SQLDialect.ATHENA, SQLDialect.GOOGLEBIGQUERY):
        return f"{pattern}"
    elif dialect in (SQLDialect.SNOWFLAKE, SQLDialect.MYSQL):
        return f".*{pattern}.*"

    return f"%{pattern}%"
