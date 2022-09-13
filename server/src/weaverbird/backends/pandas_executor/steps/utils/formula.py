import operator

import numpy as np
from pandas import DataFrame, Series

from weaverbird.pipeline.formula_ast.eval import FormulaParser
from weaverbird.pipeline.formula_ast.types import ColumnName, Expression, Operation, Operator
from weaverbird.pipeline.formula_ast.utils import unquote_string

_OP_MAP = {
    Operator.ADD: operator.add,
    Operator.SUB: operator.sub,
    Operator.MUL: operator.mul,
    Operator.DIV: operator.truediv,
    Operator.MOD: operator.mod,
}


def _eval_operation(df: DataFrame, op: Operation) -> Series:
    return _OP_MAP[op.operator](
        _eval_expression(df, op.left), _eval_expression(df, op.right)
    ).replace([np.inf, -np.inf], np.nan)


def _eval_expression(df: DataFrame, expr: Expression) -> Series:
    if isinstance(expr, Operation):
        return _eval_operation(df, expr)
    elif isinstance(expr, ColumnName):
        return df[expr.name]
    elif isinstance(expr, str):
        # Unquote the string. No need to escape quotes in it, as it will be used as is by pandas
        expr = unquote_string(expr, escape_quotes=False)
    return Series(expr, index=df.index)


def eval_formula(df: DataFrame, formula: str) -> Series:
    try:
        return _eval_expression(df, FormulaParser(formula).parse())
    except SyntaxError:  # The formula is actually a badly formatted string
        return _eval_expression(df, formula)
