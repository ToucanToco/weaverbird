import ast
import re
import tokenize
from collections.abc import Generator, Iterator
from io import BytesIO
from typing import Any

from . import types


class ASTError(Exception):
    """Base exception for all AST errors"""


class UnclosedColumnName(ASTError):
    """Column name was not closed"""


class EmptyColumnName(ASTError):
    """Column name was not closed"""


class UnexpectedToken(ASTError):
    """Unexpected token"""


class InvalidFormula(ASTError):
    """Invalid formula"""


class UnsupportedOperator(ASTError):
    """Unsupported operator"""


class UnsupportedExpression(ASTError):
    """Unsupported expression"""


class UnsupportedConstant(ASTError):
    """Unsupported constant"""


# Everything that is between square brackets but is not an opening square bracket, lazily
_COLUMN_NAME_RE = re.compile(r"\[[^[]+?\]")


class FormulaParser:
    def __init__(self, formula: Any) -> None:
        self._formula = str(formula)
        self._columns: dict[str, str] = {}

    def _iterate_tokens(self, tokens: Iterator[tokenize.TokenInfo]) -> Generator[str]:
        """This function iterates over tokens, sanitizes and yields them."""

        def next_token():
            try:
                return next(tokens)
            except StopIteration:
                return None

        while token := next_token():
            if token.type in (
                tokenize.ENCODING,
                tokenize.INDENT,
                tokenize.NEWLINE,
                tokenize.ENDMARKER,
            ):
                # Those are whitespace tokens we don't care about, so not yielding them
                continue
            else:
                yield token.string

    def _substitute_bracket_columns(self, formula: str) -> str:
        """Substitutes column names between square brackets with unique identifiers"""
        columns: list[tuple[str, str]] = []
        for match_ in re.finditer(_COLUMN_NAME_RE, formula):
            columns.append((f"__VQB_COL__{len(columns)}", match_.group(0)))

        for replacement, col_name_match in columns:
            # removing the square brackets around the column name
            formula = formula.replace(col_name_match, replacement, 1)
        # removing the square brackets around the column name
        self._columns = {replacement: col_name_match[1:-1] for replacement, col_name_match in columns}
        return formula

    def sanitize_formula(self) -> str:
        """Removes [] around column names and aliases them.

        This is needed because stuff parsed with the STL's ast module needs to be valid python code
        """
        self._columns = {}
        formula_substituted_columns = self._substitute_bracket_columns(self._formula)
        # Stripping because strings starting with whitespace raise UnexpectedIndent when parsed by
        # the ast module
        return " ".join(
            self._iterate_tokens(tokenize.tokenize(BytesIO(formula_substituted_columns.encode()).readline))
        ).strip()

    @staticmethod
    def _operator_from_ast_op(op: ast.operator) -> types.Operator:
        """Returns one of our known operators from an operator of the ast module.

        Raise an exception in case of an unsupported operator.
        """
        match op:
            case ast.Add():
                return types.Operator.ADD
            case ast.Sub():
                return types.Operator.SUB
            case ast.Mult():
                return types.Operator.MUL
            case ast.Div():
                return types.Operator.DIV
            case ast.Mod():
                return types.Operator.MOD
            case _:
                raise UnsupportedOperator(f"Unsupported operator: {op}")

    def _build_name(self, name: str) -> types.ColumnName | bool | None:
        """Builds a ColumnName from a raw name.

        In case the name is "true" or "false", returns the equivalent boolean
        (users do not expect to have to capitalize booleans).
        In case the name is "null", returns None.
        """
        if name == "true":
            return True
        if name == "false":
            return False
        if name == types.NULL_REPR:
            return None
        return (
            types.ColumnName(name=self._columns[name], alias=name)
            if name in self._columns
            else types.ColumnName(name=name, alias=name)
        )

    def _parse_expr(self, expr: ast.expr) -> types.Expression:
        """Takes an expression of the ast module and builds an AST in our own format from it."""
        match expr:
            # +LITERAL: +1, +13.37
            case ast.UnaryOp(op=ast.UAdd(), operand=ast.Constant(value=value)):
                if isinstance(value, int | bool | float | str | None):
                    return value
                else:
                    raise UnsupportedConstant(f"Unsupported constant {expr} of type {type(value)}")
            # -LITERAL: -1, -13.37
            case ast.UnaryOp(op=ast.USub(), operand=ast.Constant(value=value)):
                if isinstance(value, int | bool | float):
                    return -value
                else:
                    raise UnsupportedConstant(f"Unsupported negged constant {expr} of type {type(value)}")
                return -value
            # +colname: +mycol, +[my col]
            case ast.UnaryOp(op=ast.UAdd(), operand=ast.Name(id=name)):
                return self._build_name(name)
            # -colname: -mycol, -[my col]
            case ast.UnaryOp(op=ast.USub(), operand=ast.Name(id=name)):
                # Cheating a bit here, assuming the column is numeric
                return types.Operation(left=-1, operator=types.Operator.MUL, right=self._build_name(name))
            # Recursing down into both branches of the operation
            case ast.BinOp(left=left, right=right, op=op):
                operator = self._operator_from_ast_op(op)
                return types.Operation(left=self._parse_expr(left), right=self._parse_expr(right), operator=operator)
            # Constant: number, string literal or boolean
            case ast.Constant(value=value):
                if isinstance(value, bool | int | float | str | None):
                    return value
                else:
                    raise UnsupportedConstant(f"Unsupported constant '{expr}' of type {type(value)}")
            # Column name
            case ast.Name(id=name):
                return self._build_name(name)
            case _:
                raise UnsupportedExpression(f"Unsupported expression: {ast.dump(expr)}")

    def parse(self) -> types.Expression:
        parsed = ast.parse(self.sanitize_formula())
        match parsed:
            case ast.Module(body=[ast.Expr(value=expr)]):
                return self._parse_expr(expr)
            case _:
                raise InvalidFormula("Invalid formula: Expected an expression at root")
