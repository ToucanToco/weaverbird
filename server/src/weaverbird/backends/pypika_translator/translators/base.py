from abc import ABC
from dataclasses import dataclass

# from typing_extensions import Self
from typing import TYPE_CHECKING, Any, Callable, Mapping, Sequence, TypeVar, cast

from pypika import AliasedQuery, Case, Criterion, Field, Order, Query, Schema, Table, functions
from pypika.enums import Comparator
from pypika.terms import AnalyticFunction, BasicCriterion, LiteralValue

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators import ALL_TRANSLATORS
from weaverbird.exceptions import MissingTableNameError
from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    DateBoundCondition,
    InclusionCondition,
    MatchCondition,
    NullCondition,
)
from weaverbird.pipeline.steps.utils.combination import Reference

Self = TypeVar("Self", bound="SQLTranslator")


if TYPE_CHECKING:
    from pypika.queries import QueryBuilder

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
class StepTable:
    columns: list[str]
    name: str | None = None


@dataclass(kw_only=True)
class DataTypeMapping:
    boolean: str
    date: str
    float: str
    integer: str
    text: str


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
        self._db_schema: Schema | None = Schema(db_schema) if db_schema is not None else None

    def __init_subclass__(cls) -> None:
        ALL_TRANSLATORS[cls.DIALECT] = cls

    def get_query(self: Self, *, steps: Sequence["PipelineStep"]) -> "QueryBuilder":
        step_queries: list["QueryBuilder"] = []
        step_tables: list[StepTable] = []

        for i, step in enumerate(steps):
            try:
                step_method: Callable[..., tuple["QueryBuilder", StepTable]] = getattr(
                    self, step.name
                )
            except AttributeError:
                raise NotImplementedError(f"[{self.DIALECT}] step {step.name} not yet implemented")

            if i == 0:
                assert step.name == "domain" or step.name == "customsql"
                if step.name == "domain":
                    step_query, step_table = step_method(step=step)
                elif step.name == "customsql":
                    step_query, step_table = step_method(
                        step=step, table=StepTable(name="_", columns=["*"])
                    )
            else:
                step_query, step_table = step_method(step=step, table=step_tables[i - 1])

            step_queries.append(step_query)
            step_table.name = f"__step_{i}__"
            step_tables.append(step_table)

        query: "QueryBuilder" = self.QUERY_CLS
        for i, step_query in enumerate(step_queries):
            query = query.with_(step_query, step_tables[i].name)

        return query.from_(step_tables[-1].name).select("*")

    def get_query_str(self: Self, *, steps: Sequence["PipelineStep"]) -> str:
        query_str: str = self.get_query(steps=steps).get_sql()
        return query_str

    # All other methods implement step from https://weaverbird.toucantoco.com/docs/steps/,
    # the name of the method being the name of the step and the kwargs the rest of the params
    def _get_aggregate_function(
        self: Self, agg_function: "AggregateFn"
    ) -> functions.AggregateFunction:
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
        self: Self, *, step: "AbsoluteValueStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        col_field: Field = Table(table.name)[step.column]
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *table.columns,
            functions.Abs(col_field).as_(step.new_column),
        )
        return query, StepTable(columns=[*table.columns, step.new_column])

    def aggregate(
        self: Self, *, step: "AggregateStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        the_table = Table(table.name)
        agg_selected: list[Field] = []

        for aggregation in step.aggregations:
            agg_fn = self._get_aggregate_function(aggregation.agg_function)
            for i, column_name in enumerate(aggregation.columns):
                column_field: Field = the_table[column_name]
                new_agg_col = agg_fn(column_field).as_(aggregation.new_columns[i])
                agg_selected.append(new_agg_col)

        query: "QueryBuilder"
        selected_col_names: list[str]

        if step.keep_original_granularity:
            current_query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(*table.columns)

            agg_query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
                *step.on, *agg_selected
            )
            agg_query = agg_query.groupby(*step.on)

            all_agg_col_names: list[str] = [x for agg in step.aggregations for x in agg.new_columns]

            query = (
                self.QUERY_CLS.from_(current_query)
                .select(
                    *table.columns,
                    *(Field(agg_col, table=agg_query) for agg_col in all_agg_col_names),
                )
                .left_join(agg_query)
                .on_field(*step.on)
            )
            selected_col_names = [*table.columns, *all_agg_col_names]

        else:
            selected_cols: list[str | Field] = [*step.on, *agg_selected]
            selected_col_names = [*step.on, *(f.alias for f in agg_selected)]
            query = (
                self.QUERY_CLS.from_(table.name)
                .select(*selected_cols)
                .groupby(*step.on)
                .orderby(*step.on, order=Order.asc)
            )

        return query, StepTable(columns=selected_col_names)

    def argmax(
        self: Self, *, step: "ArgmaxStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        from weaverbird.pipeline.steps import TopStep

        return self.top(
            step=TopStep(rank_on=step.column, sort="desc", limit=1, groups=step.groups), table=table
        )

    def argmin(
        self: Self, *, step: "ArgminStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        from weaverbird.pipeline.steps import TopStep

        return self.top(
            step=TopStep(rank_on=step.column, sort="asc", limit=1, groups=step.groups), table=table
        )

    def comparetext(
        self: Self, *, step: "CompareTextStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *table.columns,
            Case()
            .when(Table(table.name)[step.str_col_1] == Table(table.name)[step.str_col_2], True)
            .else_(False)
            .as_(step.new_column_name),
        )
        return query, StepTable(columns=[*table.columns, step.new_column_name])

    def concatenate(
        self: Self, *, step: "ConcatenateStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        # from step.columns = ["city", "age", "username"], step.separator = " -> "
        # create [Field("city"), " -> ", Field("age"), " -> ", Field("username")]
        the_table = Table(table.name)
        tokens = [the_table[step.columns[0]]]
        for col in step.columns[1:]:
            tokens.append(step.separator)
            tokens.append(the_table[col])

        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *table.columns,
            functions.Concat(*tokens).as_(step.new_column_name),
        )
        return query, StepTable(columns=[*table.columns, step.new_column_name])

    def convert(
        self: Self, *, step: "ConvertStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        col_fields: list[Field] = [Table(table.name)[col] for col in step.columns]
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *(c for c in table.columns if c not in step.columns),
            *(
                functions.Cast(col_field, getattr(self.DATA_TYPE_MAPPING, step.data_type)).as_(
                    col_field.name
                )
                for col_field in col_fields
            ),
        )
        return query, StepTable(columns=table.columns)

    def customsql(
        self: Self, *, step: "CustomSqlStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        """create a custom sql step based on the current table named ##PREVIOUS_STEP## in the query"""

        if table.name is None:
            raise MissingTableNameError()

        custom_query = CustomQuery(
            name=f"custom_from_{table.name}",
            query=step.query.replace("##PREVIOUS_STEP##", table.name),
        )

        # we now have no way to know which columns remain
        # without actually executing the query
        return custom_query, StepTable(columns=["*"])

    def delete(
        self: Self, *, step: "DeleteStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        new_columns = [c for c in table.columns if c not in step.columns]
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(*new_columns)
        return query, StepTable(columns=new_columns)

    def domain(
        self: Self,
        *,
        step: "DomainStep",
    ) -> tuple["QueryBuilder", StepTable]:
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
        return query, StepTable(columns=selected_cols)

    def duplicate(
        self: Self, *, step: "DuplicateStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *table.columns, Table(table.name)[step.column].as_(step.new_column_name)
        )
        return query, StepTable(columns=[*table.columns, step.new_column_name])

    def fillna(
        self: Self, *, step: "FillnaStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        the_table = Table(table.name)
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *(c for c in table.columns if c not in step.columns),
            *(
                functions.Coalesce(the_table[col_name], step.value).as_(col_name)
                for col_name in step.columns
            ),
        )
        return query, StepTable(columns=table.columns)

    def _get_single_condition_criterion(
        self: Self, condition: "SimpleCondition", table: StepTable
    ) -> Criterion:
        column_field: Field = Table(table.name)[condition.column]

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

    def _get_filter_criterion(self: Self, condition: "Condition", table: StepTable) -> Criterion:
        from weaverbird.pipeline.conditions import ConditionComboAnd, ConditionComboOr

        match condition:
            case ConditionComboOr():
                return Criterion.any(
                    (self._get_filter_criterion(condition, table) for condition in condition.or_)
                )
            case ConditionComboAnd():
                return Criterion.all(
                    (self._get_filter_criterion(condition, table) for condition in condition.and_)
                )
            case _:
                return self._get_single_condition_criterion(condition, table)

    def filter(
        self: Self, *, step: "FilterStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        query: "QueryBuilder" = (
            self.QUERY_CLS.from_(table.name)
            .select(*table.columns)
            .where(self._get_filter_criterion(step.condition, table))
        )
        return query, StepTable(columns=table.columns)

    def formula(
        self: Self, *, step: "FormulaStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(*table.columns)
        # TODO: support
        # - float casting with divisions
        # - whitespaces in column names
        # - strings
        # To do that we probably need to parse the formula with tokens
        # In the end we should be able to translate:
        #   [my age] + 1 / 2
        # into
        #   CAST("my age" AS float) + 1 / 2

        query = query.select(LiteralValue(step.formula).as_(step.new_column))
        return query, StepTable(columns=[*table.columns, step.new_column])

    def fromdate(
        self: Self, *, step: "FromdateStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        col_field: Field = Table(table.name)[step.column]

        match self.FROM_DATE_OP:
            case FromDateOp.DATE_FORMAT:
                convert_fn = DateFormat
            case FromDateOp.TO_CHAR:
                convert_fn = functions.ToChar
            case _:
                raise NotImplementedError(f"[{self.DIALECT}] doesn't have from date operator")

        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *(c for c in table.columns if c != step.column),
            convert_fn(col_field, step.format).as_(step.column),
        )
        return query, StepTable(columns=table.columns)

    def _build_ifthenelse_case(
        self,
        *,
        if_: "Condition",
        then_: Any,
        else_: "Condition" | Any,
        table: StepTable,
        case: Case,
    ) -> Case:
        import json

        from weaverbird.pipeline.steps.ifthenelse import IfThenElse

        try:
            # if the value is a string
            then_value = json.loads(then_)
            case = case.when(self._get_filter_criterion(if_, table), then_value)
        except (json.JSONDecodeError, TypeError):
            # the value is a formula
            then_value = then_
            case = case.when(self._get_filter_criterion(if_, table), LiteralValue(then_value))

        if isinstance(else_, IfThenElse):
            return self._build_ifthenelse_case(
                if_=else_.condition,
                then_=else_.then,
                else_=else_.else_value,
                table=table,
                case=case,
            )
        else:
            try:
                # the value is a string
                else_value = json.loads(else_)  # type: ignore
                return case.else_(else_value)
            except (json.JSONDecodeError, TypeError):
                # the value is a formula
                else_value = else_
                return case.else_(LiteralValue(else_value))

    def ifthenelse(
        self: Self, *, step: "IfthenelseStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *table.columns,
            self._build_ifthenelse_case(
                if_=step.condition, then_=step.then, else_=step.else_value, table=table, case=Case()
            ).as_(step.new_column),
        )

        return query, StepTable(columns=[*table.columns, step.new_column])

    def lowercase(
        self: Self, *, step: "LowercaseStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        col_field: Field = Table(table.name)[step.column]
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *(c for c in table.columns if c != step.column),
            functions.Lower(col_field).as_(step.column),
        )
        return query, StepTable(columns=table.columns)

    def percentage(
        self: Self, *, step: "PercentageStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        raise NotImplementedError(f"[{self.DIALECT}] percentage is not implemented")

    def rename(
        self: Self, *, step: "RenameStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        new_names_mapping: dict[str, str] = dict(step.to_rename)

        selected_col_fields: list[Field] = []

        for col_name in table.columns:
            if col_name in new_names_mapping:
                selected_col_fields.append(Field(name=col_name, alias=new_names_mapping[col_name]))
            else:
                selected_col_fields.append(Field(name=col_name))

        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(*selected_col_fields)
        return query, StepTable(columns=[f.alias or f.name for f in selected_col_fields])

    def replace(
        self: Self, *, step: "ReplaceStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        col_field: Field = Table(table.name)[step.search_column]

        # Do a nested `replace` to replace many values on the same column
        replaced_col = col_field
        for old_name, new_name in step.to_replace:
            replaced_col = functions.Replace(replaced_col, old_name, new_name)

        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *(c for c in table.columns if c != step.search_column),
            replaced_col.as_(step.search_column),
        )

        return query, StepTable(columns=table.columns)

    def select(
        self: Self, *, step: "SelectStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(*step.columns)
        return query, StepTable(columns=step.columns)

    def sort(self: Self, *, step: "SortStep", table: StepTable) -> tuple["QueryBuilder", StepTable]:
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(*table.columns)

        for column_sort in step.columns:
            query = query.orderby(
                column_sort.column, order=Order.desc if column_sort.order == "desc" else Order.asc
            )

        return query, StepTable(columns=table.columns)

    def split(
        self: Self, *, step: "SplitStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        if self.SUPPORT_SPLIT_PART:
            col_field: Field = Table(table.name)[step.column]
            new_cols = [f"{step.column}_{i+1}" for i in range(step.number_cols_to_keep)]
            query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
                *table.columns,
                *(
                    functions.SplitPart(col_field, step.delimiter, i + 1).as_(new_cols[i])
                    for i in range(step.number_cols_to_keep)
                ),
            )
            return query, StepTable(columns=[*table.columns, *new_cols])

        raise NotImplementedError(f"[{self.DIALECT}] split is not implemented")

    def substring(
        self: Self, *, step: "SubstringStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        step.new_column_name = (
            f"{step.column}_substr" if step.new_column_name is None else step.new_column_name
        )
        col_field: Field = Table(table.name)[step.column]
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *table.columns,
            functions.Substring(
                col_field, step.start_index, (step.end_index - step.start_index) + 1
            ).as_(step.new_column_name),
        )
        return query, StepTable(columns=[*table.columns, step.new_column_name])

    def text(self: Self, *, step: "TextStep", table: StepTable) -> tuple["QueryBuilder", StepTable]:
        from pypika.terms import ValueWrapper

        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *table.columns, ValueWrapper(step.text).as_(step.new_column)
        )
        return query, StepTable(columns=[*table.columns, step.new_column])

    def todate(
        self: Self, *, step: "ToDateStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        col_field: Field = Table(table.name)[step.column]

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

        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *(c for c in table.columns if c != step.column),
            date_selection.as_(col_field.name),
        )
        return query, StepTable(columns=table.columns)

    def top(self: Self, *, step: "TopStep", table: StepTable) -> tuple["QueryBuilder", StepTable]:
        if step.groups:
            if self.SUPPORT_ROW_NUMBER:
                sub_query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(*table.columns)

                the_table = Table(table.name)
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
                    .select(*table.columns)
                    .where(Field("row_number") <= step.limit)
                    # The order of returned results is not necessarily consistent. This ensures we
                    # always get the results in the same order
                    .orderby(*(Field(f) for f in step.groups + ["row_number"]), order=Order.asc)
                )
                return query, StepTable(columns=table.columns)

            else:
                raise NotImplementedError(f"[{self.DIALECT}] top is not implemented with groups")

        query = (
            self.QUERY_CLS.from_(table.name)
            .select(*table.columns)
            .orderby(step.rank_on, order=Order.desc if step.sort == "desc" else Order.asc)
            .limit(step.limit)
        )
        return query, StepTable(columns=table.columns)

    def trim(self: Self, *, step: "TrimStep", table: StepTable) -> tuple["QueryBuilder", StepTable]:
        col_fields: list[Field] = [Table(table.name)[col] for col in step.columns]
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *(c for c in table.columns if c not in step.columns),
            *(functions.Trim(col_field).as_(col_field.name) for col_field in col_fields),
        )
        return query, StepTable(columns=table.columns)

    def uniquegroups(
        self: Self, *, step: "UniqueGroupsStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        from weaverbird.pipeline.steps import AggregateStep

        return self.aggregate(
            step=AggregateStep(on=step.on, aggregations=[], keepOriginalGranularity=False),
            table=table,
        )

    def uppercase(
        self: Self, *, step: "UppercaseStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        col_field: Field = Table(table.name)[step.column]
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *(c for c in table.columns if c != step.column),
            functions.Upper(col_field).as_(step.column),
        )
        return query, StepTable(columns=table.columns)


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
