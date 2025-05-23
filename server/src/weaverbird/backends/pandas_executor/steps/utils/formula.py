import operator

import numpy as np
from pandas import DataFrame, Series

from weaverbird.pipeline.formula_ast.eval import FormulaParser
from weaverbird.pipeline.formula_ast.types import ColumnName, Expression, Operation, Operator

_OP_MAP = {
    Operator.ADD: operator.add,
    Operator.SUB: operator.sub,
    Operator.MUL: operator.mul,
    Operator.DIV: operator.truediv,
    Operator.MOD: operator.mod,
}


class NullSeries(Series):
    """A Series containing only null values.

    This type allows us to know that a Series is filled with null values without having to check its content
    """

    def __init__(self, index: DataFrame.index):
        Series.__init__(self, index=index, dtype="object")


def _eval_operation(df: DataFrame, op: Operation) -> Series:
    return _OP_MAP[op.operator](_eval_expression(df, op.left), _eval_expression(df, op.right)).replace(
        [np.inf, -np.inf], np.nan
    )


def _eval_expression(df: DataFrame, expr: Expression) -> Series:
    if expr is None:
        return NullSeries(df.index)
    elif isinstance(expr, Operation):
        return _eval_operation(df, expr)
    elif isinstance(expr, ColumnName):
        return df[expr.name]
    return Series(expr, index=df.index)


def eval_formula(df: DataFrame, formula: str) -> Series:
    return _eval_expression(df, FormulaParser(formula).parse())
