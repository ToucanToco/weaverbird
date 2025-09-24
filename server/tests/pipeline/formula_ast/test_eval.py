import pytest

from weaverbird.pipeline.formula_ast import eval as eval_
from weaverbird.pipeline.formula_ast import types as ty


@pytest.mark.parametrize(
    "input_string,expected_expr",
    [
        # Constants - Numbers
        ("42", 42),
        ("3.14", 3.14),
        ("-5", -5),
        ("-2.5", -2.5),
        ("+10", 10),
        ("+1.5", 1.5),
        # Constants - Booleans and null
        ("true", True),
        ("false", False),
        ("null", None),
        # Constants - Strings
        ("'hello'", "hello"),
        ('"world"', "world"),
        ("'string with spaces'", "string with spaces"),
        ('"string with quotes \\"test\\""', 'string with quotes "test"'),
        # Column names - Simple
        ("column1", ty.ColumnName(name="column1", alias="column1")),
        ("myColumn", ty.ColumnName(name="myColumn", alias="myColumn")),
        ("_private", ty.ColumnName(name="_private", alias="_private")),
        # Column names - With brackets (special characters)
        ("[column with spaces]", ty.ColumnName(name="column with spaces", alias="__VQB_COL__0")),
        ("[Column-With-Dashes]", ty.ColumnName(name="Column-With-Dashes", alias="__VQB_COL__0")),
        ("[123numeric]", ty.ColumnName(name="123numeric", alias="__VQB_COL__0")),
        ("[special@chars#]", ty.ColumnName(name="special@chars#", alias="__VQB_COL__0")),
        ("[with'single quote]", ty.ColumnName(name="with'single quote", alias="__VQB_COL__0")),
        ('[with"double quote]', ty.ColumnName(name='with"double quote', alias="__VQB_COL__0")),
        # Unary operations - Plus
        ("+column1", ty.ColumnName(name="column1", alias="column1")),
        ("+[my column]", ty.ColumnName(name="my column", alias="__VQB_COL__0")),
        # Unary operations - Minus
        (
            "-column1",
            ty.Operation(left=-1, operator=ty.Operator.MUL, right=ty.ColumnName(name="column1", alias="column1")),
        ),
        (
            "-[my column]",
            ty.Operation(
                left=-1, operator=ty.Operator.MUL, right=ty.ColumnName(name="my column", alias="__VQB_COL__0")
            ),
        ),
        # Basic arithmetic operations
        (
            "a + b",
            ty.Operation(
                left=ty.ColumnName(name="a", alias="a"),
                operator=ty.Operator.ADD,
                right=ty.ColumnName(name="b", alias="b"),
            ),
        ),
        (
            "x - y",
            ty.Operation(
                left=ty.ColumnName(name="x", alias="x"),
                operator=ty.Operator.SUB,
                right=ty.ColumnName(name="y", alias="y"),
            ),
        ),
        (
            "a * b",
            ty.Operation(
                left=ty.ColumnName(name="a", alias="a"),
                operator=ty.Operator.MUL,
                right=ty.ColumnName(name="b", alias="b"),
            ),
        ),
        (
            "x / y",
            ty.Operation(
                left=ty.ColumnName(name="x", alias="x"),
                operator=ty.Operator.DIV,
                right=ty.ColumnName(name="y", alias="y"),
            ),
        ),
        (
            "a % b",
            ty.Operation(
                left=ty.ColumnName(name="a", alias="a"),
                operator=ty.Operator.MOD,
                right=ty.ColumnName(name="b", alias="b"),
            ),
        ),
        # Operations with constants
        ("5 + 3", ty.Operation(left=5, operator=ty.Operator.ADD, right=3)),
        ("10 - 4", ty.Operation(left=10, operator=ty.Operator.SUB, right=4)),
        ("6 * 7", ty.Operation(left=6, operator=ty.Operator.MUL, right=7)),
        ("8 / 2", ty.Operation(left=8, operator=ty.Operator.DIV, right=2)),
        ("15 % 4", ty.Operation(left=15, operator=ty.Operator.MOD, right=4)),
        # Mixed operations (column and constant)
        (
            "column1 + 10",
            ty.Operation(left=ty.ColumnName(name="column1", alias="column1"), operator=ty.Operator.ADD, right=10),
        ),
        ("5 * price", ty.Operation(left=5, operator=ty.Operator.MUL, right=ty.ColumnName(name="price", alias="price"))),
        (
            "[total amount] / 100",
            ty.Operation(
                left=ty.ColumnName(name="total amount", alias="__VQB_COL__0"), operator=ty.Operator.DIV, right=100
            ),
        ),
        # Nested operations with precedence
        (
            "a + b * c",
            ty.Operation(
                left=ty.ColumnName(name="a", alias="a"),
                operator=ty.Operator.ADD,
                right=ty.Operation(
                    left=ty.ColumnName(name="b", alias="b"),
                    operator=ty.Operator.MUL,
                    right=ty.ColumnName(name="c", alias="c"),
                ),
            ),
        ),
        (
            "a * b + c",
            ty.Operation(
                left=ty.Operation(
                    left=ty.ColumnName(name="a", alias="a"),
                    operator=ty.Operator.MUL,
                    right=ty.ColumnName(name="b", alias="b"),
                ),
                operator=ty.Operator.ADD,
                right=ty.ColumnName(name="c", alias="c"),
            ),
        ),
        # Parentheses for explicit precedence
        (
            "(a + b) * c",
            ty.Operation(
                left=ty.Operation(
                    left=ty.ColumnName(name="a", alias="a"),
                    operator=ty.Operator.ADD,
                    right=ty.ColumnName(name="b", alias="b"),
                ),
                operator=ty.Operator.MUL,
                right=ty.ColumnName(name="c", alias="c"),
            ),
        ),
        (
            "a * (b + c)",
            ty.Operation(
                left=ty.ColumnName(name="a", alias="a"),
                operator=ty.Operator.MUL,
                right=ty.Operation(
                    left=ty.ColumnName(name="b", alias="b"),
                    operator=ty.Operator.ADD,
                    right=ty.ColumnName(name="c", alias="c"),
                ),
            ),
        ),
        # Complex nested expressions
        (
            "(a + b) / (c - d)",
            ty.Operation(
                left=ty.Operation(
                    left=ty.ColumnName(name="a", alias="a"),
                    operator=ty.Operator.ADD,
                    right=ty.ColumnName(name="b", alias="b"),
                ),
                operator=ty.Operator.DIV,
                right=ty.Operation(
                    left=ty.ColumnName(name="c", alias="c"),
                    operator=ty.Operator.SUB,
                    right=ty.ColumnName(name="d", alias="d"),
                ),
            ),
        ),
        # Multiple bracket columns in one expression
        (
            "[first col] + [second col]",
            ty.Operation(
                left=ty.ColumnName(name="first col", alias="__VQB_COL__0"),
                operator=ty.Operator.ADD,
                right=ty.ColumnName(name="second col", alias="__VQB_COL__1"),
            ),
        ),
        # Float operations
        (
            "3.14 * radius",
            ty.Operation(left=3.14, operator=ty.Operator.MUL, right=ty.ColumnName(name="radius", alias="radius")),
        ),
        (
            "price * 1.08",
            ty.Operation(left=ty.ColumnName(name="price", alias="price"), operator=ty.Operator.MUL, right=1.08),
        ),
        # Boolean constants in expressions
        ("true + 1", ty.Operation(left=True, operator=ty.Operator.ADD, right=1)),
        (
            "column1 * false",
            ty.Operation(left=ty.ColumnName(name="column1", alias="column1"), operator=ty.Operator.MUL, right=False),
        ),
        # Null in expressions
        (
            "null + column1",
            ty.Operation(left=None, operator=ty.Operator.ADD, right=ty.ColumnName(name="column1", alias="column1")),
        ),
    ],
)
def test_formula_parser(input_string: str, expected_expr: ty.Expression) -> None:
    parser = eval_.FormulaParser(input_string)
    parsed = parser.parse()
    assert parsed == expected_expr
