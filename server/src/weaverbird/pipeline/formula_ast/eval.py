import ast
import tokenize
from collections.abc import Generator, Iterator
from io import BytesIO

from weaverbird.pipeline.formula_ast.utils import unquote_string

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


class FormulaParser:
    def __init__(self, formula: str) -> None:
        self._formula = formula
        self._columns: dict[str, str] = {}

    @staticmethod
    def sanitize_string(s: str) -> str:
        """Unquotes strings, escapes single quotes and wraps them in single quotes"""
        # Removing outer quotes
        unquoted = unquote_string(s)
        # Escaping single quotes in the string
        with_escaped_single_quotes = unquoted.replace("'", r"\'")
        # Wrapping the entire thing in single quotes
        return f"'{with_escaped_single_quotes}'"

    def _iterate_tokens(self, tokens: Iterator[tokenize.TokenInfo]) -> Generator[str, None, None]:
        """This function iterates over tokens, sanitizes and yields them."""

        def next_token():
            try:
                return next(tokens)
            except StopIteration:
                return None

        def parse_col_name(prev_token: tokenize.TokenInfo) -> str:
            # NOTE: position is expressed as a (posLine, posColumn) tuple. We assume that the
            # formula is written on a single line
            start = prev_token.end[1]
            # Skipping the current token, which is [
            while tok := next_token():
                # We reached the end of the column name. Store an alias for it and yield the alias
                if tok.type == tokenize.OP and tok.string == "]":
                    end = tok.start[1]
                    if end - start < 1:
                        raise EmptyColumnName(f"Got an empty column name at {prev_token.start[1]}")
                    col_name = f"__VQB_COL__{len(self._columns)}"
                    self._columns[col_name] = self._formula[start:end]
                    return col_name
                prev_token = tok
            raise UnclosedColumnName(
                f"Expected column to be closed near {prev_token.string} at {prev_token.start[1]}"
            )

        while token := next_token():
            if token.type in (
                tokenize.ENCODING,
                tokenize.INDENT,
                tokenize.NEWLINE,
                tokenize.ENDMARKER,
            ):
                # Those are whitespace tokens we don't care about, so not yielding them
                continue
            elif token.type == tokenize.STRING:
                # In case we have a string literal, we sanitize it
                yield self.sanitize_string(token.string)
            elif token.type == tokenize.OP and token.string == "[":
                # Square brackets are delimiters for column names, so here we read everyhting until
                # the closing bracket
                yield parse_col_name(token)
            else:
                yield token.string

    def sanitize_formula(self) -> str:
        """Removes [] around column names and aliases them.

        This is needed because stuff parsed with the STL's ast module needs to be valid python code
        """
        self._columns = {}
        # Stripping because strings starting with whitespace raise UnexpectedIndent when parsed by
        # the ast module
        return " ".join(
            self._iterate_tokens(tokenize.tokenize(BytesIO(self._formula.encode()).readline))
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

    def _build_name(self, name: str) -> types.ColumnName | bool:
        """Builds a ColumnName from a raw name.

        In case the name is "true" or "false", returns the equivalent boolean
        (users do not expect to have to capitalize booleans).
        """
        if name == "true":
            return True
        if name == "false":
            return False
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
                return value
            # -LITERAL: -1, -13.37
            case ast.UnaryOp(op=ast.USub(), operand=ast.Constant(value=value)):
                return -value
            # +colname: +mycol, +[my col]
            case ast.UnaryOp(op=ast.UAdd(), operand=ast.Name(id=name)):
                return self._build_name(name)
            # -colname: -mycol, -[my col]
            case ast.UnaryOp(op=ast.USub(), operand=ast.Name(id=name)):
                # Cheating a bit here, assuming the column is numeric
                return types.Operation(
                    left=-1, operator=types.Operator.MUL, right=self._build_name(name)
                )
            # Recursing down into both branches of the operation
            case ast.BinOp(left=left, right=right, op=op):
                operator = self._operator_from_ast_op(op)
                return types.Operation(
                    left=self._parse_expr(left), right=self._parse_expr(right), operator=operator
                )
            # Constant: number, string literal or boolean
            case ast.Constant(value=value):
                # bool is a subtype of int
                if isinstance(value, (int, float)):
                    return value
                elif isinstance(value, str):
                    return f"'{value}'"
                else:
                    raise UnsupportedConstant(
                        f"Unsupported constant '{expr}' of type {type(value)}"
                    )
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
