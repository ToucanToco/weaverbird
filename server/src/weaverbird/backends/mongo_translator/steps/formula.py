import ast
import re
from typing import Any, Dict, Tuple, Union

from weaverbird.pipeline.steps import FormulaStep


def mongo_formula_for_constant(constant: ast.Constant) -> Any:
    return constant.value


def mongo_formula_for_name(name: ast.Name, columns_aliases: Dict) -> str:
    """
    Identifiers correspond to column names
    """
    if name.id in columns_aliases:
        return f'${columns_aliases[name.id]}'
    else:
        return '$' + name.id


def mongo_formula_for_binop(binop: ast.BinOp, columns_aliases: Dict) -> dict:
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

    translated_op = {
        mongo_op: [
            mongo_formula_for_ast_node(binop.left, columns_aliases),
            mongo_formula_for_ast_node(binop.right, columns_aliases),
        ]
    }
    #  In case of a division operation the translator must handle a 0 or null denominator.
    #  The implemented logic is: if the translated operation is a division, wraps the operation with a
    #  condition checking if the value of the right operand is in 0 or None and output a None result in this case
    #  otherwise, return the result the division operation
    if mongo_op == '$divide':
        return {
            '$cond': [
                {'$in': [mongo_formula_for_ast_node(binop.right, columns_aliases), [0, None]]},
                None,
                translated_op,
            ]
        }
    else:
        return translated_op


def mongo_formula_for_unaryop(unop: ast.UnaryOp, columns_aliases: Dict) -> dict:
    if isinstance(unop.op, ast.USub):
        return {'$multiply': [-1, mongo_formula_for_ast_node(unop.operand, columns_aliases)]}
    else:
        raise InvalidFormula(f'Operator {unop.op.__class__} is not supported')


def mongo_formula_for_ast_node(node: ast.AST, columns_aliases: Dict) -> Any:
    if isinstance(node, ast.BinOp):
        return mongo_formula_for_binop(node, columns_aliases)
    elif isinstance(node, ast.UnaryOp):
        return mongo_formula_for_unaryop(node, columns_aliases)
    elif isinstance(node, ast.Constant):
        return mongo_formula_for_constant(node)
    elif isinstance(node, ast.Name):
        return mongo_formula_for_name(node, columns_aliases)
    else:
        raise InvalidFormula(f'Formula node {node} is not supported')


def mongo_formula_for_expr(expr: ast.Expr, columns_aliases: Dict) -> Dict[str, Any]:
    if isinstance(expr.value, ast.AST):
        return mongo_formula_for_ast_node(expr.value, columns_aliases)
    else:
        raise InvalidFormula


def translate_formula(step: FormulaStep) -> list:
    return [{'$addFields': {step.new_column: build_mongo_formula_tree(step.formula)}}]


def build_mongo_formula_tree(
    formula: Union[str, int, float, bool]
) -> Union[Dict[str, Any], int, float, bool]:
    if isinstance(formula, str):
        columns_aliases, sanitized_formula = sanitize_formula(formula)
        module = ast.parse(sanitized_formula)
        expr = module.body[0]
        if not isinstance(expr, ast.Expr):
            raise InvalidFormula
        mongo_expr = mongo_formula_for_expr(expr, columns_aliases)
        return mongo_expr
    elif type(formula) in (int, float, bool):
        return formula
    else:
        raise InvalidFormula


def sanitize_formula(formula: str) -> Tuple[Dict[str, str], str]:
    """
    This function handles column names with special characters & spaces.
    Such columns are surrounded by brackets. The functions replaces this pattern by a temporary name
    and store the original name in a dict, with the temporary name as key and the actual name as key.
    For example in this formula -> [I'm a Special Column!!] * 10 it will return
    tuple(__vqb_col_0__ * 10, {"__vqb_col_0__": "[I'm a Special Column!!]"})
    The translate function will replaces the temporary name by the old one once the formula will
    be parsed by ast.parse and translated to mongo.
    """
    columns_aliases = {}
    sanitized_formula = formula
    matches = re.findall(r'\[(.*?)]', formula)
    for i, match in enumerate(matches):
        columns_aliases[f'__vqb_col_{i}__'] = match
        sanitized_formula = sanitized_formula.replace(f'[{match}]', f'__vqb_col_{i}__')
    return columns_aliases, sanitized_formula


class InvalidFormula(Exception):
    """
    Raised when a formula is not supported
    """
