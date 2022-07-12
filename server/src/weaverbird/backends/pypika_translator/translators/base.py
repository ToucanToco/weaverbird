from abc import ABC
from dataclasses import dataclass
from functools import cache
from typing import TYPE_CHECKING, Any, Callable, Literal, Mapping, Sequence, TypeVar, Union, cast

from pypika import AliasedQuery, Case, Criterion, Field, Order, Query, Schema, Table, functions
from pypika.enums import Comparator, JoinType
from pypika.queries import QueryBuilder, Selectable
from pypika.terms import AnalyticFunction, BasicCriterion, LiteralValue

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators import ALL_TRANSLATORS
from weaverbird.backends.sql_translator.steps.utils.query_transformation import handle_zero_division
from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    DateBoundCondition,
    InclusionCondition,
    MatchCondition,
    NullCondition,
)
from weaverbird.pipeline.pipeline import Pipeline
from weaverbird.pipeline.steps.utils.combination import Reference

Self = TypeVar("Self", bound="SQLTranslator")


if TYPE_CHECKING:

    from weaverbird.pipeline import PipelineStep
    from weaverbird.pipeline.conditions import Condition, SimpleCondition
    from weaverbird.pipeline.steps import (
        AbsoluteValueStep,
        AggregateStep,
        ArgmaxStep,
        ArgminStep,
        CompareTextStep,
        ConcatenateStep,
        ConvertStep,
        CustomSqlStep,
        DeleteStep,
        DomainStep,
        DuplicateStep,
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
        UppercaseStep,
    )
    from weaverbird.pipeline.steps.aggregate import AggregateFn


@dataclass(kw_only=True)
class DataTypeMapping:
    boolean: str
    date: str
    float: str
    integer: str
    text: str


@dataclass
class StepContext:
    selectable: Selectable
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


class CustomQuery(AliasedQuery):  # type: ignore[misc]
    def get_sql(self, **kwargs: Any) -> str:
        return cast(str, self.query)


