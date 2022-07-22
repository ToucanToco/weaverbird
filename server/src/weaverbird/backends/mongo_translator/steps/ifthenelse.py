from typing import Any, Dict, List, Union

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.backends.mongo_translator.utils import build_cond_expression
from weaverbird.backends.utils.formula_builder import MongoFormulaBuilder
from weaverbird.pipeline.steps.ifthenelse import IfThenElse, IfthenelseStep


def transform_ifthenelse_step(step: IfThenElse) -> MongoStep:
    if_expr = build_cond_expression(step.condition)
    then_expr = MongoFormulaBuilder.build_formula_tree(step.then)
    else_expr: Union[Dict[str, Any], int, float, bool]
    if isinstance(step.else_value, IfThenElse):
        else_expr = transform_ifthenelse_step(step.else_value)
    else:
        else_expr = MongoFormulaBuilder.build_formula_tree(step.else_value)
    return {'$cond': {'if': if_expr, 'then': then_expr, 'else': else_expr}}


def translate_ifthenelse(step: IfthenelseStep) -> List[MongoStep]:
    return [
        {
            '$addFields': {
                step.new_column: transform_ifthenelse_step(
                    IfThenElse(condition=step.condition, then=step.then, else_value=step.else_value)
                )
            }
        }
    ]
