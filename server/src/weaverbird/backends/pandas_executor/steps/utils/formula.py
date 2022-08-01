import numpy as np
from pandas import DataFrame

from weaverbird.pipeline.formula_ast.eval import FormulaParser
from weaverbird.pipeline.formula_ast.types import Expression, format_expr


def formula_expression_to_pandas(tree: Expression) -> str | int | bool | float:
    return format_expr(tree, column_start_seq='`', column_end_seq='`', bools_as_py=True)


def eval_formula(df: DataFrame, formula: str) -> DataFrame:
    pandas_expr = formula_expression_to_pandas(FormulaParser(formula).parse())
    try:
        result = df.eval(pandas_expr)
    except Exception:
        # for all cases not handled by NumExpr
        result = df.eval(pandas_expr, engine='python')

    try:
        # eval can introduce Infinity values (when dividing by 0),
        # which do not have a JSON representation.
        # Let's replace them by NaN:
        return result.replace([np.inf, -np.inf], np.nan)
    except Exception:
        # `result` is not a Series
        return result
