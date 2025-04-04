from typing import Any, Literal

from weaverbird.backends.mongo_translator.steps.formula import build_mongo_formula_tree
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.backends.mongo_translator.utils import build_cond_expression
from weaverbird.pipeline.formula_ast.eval import FormulaParser
from weaverbird.pipeline.steps.ifthenelse import IfThenElse, IfthenelseStep


def _default_to_null(expr: Any) -> dict[Literal["$ifNull"], list[Any]]:
    """Makes the passed expression default to NULL if not defined"""
    return {"$ifNull": [expr, None]}


def transform_ifthenelse_step(step: IfThenElse) -> MongoStep:
    else_expr: dict | str | int | float | bool
    if isinstance(step.else_value, IfThenElse):
        else_expr = transform_ifthenelse_step(step.else_value)
    else:
        try:
            else_expr = build_mongo_formula_tree(FormulaParser(str(step.else_value)).parse())
        except SyntaxError:  # else_expr is a badly formatted string
            else_expr = step.else_value

    if_expr = build_cond_expression(step.condition)
    then_expr = build_mongo_formula_tree(FormulaParser(str(step.then)).parse())
    return {"$cond": {"if": if_expr, "then": _default_to_null(then_expr), "else": _default_to_null(else_expr)}}


def translate_ifthenelse(step: IfthenelseStep) -> list[MongoStep]:
    return [
        {
            "$addFields": {
                step.new_column: transform_ifthenelse_step(
                    IfThenElse(condition=step.condition, then=step.then, else_value=step.else_value)
                )
            }
        }
    ]
