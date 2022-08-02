from weaverbird.backends.mongo_translator.steps.formula import build_mongo_formula_tree
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.backends.mongo_translator.utils import build_cond_expression
from weaverbird.pipeline.formula_ast.eval import FormulaParser
from weaverbird.pipeline.steps.ifthenelse import IfThenElse, IfthenelseStep


def transform_ifthenelse_step(step: IfThenElse) -> MongoStep:
    else_expr: dict | str | int | float | bool
    if isinstance(step.else_value, IfThenElse):
        else_expr = transform_ifthenelse_step(step.else_value)
    else:
        else_expr = build_mongo_formula_tree(FormulaParser(str(step.else_value)).parse())

    if_expr = build_cond_expression(step.condition)
    then_expr = build_mongo_formula_tree(FormulaParser(str(step.then)).parse())
    return {'$cond': {'if': if_expr, 'then': then_expr, 'else': else_expr}}


def translate_ifthenelse(step: IfthenelseStep) -> list[MongoStep]:
    return [
        {
            '$addFields': {
                step.new_column: transform_ifthenelse_step(
                    IfThenElse(condition=step.condition, then=step.then, else_value=step.else_value)
                )
            }
        }
    ]
