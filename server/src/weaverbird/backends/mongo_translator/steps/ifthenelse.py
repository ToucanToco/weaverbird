from typing import Any, Dict, List, Union

from weaverbird.backends.mongo_translator.steps.formula import build_mongo_formula_tree
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.backends.mongo_translator.utils import build_cond_expression
from weaverbird.pipeline.steps.ifthenelse import IfThenElse


def translate_ifthenelse(
    step: IfThenElse, unsupported_operators_in_conditions: Any
) -> List[MongoStep]:
    if_expr = build_cond_expression(step.condition, unsupported_operators_in_conditions)
    then_expr = build_mongo_formula_tree(step.then)
    else_expr: Union[Dict[str, Any], int]
    if isinstance(step.else_value, IfThenElse):
        else_expr = translate_ifthenelse(step.else_value, unsupported_operators_in_conditions)[0]
    else:
        else_expr = build_mongo_formula_tree(step.else_value)
    return [{'$cond': {'if': if_expr, 'then': then_expr, 'else': else_expr}}]
