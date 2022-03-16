import ast
import re
from typing import Any, Dict

from weaverbird.pipeline.steps import FormulaStep


def escape_for_use_in_regexp(string: str) -> str:
    return string.replace('[.*+-?^${}()|[]', '\\&&')


def mongo_formula_for_constant(constant: ast.Constant) -> Any:
    return constant.value


def mongo_formula_for_name(name: ast.Name, pseudo_cols: Dict) -> str:
    """
    Identifiers correspond to column names
    """
    if name.id in pseudo_cols:
        return f'${pseudo_cols[name.id]}'
    else:
        return '$' + name.id


def mongo_formula_for_binop(binop: ast.BinOp, pseudo_cols: Dict) -> dict:
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
            mongo_formula_for_ast_node(binop.left, pseudo_cols),
            mongo_formula_for_ast_node(binop.right, pseudo_cols),
        ]
    }


def mongo_formula_for_unaryop(unop: ast.UnaryOp, pseudo_cols: Dict) -> dict:
    if isinstance(unop.op, ast.USub):
        return {'$multiply': [-1, mongo_formula_for_ast_node(unop.operand, pseudo_cols)]}
    else:
        raise InvalidFormula(f'Operator {unop.op.__class__} is not supported')


def mongo_formula_for_ast_node(node: ast.AST, pseudo_cols: Dict) -> any:
    if isinstance(node, ast.BinOp):
        return mongo_formula_for_binop(node, pseudo_cols)
    elif isinstance(node, ast.UnaryOp):
        return mongo_formula_for_unaryop(node, pseudo_cols)
    elif isinstance(node, ast.Constant):
        return mongo_formula_for_constant(node)
    elif isinstance(node, ast.Name):
        return mongo_formula_for_name(node, pseudo_cols)
    else:
        raise InvalidFormula(f'Formula node {node} is not supported')


def mongo_formula_for_expr(expr: ast.Expr, pseudo_cols: Dict) -> dict:
    if isinstance(expr.value, ast.AST):
        return mongo_formula_for_ast_node(expr.value, pseudo_cols)
    else:
        raise InvalidFormula


def translate_formula(step: FormulaStep) -> list:
    # search column names with [...]
    pseudo_cols = {}
    pseudotized_formula = step.formula
    matches = re.findall(r'\[(.*?)]', step.formula)

    for i, match in enumerate(matches):
        pseudo_cols[f'__vqb_col_{i}__'] = match
        pseudotized_formula = pseudotized_formula.replace(f'[{match}]', f'__vqb_col_{i}__')

    module = ast.parse(pseudotized_formula)
    expr = module.body[0]
    if not isinstance(expr, ast.Expr):
        raise InvalidFormula

    mongo_expr = mongo_formula_for_expr(expr, pseudo_cols)

    return [{'$addFields': {step.new_column: mongo_expr}}]


class InvalidFormula(Exception):
    """
    Raised when a formula is not supported
    """
