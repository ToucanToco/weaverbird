"""
https://sly.readthedocs.io/en/latest/sly.html#writing-a-parser
"""

import logging

from pypika import Bracket, Case, Not, Order, Schema
from pypika import analytics as an
from pypika import functions as fn
from pypika.enums import DatePart, SqlTypes
from pypika.functions import Cast, Extract
from pypika.terms import Field, NullValue, Star, ValueWrapper
from sly import Parser

from .builders import build_analytic, build_case
from .decorators import _
from .exceptions import ExpressionSyntaxError
from .lexer import PyPikaLexer

logger = logging.getLogger(__file__)
logger.setLevel(logging.ERROR)
AGGREGATE_FUNCTION_NAMES = {
    "COUNT",
    "SUM",
    "SUM_FLOAT",
    "MIN",
    "MAX",
    "AVG",
    "STD",
    "STDDEV",
    "APPROXIMATE_PERCENTILE",
}


class PyPikaParser(Parser):
    log = logger
    debugfile = 'parser.out'

    # Get the token list from the lexer (required)
    tokens = PyPikaLexer.tokens

    def __init__(self, tables):
        super().__init__()
        self.tables = tables

    def _get_table_for_alias(self, alias):
        if alias not in self.tables:
            raise Exception(f"Invalid table name [{alias}]")

        return self.tables[alias]

    precedence = (
        ("left", "DBL_PIPE"),
        ("left", "PLUS", "MINUS"),
        ("left", "TIMES", "DIVIDE", "MODULO"),
        ("right", "UMINUS"),
        ("right", "NOT"),
    )

    @_("expression OR and_condition")
    def expression(self, p):
        return p.expression | p.and_condition

    @_("and_condition")
    def expression(self, p):
        return p.and_condition

    @_("and_condition AND condition")
    def and_condition(self, p):
        return p.and_condition & p.condition

    @_("condition")
    def and_condition(self, p):
        return p.condition

    @_("operand")
    def condition(self, p):
        return p.operand

    @_("operand EQ operand")
    def condition(self, p):
        return p.operand0 == p.operand1

    @_("operand NE operand", "operand NE2 operand")
    def condition(self, p):
        return p.operand0 != p.operand1

    @_("operand GT operand")
    def condition(self, p):
        return p.operand0 > p.operand1

    @_("operand GE operand")
    def condition(self, p):
        return p.operand0 >= p.operand1

    @_("operand LT operand")
    def condition(self, p):
        return p.operand0 < p.operand1

    @_("operand LE operand")
    def condition(self, p):
        return p.operand0 <= p.operand1

    @_('operand IN "(" operand_list ")"')
    def condition(self, p):
        return p.operand.isin(p.operand_list)

    @_('operand NOT IN "(" operand_list ")"')
    def condition(self, p):
        return p.operand.notin(p.operand_list)

    @_('operand_list "," operand')
    def operand_list(self, p):
        return p.operand_list + [p.operand]

    @_("operand")
    def operand_list(self, p):
        return [p.operand]

    @_("operand LIKE operand")
    def condition(self, p):
        return p.operand0.like(p.operand1)

    @_("operand NOT LIKE operand")
    def condition(self, p):
        return p.operand0.not_like(p.operand1)

    @_("operand ILIKE operand")
    def condition(self, p):
        return p.operand0.ilike(p.operand1)

    @_("operand NOT ILIKE operand")
    def condition(self, p):
        return p.operand0.not_ilike(p.operand1)

    @_("operand BETWEEN operand AND operand")
    def condition(self, p):
        return p.operand0.between(p.operand1, p.operand2)

    @_("operand NOT BETWEEN operand AND operand")
    def condition(self, p):
        return p.operand0.not_between(p.operand1, p.operand2)

    @_("operand IS NULL")
    def condition(self, p):
        return p.operand.isnull()

    @_("operand IS NOT NULL")
    def condition(self, p):
        return p.operand.notnull()

    @_("NOT expression")
    def condition(self, p):
        return Not(p.expression)

    @_('"(" expression ")"')
    def condition(self, p):
        return Bracket(p.expression)

    @_("factor DBL_PIPE factor")
    def operand(self, p):
        if isinstance(p.factor0, fn.Concat):
            p.factor0.args += [p.factor1]
            return p.factor0

        return fn.Concat(p.factor0, p.factor1)

    @_("factor")
    def operand(self, p):
        return p.factor

    @_("term TIMES term")
    def factor(self, p):
        return p.term0 * p.term1

    @_("term DIVIDE term")
    def factor(self, p):
        return p.term0 / p.term1

    @_("term MODULO term")
    def factor(self, p):
        return p.term0 % p.term1

    @_("term PLUS term")
    def factor(self, p):
        return p.term0 + p.term1

    @_("term MINUS term")
    def factor(self, p):
        return p.term0 - p.term1

    @_("MINUS term %prec UMINUS")
    def factor(self, p):
        return -p.term

    @_("term")
    def factor(self, p):
        return p.term

    @_(
        "value",
        "function",
        "case",
        "case_when",
        "operand",
    )
    def term(self, p):
        return p[0]

    @_('"(" operand ")"')
    def term(self, p):
        return Bracket(p.operand)

    @_('alias "." column_ref')
    def term(self, p):
        table = self._get_table_for_alias(p.alias)
        return Field(p.column_ref, table=table)

    @_("column_ref")
    def term(self, p):
        table_keys = list(self.tables.keys())
        if len(table_keys) != 1:
            raise Exception(
                "Ambiguous column name. When using more than one table, column names must be prefixed."
            )

        table_key = table_keys[0]
        table = self.tables[table_key]
        return Field(p.column_ref, table=table)

    @_(
        "string",
        "numeric",
        "boolean",
        "constant",
    )
    def value(self, p):
        return p[0]

    @_("null")
    def value(self, p):
        return p.null

    @_(
        "CASE term when_then_list ELSE expression END",
    )
    def case(self, p):
        return build_case(Case(p.term), p.when_then_list, p.expression)

    @_("CASE term when_then_list END")
    def case(self, p):
        return build_case(Case(p.term), p.when_then_list)

    @_("CASE when_then_list ELSE expression END")
    def case_when(self, p):
        return build_case(Case(), p.when_then_list, p.expression)

    @_("CASE when_then_list END")
    def case_when(self, p):
        return build_case(Case(), p.when_then_list)

    @_("when_then_list when_then_stmt")
    def when_then_list(self, p):
        return p.when_then_list + [p.when_then_stmt]

    @_("when_then_stmt")
    def when_then_list(self, p):
        return [p.when_then_stmt]

    @_("WHEN expression THEN expression")
    def when_then_stmt(self, p):
        return p.expression0, p.expression1

    @_("NAME", "QUOTED_NAME")
    def alias(self, p):
        return p[0]

    @_("alias")
    def column_ref(self, p):
        return p.alias

    @_("NULL")
    def null(self, p):
        return NullValue()

    @_("STRING")
    def string(self, p):
        return ValueWrapper(p.STRING)

    @_("DECIMAL", "INTEGER")
    def numeric(self, p):
        return ValueWrapper(p[0])

    @_("TRUE")
    def boolean(self, p):
        return ValueWrapper(True)

    @_("FALSE")
    def boolean(self, p):
        return ValueWrapper(False)

    @_("time_unit")
    def constant(self, p):
        return p[0]

    @_('data_type_with_arg "(" INTEGER ")"')
    def data_type(self, p):
        return p.data_type_with_arg(p.INTEGER)

    @_("data_type_with_arg")
    def data_type(self, p):
        return p.data_type_with_arg

    @_("LONG_TYPE VARCHAR_TYPE")
    def data_type(self, p):
        return SqlTypes.LONG_VARCHAR

    @_("LONG_TYPE VARBINARY_TYPE")
    def data_type(self, p):
        return SqlTypes.LONG_VARBINARY

    @_("INTEGER_TYPE", "FLOAT_TYPE", "NUMERIC_TYPE", "SIGNED_TYPE", "UNSIGNED_TYPE", "BOOLEAN_TYPE")
    def data_type(self, p):
        return getattr(SqlTypes, p[0].upper())

    @_("CHAR_TYPE ", "VARCHAR_TYPE", "BINARY_TYPE", "VARBINARY_TYPE")
    def data_type_with_arg(self, p):
        return getattr(SqlTypes, p[0].upper())

    @_("YEAR", "QUARTER", "MONTH", "WEEK", "DAY", "HOUR", "MINUTE", "SECOND", "MICROSECOND")
    def time_unit(self, p):
        time_unit_string = p[0]
        return DatePart[str.lower(time_unit_string)]

    # FUNCTIONS

    @_(
        "cast",
        "extract",
        "analytic",
        "approximate_percentile",
    )
    def function(self, p):
        return p[0]

    @_('NAME "(" DISTINCT arguments_list ")"')
    def function(self, p):
        upper_name = p.NAME.upper()
        return fn.DistinctOptionFunction(upper_name, *p.arguments_list).distinct()

    @_('NAME "(" ")"', 'NAME "(" arguments_list ")"')
    def function(self, p):
        upper_name = p.NAME.upper()
        args = p.arguments_list if "arguments_list" in p._namemap else []
        func = fn.AggregateFunction if upper_name in AGGREGATE_FUNCTION_NAMES else fn.Function
        return func(upper_name, *args)

    @_('alias "." alias "(" ")"', 'alias "." alias "(" arguments_list ")"')
    def function(self, p):
        schema = p.alias0
        upper_name = p.alias1
        args = p.arguments_list if "arguments_list" in p._namemap else []
        func = fn.AggregateFunction if upper_name in AGGREGATE_FUNCTION_NAMES else fn.Function
        return func(upper_name, schema=Schema(schema), *args)

    @_("TIMES")
    def arguments_list(self, p):
        return [Star()]

    @_('alias "." TIMES')
    def arguments_list(self, p):
        table = self._get_table_for_alias(p.alias)
        return [Star(table)]

    @_('arguments_list "," expression')
    def arguments_list(self, p):
        return p.arguments_list + [p.expression]

    @_("expression")
    def arguments_list(self, p):
        return [p.expression]

    @_('CAST "(" expression AS data_type ")"')
    def cast(self, p):
        return Cast(p.expression, p.data_type)

    @_('APPROXIMATE_PERCENTILE "(" term USING PARAMETERS PERCENTILE EQ DECIMAL ")"')
    def approximate_percentile(self, p):
        return fn.ApproximatePercentile(p.term, p.DECIMAL)

    @_('EXTRACT "(" time_unit FROM expression ")"')
    def extract(self, p):
        return Extract(p.time_unit, p.expression)

    # ANALYTIC FUNCTIONS

    @_('analytic_function OVER "(" partition_by ")"')
    def analytic(self, p):
        return build_analytic(p.analytic_function, partitions=p.partition_by)

    @_('analytic_function OVER "(" order_by ")"')
    def analytic(self, p):
        return build_analytic(p.analytic_function, orders=p.order_by)

    @_('analytic_function OVER "(" partition_by order_by ")"')
    def analytic(self, p):
        return build_analytic(p.analytic_function, partitions=p.partition_by, orders=p.order_by)

    @_("function_ignore_nulls")
    def analytic_function(self, p):
        return p.function_ignore_nulls

    @_("function")
    def analytic_function(self, p):
        return an.AnalyticFunction(p.function.name, *p.function.args)

    @_('NAME "(" arguments_list IGNORE NULLS ")"')
    def function_ignore_nulls(self, p):
        upper_name = p.NAME.upper()
        return an.IgnoreNullsAnalyticFunction(upper_name, *p.arguments_list).ignore_nulls()

    @_("PARTITION BY arguments_list")
    def partition_by(self, p):
        return p.arguments_list

    @_("ORDER BY arguments_list_orientation")
    def order_by(self, p):
        return p.arguments_list_orientation

    @_('arguments_list_orientation "," expression orientation')
    def arguments_list_orientation(self, p):
        return p.arguments_list_orientation + [(p.expression, p.orientation)]

    @_('arguments_list_orientation "," expression')
    def arguments_list_orientation(self, p):
        return p.arguments_list_orientation + [(p.expression, None)]

    @_("expression orientation")
    def arguments_list_orientation(self, p):
        return [(p.expression, p.orientation)]

    @_("expression")
    def arguments_list_orientation(self, p):
        return [(p.expression, None)]

    @_("ASC")
    def orientation(self, p):
        return Order.asc

    @_("DESC")
    def orientation(self, p):
        return Order.desc

    def error(self, token):
        if token:
            lineno = getattr(token, "lineno", 0)
            index = getattr(token, "index", 0)
            raise ExpressionSyntaxError(
                f"Syntax error on line:column {lineno}:{index}, "
                f"unexpected value '{token.value}'"
            )
        raise ExpressionSyntaxError("Parse error in input. Unexpected end of expression.")