class SQLTranslator(ABC):
    DIALECT: SQLDialect
    QUERY_CLS: Query
    DATA_TYPE_MAPPING: DataTypeMapping
    # supported extra functions
    SUPPORT_ROW_NUMBER: bool
    SUPPORT_SPLIT_PART: bool
    # which operators should be used
    FROM_DATE_OP: FromDateOp
    REGEXP_OP: RegexOp
    TO_DATE_OP: ToDateOp

    def __init__(
        self: Self,
        *,
        tables_columns: Mapping[str, Sequence[str]] | None = None,
        db_schema: str | None = None,
    ) -> None:
        self._tables_columns: Mapping[str, Sequence[str]] = tables_columns or {}
        self._db_schema_name = db_schema
        self._db_schema: Schema | None = Schema(db_schema) if db_schema is not None else None
        self._i = 0

    def __init_subclass__(cls) -> None:
        ALL_TRANSLATORS[cls.DIALECT] = cls

    @cache
    def _id(self: Self) -> str:
        return str(id(self))

    def _step_name(self: Self) -> str:
        return f'__step_{self._i}_{self._id()}__'

    def _next_step_name(self: Self) -> str:
        name = self._step_name()
        self._i += 1
        return name

    def _step_context_from_first_step(
        self, step: Union['DomainStep', 'CustomSqlStep']
    ) -> StepContext:
        return (
            self._domain(step=step)
            if step.name == 'domain'
            else StepContext(self._custom_query(step=step), ['*'])
        )

    def get_query_builder(
        self: Self,
        *,
        steps: Sequence["PipelineStep"],
        query_builder: QueryBuilder | None = None,
    ) -> QueryBuilderContext:
        if len(steps) < 0:
            ValueError('No steps provided')
        assert steps[0].name == "domain" or steps[0].name == "customsql"
        self._i = 0

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
    ) -> type[functions.AggregateFunction]:
        match agg_function:
            # Commenting this since postgres and redshift
            # doesn't support it
            # case "first":
            #     return functions.First
            # case "last":
            #     return functions.Last
            # case "abs":
            #     return functions.Abs
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
            case _:  # pragma: no cover
                raise NotImplementedError(
                    f"[{self.DIALECT}] Aggregation for {agg_function!r} is not yet implemented"
                )

    def absolutevalue(
        self: Self,
        *,
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "AggregateStep",
    ) -> StepContext:
        agg_selected: list[Field] = []

        for aggregation in step.aggregations:
            agg_fn = self._get_aggregate_function(aggregation.agg_function)
            for i, column_name in enumerate(aggregation.columns):
                column_field: Field = Table(prev_step_name)[column_name]
                new_agg_col = agg_fn(column_field).as_(aggregation.new_columns[i])
                agg_selected.append(new_agg_col)

        query: "QueryBuilder"
        selected_col_names: list[str]

        if step.keep_original_granularity:
            agg_query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
                *step.on, *agg_selected
            )
            agg_query = agg_query.groupby(*step.on)

            all_agg_col_names: list[str] = [x for agg in step.aggregations for x in agg.new_columns]

            query = (
                self.QUERY_CLS.from_(prev_step_name)
                .select(
                    *columns, *(Field(agg_col, table=agg_query) for agg_col in all_agg_col_names)
                )
                .left_join(agg_query)
                .on_field(*step.on)
            )

            selected_col_names = [*columns, *all_agg_col_names]
            return StepContext(query, selected_col_names)

        else:
            selected_cols: list[str | Field] = [*step.on, *agg_selected]
            selected_col_names = [*step.on, *(f.alias for f in agg_selected)]
            return StepContext(
                self.QUERY_CLS.from_(prev_step_name)
                .select(*selected_cols)
                .groupby(*step.on)
                .orderby(*step.on, order=Order.asc),
                selected_col_names,
            )

    def argmax(
        self: Self,
        *,
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
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
        self: Self, *, step: 'CustomSqlStep', prev_step_name: str | None = None
    ) -> CustomQuery:
        table_name = prev_step_name or '_'
        return CustomQuery(
            name=f"custom_from_{table_name}",
            query=step.query.replace("##PREVIOUS_STEP##", table_name),
        )

    def customsql(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "CustomSqlStep",
    ) -> StepContext:
        """create a custom sql step based on the current table named ##PREVIOUS_STEP## in the query"""
        # we have no way to know which columns remain without actually executing the query
        return StepContext(self._custom_query(step=step), ["*"])

    def delete(
        self: Self,
        *,
        builder: 'QueryBuilder',
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
        return StepContext(query, selected_cols)

    def duplicate(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "DuplicateStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, Table(prev_step_name)[step.column].as_(step.new_column_name)
        )
        return StepContext(query, columns + [step.new_column_name])

    def fillna(
        self: Self,
        *,
        builder: 'QueryBuilder',
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

                if condition.operator == "matches":
                    match self.REGEXP_OP:
                        case RegexOp.REGEXP:
                            return column_field.regexp(condition.value)
                        case RegexOp.SIMILAR_TO:
                            return BasicCriterion(
                                RegexpMatching.similar_to,
                                column_field,
                                column_field.wrap_constant(_compliant_regex(condition.value)),
                            )
                        case RegexOp.CONTAINS:
                            return BasicCriterion(
                                RegexpMatching.contains,
                                column_field,
                                column_field.wrap_constant(_compliant_regex(condition.value)),
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
                                column_field.wrap_constant(_compliant_regex(condition.value)),
                            )
                        case RegexOp.CONTAINS:
                            return BasicCriterion(
                                RegexpMatching.not_contains,
                                column_field,
                                column_field.wrap_constant(_compliant_regex(condition.value)),
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
                if condition.operator == "from":
                    return column_field <= condition.value
                elif condition.operator == "until":
                    return column_field >= condition.value

            case _:  # pragma: no cover
                raise KeyError(f"Operator {condition.operator!r} does not exist")

    def _get_filter_criterion(self: Self, condition: "Condition", prev_step_name: str) -> Criterion:
        from weaverbird.pipeline.conditions import ConditionComboAnd, ConditionComboOr

        match condition:
            case ConditionComboOr():
                return Criterion.any(
                    (
                        self._get_filter_criterion(condition, prev_step_name)
                        for condition in condition.or_
                    )
                )
            case ConditionComboAnd():
                return Criterion.all(
                    (
                        self._get_filter_criterion(condition, prev_step_name)
                        for condition in condition.and_
                    )
                )
            case _:
                return self._get_single_condition_criterion(condition, prev_step_name)

    def filter(
        self: Self,
        *,
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "FormulaStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(*columns)
        # TODO: support
        # - float casting with divisions
        # - whitespaces in column names
        # - strings
        # To do that we probably need to parse the formula with tokens
        # In the end we should be able to translate:
        #   [my age] + 1 / 2
        # into
        #   CAST("my age" AS float) + 1 / 2

        query = query.select(LiteralValue(handle_zero_division(step.formula)).as_(step.new_column))

        return StepContext(query, columns + [step.new_column])

    def fromdate(
        self: Self,
        *,
        builder: 'QueryBuilder',
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
    ) -> Case:
        import json

        from weaverbird.pipeline.steps.ifthenelse import IfThenElse

        try:
            # if the value is a string
            then_value = json.loads(then_)
            case_ = case_.when(self._get_filter_criterion(if_, prev_step_name), then_value)
        except (json.JSONDecodeError, TypeError):
            # the value is a formula
            then_value = then_
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
            )
        else:
            try:
                # the value is a string
                else_value = json.loads(else_)  # type: ignore
                return case_.else_(else_value)
            except (json.JSONDecodeError, TypeError):
                # the value is a formula
                else_value = else_
                return case_.else_(LiteralValue(else_value))

    def ifthenelse(
        self: Self,
        *,
        builder: 'QueryBuilder',
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
            ).as_(step.new_column),
        )

        return StepContext(query, columns + [step.new_column])

    @staticmethod
    def _get_join_type(join_type: Literal['left', 'inner', 'left outer']) -> JoinType:
        match join_type:
            case 'left':
                return JoinType.left
            case 'left outer':
                return JoinType.left_outer
            case 'inner':
                return JoinType.inner

    @staticmethod
    def _field_list_to_name_list(fields: list[Field]) -> list[str]:
        return [field.alias or field.name for field in fields]

    def join(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "JoinStep",
    ) -> StepContext:
        try:
            steps = Pipeline(steps=step.right_pipeline).steps
        except Exception as exc:
            raise NotImplementedError(
                f"join is only possible with another pipeline: {exc}"
            ) from exc
        right_builder_ctx = self.__class__(
            tables_columns=self._tables_columns, db_schema=self._db_schema_name
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
            while (alias := f'{alias}_right') in all_cols:
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
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "PercentageStep",
    ) -> StepContext:
        raise NotImplementedError(f"[{self.DIALECT}] percentage is not implemented")

    def rename(
        self: Self,
        *,
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "SelectStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(*step.columns)
        return StepContext(query, step.columns)

    def sort(
        self: Self,
        *,
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "SplitStep",
    ) -> StepContext:
        if self.SUPPORT_SPLIT_PART:
            col_field: Field = Table(prev_step_name)[step.column]
            new_cols = [f"{step.column}_{i+1}" for i in range(step.number_cols_to_keep)]
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
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "ToDateStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]

        if step.format is not None:
            match self.TO_DATE_OP:
                case ToDateOp.TO_DATE:
                    convert_fn = functions.ToDate
                case ToDateOp.STR_TO_DATE:
                    convert_fn = StrToDate
                case ToDateOp.PARSE_DATE:
                    convert_fn = ParseDate
                case _:
                    raise NotImplementedError(f"[{self.DIALECT}] todate has no set operator")
            date_selection = convert_fn(col_field, step.format)
        else:
            date_selection = functions.Cast(col_field, self.DATA_TYPE_MAPPING.date)

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *(c for c in columns if c != step.column),
            date_selection.as_(col_field.name),
        )
        return StepContext(query, columns)

    def top(
        self: Self,
        *,
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
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
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "UniqueGroupsStep",
    ) -> StepContext:
        from weaverbird.pipeline.steps import AggregateStep

        return self.aggregate(
            step=AggregateStep(on=step.on, aggregations=[], keepOriginalGranularity=False),
            builder=builder,
            prev_step_name=prev_step_name,
            columns=columns,
        )

    def uppercase(
        self: Self,
        *,
        builder: 'QueryBuilder',
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


class CountDistinct(functions.Count):  # type: ignore[misc]
    def __init__(self, param: str | Field, alias: str | None = None) -> None:
        super().__init__(param, alias)
        self._distinct = True


class DateFormat(functions.Function):  # type: ignore[misc]
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("DATE_FORMAT", term, date_format, alias=alias)


class RowNumber(AnalyticFunction):  # type: ignore[misc]
    def __init__(self, **kwargs: Any) -> None:
        super().__init__("ROW_NUMBER", **kwargs)


class StrToDate(functions.Function):  # type: ignore[misc]
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("STR_TO_DATE", term, date_format, alias=alias)


class ParseDate(functions.Function):  # type: ignore[misc]
    def __init__(self, term: str | Field, date_format: str, alias: str | None = None) -> None:
        super().__init__("PARSE_DATE", term, date_format, alias=alias)


class RegexpMatching(Comparator):  # type: ignore[misc]
    similar_to = " SIMILAR TO "
    not_similar_to = " NOT SIMILAR TO "
    contains = " CONTAINS "
    not_contains = " NOT CONTAINS "


def _compliant_regex(pattern: str) -> str:
    """
    Like LIKE, the SIMILAR TO operator succeeds only if its pattern matches the entire string;
    this is unlike common regular expression behavior wherethe pattern
    can match any part of the string
    (see https://www.postgresql.org/docs/current/functions-matching.html#FUNCTIONS-SIMILARTO-REGEXP)
    """
    return f"%{pattern}%"
