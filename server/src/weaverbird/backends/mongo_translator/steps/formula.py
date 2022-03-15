import ast
import re
from typing import Dict, Union, Optional, Any
from numbers import Number
import ast
from weaverbird.backends.mongo_translator.steps.formula_types import MathNode, ConstantNode, VariableDelimiters
from weaverbird.pipeline.steps import FormulaStep


def escape_for_use_in_regexp(string: str) -> str :
    return string.replace(r"/[.*+\-?^${}()|[\]\\]/g", "\\$&")


def build_formula_tree(
    formula: Union[str, Number],
    variables_delimiters: Optional[VariableDelimiters]= None
) -> MathNode:
    if not isinstance(formula, str):
        return ConstantNode(formula)
    COLS_ESCAPE_OPEN = '['
    COLS_ESCAPE_CLOSE = ']'

    # 1. Replace in formula some elements by a "pseudo"
    pseudonymised_formula = formula
    # 1.a Column names between '[]'
    pseudo_cols: Dict[str, str] = {}
    index_cols = 0
    regex_cols = re.match(
        f'{escape_for_use_in_regexp(COLS_ESCAPE_OPEN)}(.*?){escape_for_use_in_regexp(COLS_ESCAPE_CLOSE)}]',
        formula,
    )
    for match in regex_cols:
        pseudo_cols[f'__vqb_col_{index_cols}__'] = match
        pseudonymised_formula = pseudonymised_formula.replace(match, f'__vqb_col_{index_cols}__')
        index_cols += 1

    # 1.b Variables
    pseudo_vars: Dict[str, str] = {}
    if variables_delimiters:
        index_vars = 0
        regex_vars = re.match(
            f"{escape_for_use_in_regexp(variables_delimiters.start)}(.*?){escape_for_use_in_regexp(variables_delimiters.end)}",
            formula
        )
        for match in regex_vars:
            pseudo_vars[f'__vqb_var_{index_vars}__'] = match
            pseudonymised_formula = pseudonymised_formula.replace(match, f'__vqb_var_{index_vars}__')
            index_vars += 1

    # 2. Parse the formula into a MathNode
    math_tree: MathNode = ast.parse(pseudonymised_formula)

    def _replace_pseudo_by_nodes(node: MathNode)-> MathNode:
        if node.type == 'SymbolNode':
            if pseudo_cols.get(node.name):
                node.name = pseudo_cols[node.name].replace(
                    COLS_ESCAPE_OPEN, ''
                ).replace(
                    COLS_ESCAPE_CLOSE, ''
                )
            if variables_delimiters and pseudo_vars.get(node.name):
                return ConstantNode(pseudo_vars[node.name])
        return node
    # 3. Replace all pseudo into MathNode by there original name
    return math_tree.transform(
        _replace_pseudo_by_nodes()
    )


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
        mongo_op = 'subtract'
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


def mongo_formula_for_ast_node(node: ast.AST) -> any:
    if isinstance(node, ast.BinOp):
        return mongo_formula_for_binop(node)
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

    # new_column = mongo_formula_tree.mongo_formula
    # #     If at least one denominator is zero or null, the result is null
    # #     i.e: 1 / 0 + 1 = null
    # if len(mongo_formula_tree.mongo_formula):
    #     new_column = {
    #         '$cond': [
    #             {'$or': [{'$in': [d, (0, None)]} for d in mongo_formula_tree.denominators]},
    #             None,
    #             new_column
    #         ]
    #     }

    return [{'$addFields': { step.new_column: mongo_expr }}]


#
# def translate_formula(step: FormulaStep) -> List:
#     formula(step: Readonly < S.FormulaStep >): MongoStep
#     {
#         const
#     mongoFormulaTree = buildMongoFormulaTree(
#         buildFormulaTree(step.formula, BaseTranslator.variableDelimiters),
#     );
#
#     let
#     newColumn = mongoFormulaTree.mongoFormula;
#
#
#     if (mongoFormulaTree.denominators.length > 0)
#     {
#         newColumn = {
#     $cond: [
#         { $ or: mongoFormulaTree.denominators.map(d= > ({ $ in:[d, [0, null]]}))},
#     null,
#     newColumn,
#     ],
#     };
#     }
#
#     return {
#     $addFields: {
#         [step.new_column]: newColumn,
#     },
#     };
#     }

class InvalidFormula(Exception):
    """
    Raised when a formula is not supported
    """
