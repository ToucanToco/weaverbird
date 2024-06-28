import operator
from typing import TYPE_CHECKING, Any

from pypika import Table
from pypika.functions import NullIf
from pypika.terms import Term

from weaverbird.pipeline.formula_ast.eval import FormulaParser
from weaverbird.pipeline.formula_ast.types import ColumnName, Expression, Operation, Operator

if TYPE_CHECKING:
    from weaverbird.backends.pypika_translator.translators.base import FromTable


_OP_MAP = {
    Operator.ADD: operator.add,
    Operator.SUB: operator.sub,
    Operator.MUL: operator.mul,
    Operator.DIV: operator.truediv,
    Operator.MOD: operator.mod,
}


def _eval_operation(op: Operation, table: Table) -> Term:
    right = (
        NullIf(_eval_expression(op.right, table), 0)
        if op.operator in (Operator.DIV, Operator.MOD)
        else _eval_expression(op.right, table)
    )
    return _OP_MAP[op.operator](_eval_expression(op.left, table), right)


def _eval_expression(expr: Expression, table: Table) -> Term:
    if isinstance(expr, Operation):
        return _eval_operation(expr, table)
    elif isinstance(expr, ColumnName):
        return table[expr.name]
    return Term.wrap_constant(expr)


def formula_to_term(formula: Any, table: "FromTable") -> Term:
    try:
        return _eval_expression(FormulaParser(formula).parse(), table)
    except (
        SyntaxError,
        AttributeError,
    ):  # Can happen in case formula is actually a string literal or a number
        return Term.wrap_constant(formula)
