from enum import Enum
from typing import Union

from pydantic import BaseModel


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
class Operation(BaseModel):
    left: Expression
    right: Expression
    operator: Operator


Operation.model_rebuild()
