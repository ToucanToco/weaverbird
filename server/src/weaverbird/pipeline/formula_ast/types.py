from enum import Enum
from typing import Union

from pydantic import BaseModel

from weaverbird.pipeline.formula_ast.utils import unquote_string


class Operator(str, Enum):
    ADD = "+"
    SUB = "-"
    MUL = "*"
    DIV = "/"
    MOD = "%"


Constant = int | bool | float | str


class ColumnName(BaseModel):
    name: str
    alias: str


Expression = Union["Operation", ColumnName, Constant]


# Dataclasses do not supported recursive types for now
class Operation(BaseModel, smart_union=True):
    left: Expression
    right: Expression
    operator: Operator


Operation.update_forward_refs()


def format_expr(
    expr: Expression,
    *,
    parenthesize_operations: bool = False,
    str_quote_seq: str = "'",
    column_start_seq: str = "[",
    column_end_seq: str = "]",
    bools_as_py: bool = False,
) -> str | int | float:
    if isinstance(expr, Operation):
        left = format_expr(
            expr.left,
            parenthesize_operations=True,
            str_quote_seq=str_quote_seq,
            column_start_seq=column_start_seq,
            column_end_seq=column_end_seq,
        )
        right = format_expr(
            expr.right,
            parenthesize_operations=True,
            str_quote_seq=str_quote_seq,
            column_start_seq=column_start_seq,
            column_end_seq=column_end_seq,
        )
        str_ = f"{left} {expr.operator} {right}"
        return f"({str_})" if parenthesize_operations else str_
    elif isinstance(expr, ColumnName):
        return f"{column_start_seq}{expr.name}{column_end_seq}"
    elif isinstance(expr, str):
        # Unquoting
        return f"{str_quote_seq}{unquote_string(expr)}{str_quote_seq}"
    # bool is a subtype of int, but we don't want to have 1 and 0 replaced with 'true' or 'false'
    elif isinstance(expr, (int, float)) and not isinstance(expr, bool):
        return expr
    elif isinstance(expr, bool):
        return expr if bools_as_py else ("true" if expr else "false")
