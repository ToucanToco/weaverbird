import ast
import tokenize
from io import BytesIO
from typing import Generator, Iterator

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
        # Removing outer quotes
        unquoted = ast.literal_eval(s)
        # Escaping single quotes in the string
        with_escaped_single_quotes = unquoted.replace('\'', r'\'')
        # Wrapping the entire thing in single quotes
        return f"'{with_escaped_single_quotes}'"

    def _iterate_tokens(self, tokens: Iterator[tokenize.TokenInfo]) -> Generator[str, None, None]:
        def next_token():
            try:
                return next(tokens)
            except StopIteration:
                return None

        def parse_col_name(prev_token: tokenize.TokenInfo) -> str:
            chunks = []
            while tok := next_token():
                if tok.type == tokenize.NAME:
                    chunks.append(tok.string)
                elif tok.type == tokenize.OP and tok.string == ']':
                    if len(chunks) < 1:
                        raise EmptyColumnName(f'Got an empty column name at {prev_token.start[1]}')
                    col_name = f'__VQB_COL__{len(self._columns)}'
                    self._columns[col_name] = ' '.join(chunks)
                    return col_name
                else:
                    raise UnexpectedToken(f"Unexpected token {tok} in column name")
                prev_token = tok
            raise UnclosedColumnName(
                f'Expected column to be closed near {prev_token.string} at {prev_token.start[1]}'
            )

        while token := next_token():
            if token.type in (tokenize.ENCODING, tokenize.NEWLINE, tokenize.ENDMARKER):
                continue
            elif token.type == tokenize.STRING:
                yield self.sanitize_string(token.string)
            elif token.type == tokenize.OP and token.string == '[':
                yield parse_col_name(token)
            else:
                yield token.string

    def sanitize_formula(self) -> str:
        self._columns = {}
        return ' '.join(
            self._iterate_tokens(tokenize.tokenize(BytesIO(self._formula.encode()).readline))
        )

    @staticmethod
    def _operator_from_ast_op(op: ast.operator) -> types.Operator:
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
                raise UnsupportedOperator(f'Unsupported operator: {op}')

    def _parse_expr(self, expr: ast.expr) -> types.Expression:
        match expr:
            case ast.UnaryOp(op=op, operand=ast.Constant(value=value)):
                match op:
                    case ast.UAdd():  # +n
                        return value
                    case ast.USub():  # -n
                        return -value
                    case _:
                        raise UnsupportedExpression(f"Unsupported expression: {ast.dump(expr)}")
            case ast.BinOp(left=left, right=right, op=op):
                operator = self._operator_from_ast_op(op)
                return types.Operation(
                    left=self._parse_expr(left), right=self._parse_expr(right), operator=operator
                )
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
            case ast.Name(id=name):
                if name == 'true':
                    return True
                if name == 'false':
                    return False
                if name in self._columns:
                    return types.ColumnName(name=self._columns[name], alias=name)
                else:
                    return types.ColumnName(name=name, alias=name)
            case _:
                raise UnsupportedExpression(f"Unsupported expression: {ast.dump(expr)}")

    def parse(self) -> types.Expression:
        parsed = ast.parse(self.sanitize_formula())
        match parsed:
            case ast.Module(body=[ast.Expr(value=expr)]):
                return self._parse_expr(expr)
            case _:
                raise InvalidFormula("Invalid formula: Expected an expression at root")
