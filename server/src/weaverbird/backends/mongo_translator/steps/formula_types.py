from numbers import Number
from typing import Callable, List, Union


class BaseNode:
    traverse: Callable
    transform: Callable
    type: str


class OperatorNode(BaseNode):
    type: 'OperatorNode'
    fn: str
    op: str
    args: List[BaseNode]


class ConstantNode(BaseNode):
    def __init__(self, value: Union[Number, str]):
        self.value = value
    type: 'ConstantNode'
    value: Union[Number, str]


class SymbolNode(BaseNode):
    type: 'SymbolNode'
    name: str


class ParenthesisNode(BaseNode):
    type: 'ParenthesisNode'
    content: BaseNode


parse = Callable[[str], str]

MathNode = Union[OperatorNode, ConstantNode, SymbolNode, ParenthesisNode]


class VariableDelimiters:
    start: str
    end: str
