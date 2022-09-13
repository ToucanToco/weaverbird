from weaverbird.pipeline.formula_ast.eval import FormulaParser
from weaverbird.pipeline.formula_ast.types import ColumnName, Expression, Operation, Operator
from weaverbird.pipeline.formula_ast.utils import unquote_string
from weaverbird.pipeline.steps import FormulaStep

_MONGO_OPERATOR_MAP = {
    Operator.ADD: "$add",
    Operator.SUB: "$subtract",
    Operator.MUL: "$multiply",
    Operator.DIV: "$divide",
    Operator.MOD: "$mod",
}


def mongo_formula_for_operation(op: Operation) -> dict:
    translated_op = {
        _MONGO_OPERATOR_MAP[op.operator]: [
            build_mongo_formula_tree(op.left),
            (right_tree := build_mongo_formula_tree(op.right)),
        ]
    }
    #  In case of a division operation the translator must handle a 0 or null denominator. The
    #  implemented logic is: if the translated operation is a division or a modulo, wraps the
    #  operation with a condition checking if the value of the right operand is in 0 or None and
    #  output a None result in this case. Otherwise, returns the result of the division/modulo
    #  operation
    if op.operator in (Operator.DIV, Operator.MOD):
        return {
            "$cond": [
                {"$in": [right_tree, [0, None]]},
                None,
                translated_op,
            ]
        }
    else:
        return translated_op


def build_mongo_formula_tree(expr: Expression) -> dict | str | int | bool | float:
    if isinstance(expr, Operation):
        return mongo_formula_for_operation(expr)
    elif isinstance(expr, ColumnName):
        return "$" + expr.name
    elif isinstance(expr, str):
        # We want unquoted strings
        return unquote_string(expr)
    else:
        return expr


def translate_formula(step: FormulaStep) -> list:
    tree = FormulaParser(step.formula).parse()
    mongo_tree = build_mongo_formula_tree(tree)
    return [{"$addFields": {step.new_column: mongo_tree}}]
