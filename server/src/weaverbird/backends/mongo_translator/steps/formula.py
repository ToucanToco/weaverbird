import ast
from typing import Any

from weaverbird.pipeline.steps import FormulaStep


def mongo_formula_for_constant(constant: ast.Constant) -> Any:
    return constant.value


def mongo_formula_for_name(name: ast.Name) -> str:
    """
    Identifiers correspond to column names
    """
    return '$' + name.id


def mongo_formula_for_binop(binop: ast.BinOp) -> dict:
    if isinstance(binop.op, ast.Add):
        mongo_op = '$add'
    elif isinstance(binop.op, ast.Sub):
        mongo_op = '$subtract'
    elif isinstance(binop.op, ast.Mult):
        mongo_op = '$multiply'
    elif isinstance(binop.op, ast.Div):
        mongo_op = '$divide'
    elif isinstance(binop.op, ast.Pow):
        mongo_op = '$pow'
    else:
        raise InvalidFormula(f'Operator {binop.op.__class__} is not supported')

    return {
        mongo_op: [
            mongo_formula_for_ast_node(binop.left),
            mongo_formula_for_ast_node(binop.right),
        ]
    }


def mongo_formula_for_unaryop(unop: ast.UnaryOp) -> dict:
    if isinstance(unop.op, ast.USub):
        return {'$multiply': [-1, mongo_formula_for_ast_node(unop.operand)]}
    else:
        raise InvalidFormula(f'Operator {unop.op.__class__} is not supported')


def mongo_formula_for_ast_node(node: ast.AST) -> any:
    if isinstance(node, ast.BinOp):
        return mongo_formula_for_binop(node)
    elif isinstance(node, ast.UnaryOp):
        return mongo_formula_for_unaryop(node)
    elif isinstance(node, ast.Constant):
        return mongo_formula_for_constant(node)
    elif isinstance(node, ast.Name):
        return mongo_formula_for_name(node)
    else:
        raise InvalidFormula(f'Formula node {node} is not supported')


def mongo_formula_for_expr(expr: ast.Expr) -> dict:
    if isinstance(expr.value, ast.AST):
        return mongo_formula_for_ast_node(expr.value)
    else:
        raise InvalidFormula


def translate_formula(step: FormulaStep) -> list:
    module = ast.parse(step.formula)
    expr = module.body[0]
    if not isinstance(expr, ast.Expr):
        raise InvalidFormula

    mongo_expr = mongo_formula_for_expr(expr)

    return [{'$addFields': {step.new_column: mongo_expr}}]


class InvalidFormula(Exception):
    """
    Raised when a formula is not supported
    """
