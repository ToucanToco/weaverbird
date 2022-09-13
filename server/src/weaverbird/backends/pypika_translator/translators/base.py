from abc import ABC
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import cache
from typing import TYPE_CHECKING, Any, Literal, TypeVar, cast

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
from pypika.enums import Comparator, JoinType
from pypika.queries import QueryBuilder, Selectable
from pypika.terms import AnalyticFunction, BasicCriterion, LiteralValue, Term
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
from weaverbird.pipeline.steps.date_extract import DATE_INFO
from weaverbird.pipeline.steps.utils.combination import PipelineOrDomainNameOrReference, Reference

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
        ConvertStep,
        CustomSqlStep,
        DateExtractStep,
        DeleteStep,
        DomainStep,
        DuplicateStep,
        EvolutionStep,
        FillnaStep,
        FilterStep,
        FormulaStep,
        FromdateStep,
        IfthenelseStep,
        JoinStep,
        LowercaseStep,
        PercentageStep,
        RenameStep,
        ReplaceStep,
        SelectStep,
        SortStep,
        SplitStep,
        SubstringStep,
        TextStep,
        ToDateStep,
        TopStep,
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


@dataclass
class StepContext:
    selectable: Selectable | LiteralValue
    columns: list[str]
    builder: QueryBuilder | None = None

    def update_builder(self, builder: QueryBuilder, step_name: str) -> QueryBuilder:
        builder = builder if self.builder is None else self.builder
        return builder.with_(self.selectable, step_name)


@dataclass(kw_only=True)
class QueryBuilderContext:
    builder: QueryBuilder
    columns: list[str]
    table_name: str

    def materialize(self) -> QueryBuilder:
        return self.builder.from_(self.table_name).select(*self.columns)


class CustomQuery(AliasedQuery):
    def get_sql(self, **kwargs: Any) -> str:
        return cast(str, self.query)


class SQLTranslator(ABC):
    DIALECT: SQLDialect
    QUERY_CLS: Query
    DATA_TYPE_MAPPING: DataTypeMapping
    # supported extra functions
    SUPPORT_ROW_NUMBER: bool
    SUPPORT_SPLIT_PART: bool
    SUPPORT_UNPIVOT: bool = False
    # which operators should be used
    FROM_DATE_OP: FromDateOp
    REGEXP_OP: RegexOp
    TO_DATE_OP: ToDateOp
    EVOLUTION_DATE_UNIT: dict["EVOLUTION_TYPE", DATE_INFO] = {
        "vsLastYear": "year",
        "vsLastMonth": "month",
        "vsLastWeek": "week",
        "vsLastDay": "day",
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

    def __init_subclass__(cls) -> None:
        ALL_TRANSLATORS[cls.DIALECT] = cls

    @cache
    def _id(self: Self) -> str:
        if id(self) in self._known_instances:
            return self._known_instances[id(self)]
        if len(self._known_instances.keys()) == 0:
            id_ = self._known_instances[id(self)] = self.__class__.__name__.lower()
            return id_
        else:
            id_ = self.__class__.__name__.lower() + str(len(self._known_instances.keys()))
            self._known_instances[id(self)] = id_
            return id_

    def _step_name(self: Self) -> str:
        return f"__step_{self._step_count}_{self._id()}__"

    def _next_step_name(self: Self) -> str:
        name = self._step_name()
        self._step_count += 1
        return name

    def _step_context_from_first_step(self, step: "DomainStep | CustomSqlStep") -> StepContext:
        return (
            self._domain(step=step)
            if step.name == "domain"
            else StepContext(self._custom_query(step=step), ["*"])
        )

    def get_query_builder(
        self: Self,
        *,
        steps: Sequence["PipelineStep"],
        query_builder: QueryBuilder | None = None,
    ) -> QueryBuilderContext:
        if len(steps) < 0:
            ValueError("No steps provided")
        assert steps[0].name == "domain" or steps[0].name == "customsql"
        self._step_count = 0

        ctx = self._step_context_from_first_step(steps[0])
        table_name = self._next_step_name()
        builder = (query_builder if query_builder is not None else self.QUERY_CLS).with_(
            ctx.selectable, table_name
        )

        for step in steps[1:]:
            step_method: Callable[..., StepContext] | None = getattr(self, step.name, None)
            if step_method is None:
                raise NotImplementedError(f"[{self.DIALECT}] step {step.name} is not implemented")
            ctx = step_method(
                step=step, prev_step_name=table_name, builder=builder, columns=ctx.columns
            )
            table_name = self._next_step_name()
            builder = ctx.update_builder(builder=builder, step_name=table_name)
        return QueryBuilderContext(builder=builder, columns=ctx.columns, table_name=table_name)

    def get_query_str(self: Self, *, steps: Sequence["PipelineStep"]) -> str:
        return self.get_query_builder(steps=steps).materialize().get_sql()

    # All other methods implement step from https://weaverbird.toucantoco.com/docs/steps/,
    # the name of the method being the name of the step and the kwargs the rest of the params
    def _get_aggregate_function(
        self: Self, agg_function: "AggregateFn"
    ) -> type[functions.AggregateFunction] | None:
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

    def _get_window_function(
        self: Self, window_function: "AggregateFn"
    ) -> analytics.AnalyticFunction | None:
        match window_function:
            case "first":
                return analytics.FirstValue
            case "last":
                return analytics.LastValue
            case _:
                return None

    def absolutevalue(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "AbsoluteValueStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]
        query: "Selectable" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, functions.Abs(col_field).as_(step.new_column)
        )
        return StepContext(query, columns + [step.new_column])

    def aggregate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
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
                    *[
                        getattr(first_wq, col[1].alias)
                        for col in window_selected
                        if col[0] == min_window_index
                    ],
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

        for step_index, aggregation in enumerate(step.aggregations):
            if agg_fn := self._get_aggregate_function(aggregation.agg_function):
                for agg_column_name, new_column_name in zip(
                    aggregation.columns, aggregation.new_columns
                ):
                    column_field: Field = Table(prev_step_name)[agg_column_name]
                    new_agg_col = agg_fn(column_field).as_(new_column_name)
                    agg_selected.append(new_agg_col)

            elif window_fn := self._get_window_function(aggregation.agg_function):
                agg_cols: list[Field] = []
                for window_index, window_column_name in enumerate(aggregation.columns):
                    column_field = Table(prev_step_name)[window_column_name]
                    new_window_col = (
                        window_fn(column_field)
                        .over(*step.on)
                        .orderby(column_field)
                        .rows(analytics.Preceding(), analytics.Following())
                        .as_(aggregation.new_columns[window_index])
                    )

                    window_selected.append((step_index, new_window_col))
                    agg_cols.append(new_window_col)
                window_subquery_list.append(
                    self.QUERY_CLS.from_(prev_step_name)
                    .select(*step.on, *agg_cols)
                    .distinct()
                    .as_(f"wq{step_index}")
                )

            else:  # pragma: no cover
                raise NotImplementedError(
                    f"[{self.DIALECT}] Aggregation for {aggregation.agg_function!r} is not yet implemented"
                )
        if window_subquery_list and agg_selected:
            window_table = Table("window_subquery")
            all_windows_subquery = _build_window_subquery()
            agg_query = (
                self.QUERY_CLS.from_(prev_step_name)
                .select(*agg_selected, *step.on)
                .groupby(*step.on)
                .orderby(*step.on, order=Order.asc)
            ).as_("agg_subquery")
            agg_table = Table("agg_subquery")
            merged_selected: list[str | Field] = [
                *step.on,
                *[getattr(agg_table, col.alias) for col in agg_selected],
                *[getattr(window_table, col[1].alias) for col in window_selected],
            ]
            merged_query = (
                self.QUERY_CLS.from_(agg_query)
                .select(*merged_selected)
                .inner_join(all_windows_subquery)
                .on_field(*step.on)
            )
        elif agg_selected:
            selected_cols = [*step.on, *agg_selected]
            merged_query = (
                self.QUERY_CLS.from_(prev_step_name).select(*selected_cols).groupby(*step.on)
            )
        elif window_subquery_list:
            merged_query = _build_window_subquery()
        else:
            merged_query = self.QUERY_CLS.from_(prev_step_name).groupby(*step.on).select(*step.on)
        query: "QueryBuilder"
        selected_col_names: list[str]

        if step.keep_original_granularity:
            all_agg_col_names: list[str] = [x for agg in step.aggregations for x in agg.new_columns]
            query = (
                self.QUERY_CLS.from_(prev_step_name)
                .select(
                    *columns, *(Field(agg_col, table=merged_query) for agg_col in all_agg_col_names)
                )
                .left_join(merged_query)
                .on_field(*step.on)
            )
            selected_col_names = [*columns, *all_agg_col_names]
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

    def append(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "AppendStep",
    ) -> StepContext:
        pipelines = [
            self._pipeline_or_domain_name_or_reference_to_pipeline(pipeline)
            for pipeline in step.pipelines
        ]
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

        query = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, *(LiteralValue("NULL").as_(col) for col in columns_to_add)
        )
        for table, column_list in zip(tables, column_lists):
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
        prev_step_name: str,
        columns: list[str],
        step: "ArgmaxStep",
    ) -> StepContext:
        from weaverbird.pipeline.steps import TopStep

        return self.top(
            builder=builder,
            prev_step_name=prev_step_name,
            columns=columns,
            step=TopStep(rank_on=step.column, sort="desc", limit=1, groups=step.groups),
        )

    def argmin(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "ArgminStep",
    ) -> StepContext:
        from weaverbird.pipeline.steps import TopStep

        return self.top(
            builder=builder,
            prev_step_name=prev_step_name,
            columns=columns,
            step=TopStep(rank_on=step.column, sort="asc", limit=1, groups=step.groups),
        )

    def comparetext(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "CompareTextStep",
    ) -> StepContext:
        table = Table(prev_step_name)
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns,
            Case()
            .when(table[step.str_col_1] == table[step.str_col_2], True)
            .else_(False)
            .as_(step.new_column_name),
        )
        return StepContext(query, columns + [step.new_column_name])

    def concatenate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "ConcatenateStep",
    ) -> StepContext:
        # from step.columns = ["city", "age", "username"], step.separator = " -> "
        # create [Field("city"), " -> ", Field("age"), " -> ", Field("username")]
        the_table = Table(prev_step_name)
        tokens = [the_table[step.columns[0]]]
        for col in step.columns[1:]:
            tokens.append(step.separator)
            tokens.append(the_table[col])

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns,
            functions.Concat(*tokens).as_(step.new_column_name),
        )
        return StepContext(query, columns + [step.new_column_name])

    def convert(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "ConvertStep",
    ) -> StepContext:
        col_fields: list[Field] = [Table(prev_step_name)[col] for col in step.columns]
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *(c for c in columns if c not in step.columns),
            *(
                functions.Cast(col_field, getattr(self.DATA_TYPE_MAPPING, step.data_type)).as_(
                    col_field.name
                )
                for col_field in col_fields
            ),
        )
        return StepContext(query, columns)

    def _custom_query(
        self: Self, *, step: "CustomSqlStep", prev_step_name: str | None = None
    ) -> CustomQuery:
        table_name = prev_step_name or "_"
        return CustomQuery(
            name=f"custom_from_{table_name}",
            query=step.query.replace("##PREVIOUS_STEP##", table_name),
        )

    def customsql(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "CustomSqlStep",
    ) -> StepContext:
        """create a custom sql step based on the current table named ##PREVIOUS_STEP## in the query"""
        # we have no way to know which columns remain without actually executing the query
        return StepContext(self._custom_query(step=step), ["*"])

    @classmethod
    def _get_date_extract_func(cls, *, date_unit: DATE_INFO, target_column: Field) -> LiteralValue:
        # TODO to implement for other connectors than Snowflake
        raise NotImplementedError(f"[{cls.DIALECT}] _get_date_extract_func is not implemented")

    def dateextract(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "DateExtractStep",
    ) -> StepContext:
        date_col: Field = Table(prev_step_name)[step.column]
        extracted_dates: list[LiteralValue] = []

        for date_info, new_column_name in zip(step.date_info, step.new_columns):
            extracted_dates.append(
                self._get_date_extract_func(date_unit=date_info, target_column=date_col).as_(
                    new_column_name
                )
            )
        query: "Selectable" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, *extracted_dates
        )

        return StepContext(query, columns + [col.alias for col in extracted_dates])

    def delete(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "DeleteStep",
    ) -> StepContext:
        new_columns = [c for c in columns if c not in step.columns]
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(*new_columns)
        return StepContext(query, new_columns)

    # Prefixing domain with a '_', as it is a special case and should not be returned by
    # getattr(self, step_name)
    def _domain(self: Self, *, step: "DomainStep") -> StepContext:
        try:
            if isinstance(step.domain, Reference):
                raise NotImplementedError(f"[{self.DIALECT}] Cannot resolve a reference to a query")
            else:
                selected_cols = list(self._tables_columns[step.domain])
        except KeyError:
            selected_cols = ["*"]

        query: "QueryBuilder" = self.QUERY_CLS.from_(
            Table(step.domain, schema=self._db_schema)
        ).select(*selected_cols)
        if self._source_rows_subset:
            query = query.limit(self._source_rows_subset)
        return StepContext(query, selected_cols)

    def duplicate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "DuplicateStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, Table(prev_step_name)[step.column].as_(step.new_column_name)
        )
        return StepContext(query, columns + [step.new_column_name])

    @classmethod
    def _add_date(
        cls, *, date_column: Field, add_date_value: int, add_date_unit: DATE_INFO
    ) -> Term:
        raise NotImplementedError(f"[{cls.DIALECT}] _add_date is not implemented")

    def evolution(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "EvolutionStep",
    ) -> StepContext:

        prev_table = Table(prev_step_name)
        lagged_date = self._add_date(
            date_column=prev_table.field(step.date_col),
            add_date_value=1,
            add_date_unit=self.EVOLUTION_DATE_UNIT[step.evolution_type],
        ).as_(step.date_col)
        right_table = Table("right_table")
        new_col = step.new_column if step.new_column else "evol"
        query: "QueryBuilder" = (
            self.QUERY_CLS.from_(prev_step_name)
            .select(
                *[prev_table.field(col) for col in columns],
                (
                    prev_table.field(step.value_col) - right_table.field(step.value_col)
                    if step.evolution_format == "abs"
                    else prev_table.field(step.value_col) / right_table.field(step.value_col) - 1
                ).as_(new_col),
                *[prev_table.field(col).as_(f"left_table_{col}") for col in step.index_columns],
            )
            .left_join(
                self.QUERY_CLS.from_(prev_step_name)
                .select(
                    step.value_col,
                    lagged_date,
                    *step.index_columns,
                )
                .as_("right_table"),
            )
            .on_field(step.date_col, *step.index_columns)
            .orderby(step.date_col)
        )
        return StepContext(query, columns + [new_col])

    def fillna(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "FillnaStep",
    ) -> StepContext:
        the_table = Table(prev_step_name)
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *(c for c in columns if c not in step.columns),
            *(
                functions.Coalesce(the_table[col_name], step.value).as_(col_name)
                for col_name in step.columns
            ),
        )
        return StepContext(query, columns)

    @staticmethod
    def _cast_to_timestamp(value: str | datetime | Field | Term) -> functions.Function:
        return functions.Cast(value, "TIMESTAMP")

    def _get_single_condition_criterion(
        self: Self, condition: "SimpleCondition", prev_step_name: str
    ) -> Criterion:
        column_field: Field = Table(prev_step_name)[condition.column]

        match condition:
            case ComparisonCondition():
                import operator

                op = getattr(operator, condition.operator)
                return op(column_field, condition.value)

            case InclusionCondition():
                if condition.operator == "in":
                    return column_field.isin(condition.value)
                elif condition.operator == "nin":
                    return column_field.notin(condition.value)

            case MatchCondition():
                compliant_regex = _compliant_regex(condition.value, self.DIALECT)

                if condition.operator == "matches":
                    match self.REGEXP_OP:
                        case RegexOp.REGEXP:
                            return BasicCriterion(
                                RegexpMatching.regexp,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.SIMILAR_TO:
                            return BasicCriterion(
                                RegexpMatching.similar_to,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.CONTAINS:
                            return BasicCriterion(
                                RegexpMatching.contains,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_CONTAINS:
                            return functions.Function(
                                RegexOp.REGEXP_CONTAINS,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_LIKE:
                            return functions.Function(
                                RegexOp.REGEXP_LIKE,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_CONTAINS:
                            return functions.Function(
                                RegexOp.NOT_REGEXP_CONTAINS,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_LIKE:
                            return functions.Function(
                                RegexOp.NOT_REGEXP_LIKE,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case _:
                            raise NotImplementedError(
                                f"[{self.DIALECT}] doesn't have regexp operator"
                            )

                elif condition.operator == "notmatches":
                    match self.REGEXP_OP:
                        case RegexOp.REGEXP:
                            return column_field.regexp(condition.value).negate()
                        case RegexOp.SIMILAR_TO:
                            return BasicCriterion(
                                RegexpMatching.not_similar_to,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.CONTAINS:
                            return BasicCriterion(
                                RegexpMatching.not_contains,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_CONTAINS:
                            return functions.Function(
                                RegexOp.NOT_REGEXP_CONTAINS,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case RegexOp.REGEXP_LIKE:
                            return functions.Function(
                                RegexOp.NOT_REGEXP_LIKE,
                                column_field,
                                column_field.wrap_constant(compliant_regex),
                            )
                        case _:
                            raise NotImplementedError(
                                f"[{self.DIALECT}] doesn't have regexp operator"
                            )

            case NullCondition():
                if condition.operator == "isnull":
                    return column_field.isnull()
                elif condition.operator == "notnull":
                    return column_field.isnotnull()

            case DateBoundCondition():

                if isinstance(condition.value, (RelativeDate, datetime, str)):
                    if isinstance(condition.value, RelativeDate):
                        dt = evaluate_relative_date(condition.value)
                    elif isinstance(condition.value, datetime):
                        dt = condition.value
                    else:
                        dt = dateutil_parser.parse(condition.value)
                    dt = (
                        dt.replace(tzinfo=timezone.utc)
                        if dt.tzinfo is None
                        else dt.astimezone(timezone.utc)
                    )
                    value_to_compare = self._cast_to_timestamp(dt.strftime("%Y-%m-%d %H:%M:%S"))

                elif isinstance(condition.value, functions.Function):
                    value_to_compare = condition.value

                if condition.operator == "from":
                    return self._cast_to_timestamp(column_field) >= value_to_compare
                elif condition.operator == "until":
                    return self._cast_to_timestamp(column_field) <= value_to_compare

            case _:  # pragma: no cover
                raise KeyError(f"Operator {condition.operator!r} does not exist")

    def _get_filter_criterion(self: Self, condition: "Condition", prev_step_name: str) -> Criterion:
        from weaverbird.pipeline.conditions import ConditionComboAnd, ConditionComboOr

        match condition:
            case ConditionComboOr():
                return Criterion.any(
                    self._get_filter_criterion(condition, prev_step_name)
                    for condition in condition.or_
                )
            case ConditionComboAnd():
                return Criterion.all(
                    self._get_filter_criterion(condition, prev_step_name)
                    for condition in condition.and_
                )
            case _:
                return self._get_single_condition_criterion(condition, prev_step_name)

    def filter(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "FilterStep",
    ) -> StepContext:

        query: "QueryBuilder" = (
            self.QUERY_CLS.from_(prev_step_name)
            .select(*columns)
            .where(self._get_filter_criterion(step.condition, prev_step_name))
        )
        return StepContext(query, columns)

    def formula(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "FormulaStep",
    ) -> StepContext:
        formula = formula_to_term(step.formula, Table(prev_step_name))
        query = Query.from_(prev_step_name).select(*(columns), formula.as_(step.new_column))
        return StepContext(query, columns + [step.new_column])

    def fromdate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "FromdateStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]

        match self.FROM_DATE_OP:
            case FromDateOp.DATE_FORMAT:
                convert_fn = DateFormat
            case FromDateOp.TO_CHAR:
                convert_fn = functions.ToChar
            case _:
                raise NotImplementedError(f"[{self.DIALECT}] doesn't have from date operator")

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *(c for c in columns if c != step.column),
            convert_fn(col_field, step.format).as_(step.column),
        )
        return StepContext(query, columns)

    def _build_ifthenelse_case(
        self,
        *,
        if_: "Condition",
        then_: Any,
        else_: "Condition" | Any,
        prev_step_name: str,
        case_: Case,
        table: Table,
    ) -> Case:
        import json

        from weaverbird.pipeline.steps.ifthenelse import IfThenElse

        try:
            # if the value is a string
            then_value = json.loads(then_)
            case_ = case_.when(self._get_filter_criterion(if_, prev_step_name), then_value)
        except (json.JSONDecodeError, TypeError):
            # the value is a formula or a string literal that can't be parsed
            then_value = formula_to_term(then_, table)
            case_ = case_.when(
                self._get_filter_criterion(if_, prev_step_name), LiteralValue(then_value)
            )

        if isinstance(else_, IfThenElse):
            return self._build_ifthenelse_case(
                if_=else_.condition,
                then_=else_.then,
                else_=else_.else_value,
                prev_step_name=prev_step_name,
                case_=case_,
                table=table,
            )
        else:
            try:
                # the value is a string
                else_value = json.loads(else_)  # type: ignore
                return case_.else_(else_value)
            except (json.JSONDecodeError, TypeError):
                # the value is a formula or a string literal that can't be parsed
                else_value = formula_to_term(else_, table)  # type: ignore
                return case_.else_(else_value)

    def ifthenelse(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "IfthenelseStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns,
            self._build_ifthenelse_case(
                if_=step.condition,
                then_=step.then,
                else_=step.else_value,
                prev_step_name=prev_step_name,
                case_=Case(),
                table=Table(prev_step_name),
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
        prev_step_name: str,
        columns: list[str],
        step: "JoinStep",
    ) -> StepContext:
        steps = self._pipeline_or_domain_name_or_reference_to_pipeline(step.right_pipeline)

        right_builder_ctx = self.__class__(
            tables_columns=self._tables_columns,
            db_schema=self._db_schema_name,
            known_instances=self._known_instances,
        ).get_query_builder(steps=steps, query_builder=builder)
        left_table = Table(prev_step_name)
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

        query = (
            self.QUERY_CLS.from_(left_table)
            .select(*left_cols, *right_cols)
            .join(right_table, self._get_join_type(step.type))
            .on(
                Criterion.all(
                    Field(f[0], table=left_table) == Field(f[1], table=right_table) for f in step.on
                )
            )
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
        prev_step_name: str,
        columns: list[str],
        step: "LowercaseStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *(c for c in columns if c != step.column),
            functions.Lower(col_field).as_(step.column),
        )
        return StepContext(query, columns)

    def percentage(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "PercentageStep",
    ) -> StepContext:
        raise NotImplementedError(f"[{self.DIALECT}] percentage is not implemented")

    def rename(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
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

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(*selected_col_fields)
        return StepContext(query, [f.alias or f.name for f in selected_col_fields])

    def replace(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "ReplaceStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.search_column]

        # Do a nested `replace` to replace many values on the same column
        replaced_col = col_field
        for old_name, new_name in step.to_replace:
            replaced_col = functions.Replace(replaced_col, old_name, new_name)

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *(c for c in columns if c != step.search_column),
            replaced_col.as_(step.search_column),
        )

        return StepContext(query, columns)

    def select(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "SelectStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(*step.columns)
        return StepContext(query, step.columns)

    def sort(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "SortStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(*columns)

        for column_sort in step.columns:
            query = query.orderby(
                column_sort.column, order=Order.desc if column_sort.order == "desc" else Order.asc
            )

        return StepContext(query, columns)

    def split(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "SplitStep",
    ) -> StepContext:
        if self.SUPPORT_SPLIT_PART:
            col_field: Field = Table(prev_step_name)[step.column]
            new_cols = [f"{step.column}_{i + 1}" for i in range(step.number_cols_to_keep)]
            query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
                *columns,
                *(
                    functions.SplitPart(col_field, step.delimiter, i + 1).as_(new_cols[i])
                    for i in range(step.number_cols_to_keep)
                ),
            )
            return StepContext(query, columns + new_cols)

        raise NotImplementedError(f"[{self.DIALECT}] split is not implemented")

    def substring(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "SubstringStep",
    ) -> StepContext:
        step.new_column_name = (
            f"{step.column}_substr" if step.new_column_name is None else step.new_column_name
        )
        col_field: Field = Table(prev_step_name)[step.column]
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns,
            functions.Substring(
                col_field, step.start_index, (step.end_index - step.start_index) + 1
            ).as_(step.new_column_name),
        )
        return StepContext(query, columns + [step.new_column_name])

    def text(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "TextStep",
    ) -> StepContext:
        from pypika.terms import ValueWrapper

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, ValueWrapper(step.text).as_(step.new_column)
        )
        return StepContext(query, columns + [step.new_column])

    def todate(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "ToDateStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]

        if step.format is not None:
            match self.TO_DATE_OP:
                case ToDateOp.STR_TO_DATE:
                    convert_fn = StrToDate
                case ToDateOp.PARSE_DATE:
                    convert_fn = ParseDate
                case ToDateOp.TIMESTAMP:
                    convert_fn = functions.Timestamp
                case ToDateOp.TO_TIMESTAMP_NTZ:
                    convert_fn = ToTimestampNTZ
                case _:
                    raise NotImplementedError(f"[{self.DIALECT}] todate has no set operator")
            date_selection = (
                self._cast_to_timestamp(convert_fn(col_field, step.format))
                if convert_fn != ToDateOp.TIMESTAMP
                else convert_fn(col_field, step.format)
            )
        else:
            date_selection = self._cast_to_timestamp(col_field)

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *(c for c in columns if c != step.column),
            date_selection.as_(col_field.name),
        )
        return StepContext(query, columns)

    def top(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "TopStep",
    ) -> StepContext:
        if step.groups:
            if self.SUPPORT_ROW_NUMBER:
                sub_query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(*columns)

                the_table = Table(prev_step_name)
                rank_on_field: Field = the_table[step.rank_on]
                groups_fields: list[Field] = [the_table[group] for group in step.groups]
                sub_query = sub_query.select(
                    RowNumber()
                    .over(*groups_fields)
                    .orderby(rank_on_field, order=Order.desc if step.sort == "desc" else Order.asc)
                    .as_("row_number")
                )
                query: "QueryBuilder" = (
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
            self.QUERY_CLS.from_(prev_step_name)
            .select(*columns)
            .orderby(step.rank_on, order=Order.desc if step.sort == "desc" else Order.asc)
            .limit(step.limit)
        )
        return StepContext(query, columns)

    def trim(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "TrimStep",
    ) -> StepContext:
        col_fields: list[Field] = [Table(prev_step_name)[col] for col in step.columns]
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *(c for c in columns if c not in step.columns),
            *(functions.Trim(col_field).as_(col_field.name) for col_field in col_fields),
        )
        return StepContext(query, columns)

    def uniquegroups(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "UniqueGroupsStep",
    ) -> StepContext:
        from weaverbird.pipeline.steps import AggregateStep

        return self.aggregate(
            step=AggregateStep(on=step.on, aggregations=[], keep_original_granularity=False),
            builder=builder,
            prev_step_name=prev_step_name,
            columns=columns,
        )

    @classmethod
    def _build_unpivot_col(
        cls, *, step: "UnpivotStep", quote_char: str | None, secondary_quote_char: str
    ) -> str:
        value_col = format_quotes(step.value_column_name, quote_char)
        unpivot_col = format_quotes(step.unpivot_column_name, quote_char)
        in_cols = ", ".join(format_quotes(col, quote_char) for col in step.unpivot)
        if cls.SUPPORT_UNPIVOT:
            return f"UNPIVOT({value_col} FOR {unpivot_col} IN ({in_cols}))"
        in_single_quote_cols = ", ".join(
            format_quotes(col, secondary_quote_char) for col in step.unpivot
        )
        return f" t1 CROSS JOIN UNNEST(ARRAY[{in_single_quote_cols}], ARRAY[{in_cols}]) t2 ({unpivot_col}, {value_col})"

    def unpivot(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "UnpivotStep",
    ) -> StepContext:
        unpivot = self._build_unpivot_col(
            step=step,
            quote_char=builder.QUOTE_CHAR,
            secondary_quote_char=builder.SECONDARY_QUOTE_CHAR,
        )
        cols = step.keep + [step.unpivot_column_name] + [step.value_column_name]
        query = LiteralValue(f"{self.QUERY_CLS.from_(prev_step_name).select(*cols)!s} {unpivot}")
        return StepContext(query, cols)

    def uppercase(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "UppercaseStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *(c for c in columns if c != step.column),
            functions.Upper(col_field).as_(step.column),
        )
        return StepContext(query, columns)


class CountDistinct(functions.Count):
    def __init__(self, param: str | Field, alias: str | None = None) -> None:
        super().__init__(param, alias)
        self._distinct = True


class DateFormat(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("DATE_FORMAT", term, date_format, alias=alias)


class RowNumber(AnalyticFunction):
    def __init__(self, **kwargs: Any) -> None:
        super().__init__("ROW_NUMBER", **kwargs)


class StrToDate(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("STR_TO_DATE", term, date_format, alias=alias)


class ParseDate(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("PARSE_DATE", term, date_format, alias=alias)


class ToTimestampNTZ(functions.Function):
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("TO_TIMESTAMP_NTZ", term, date_format, alias=alias)


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
