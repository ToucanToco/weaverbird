"""
Although the code in appears broken with inspection, it is not. Sly uses some hacky syntax.
https://sly.readthedocs.io/en/latest/sly.html#writing-a-parser
"""

from sly import Lexer

from .decorators import _
from .exceptions import ExpressionSyntaxError


class PyPikaLexer(Lexer):
    # Set of token names.   This is always required
    tokens = {
        "NAME",
        "QUOTED_NAME",
        "DECIMAL",
        "INTEGER",
        "STRING",
        "PLUS",
        "MINUS",
        "TIMES",
        "DIVIDE",
        "MODULO",
        "EQ",
        "LT",
        "LE",
        "GT",
        "GE",
        "NE",
        "NE2",
        "TRUE",
        "FALSE",
        "NULL",
        "NULLS",
        "IN",
        "IS",
        "AS",
        "FROM",
        "BY",
        "LIKE",
        "ILIKE",
        "NOT",
        "AND",
        "OR",
        "USING",
        "PARAMETERS",
        "PERCENTILE",
        "CASE",
        "WHEN",
        "THEN",
        "ELSE",
        "END",
        "DBL_PIPE",
        "DISTINCT",
        "BETWEEN",
        "OVER",
        "PARTITION",
        "ORDER",
        "ASC",
        "DESC",
        "IGNORE",
        "CAST",
        "APPROXIMATE_PERCENTILE",
        "EXTRACT",
        "INTEGER_TYPE",
        "FLOAT_TYPE",
        "NUMERIC_TYPE",
        "SIGNED_TYPE",
        "UNSIGNED_TYPE",
        "BOOLEAN_TYPE",
        "CHAR_TYPE",
        "VARCHAR_TYPE",
        "BINARY_TYPE",
        "VARBINARY_TYPE",
        "LONG_TYPE",
        "YEAR",
        "QUARTER",
        "MONTH",
        "WEEK",
        "DAY",
        "HOUR",
        "MINUTE",
        "SECOND",
        "MICROSECOND",
    }

    special_tokens = {
        "IN": "IN",
        "IS": "IS",
        "AS": "AS",
        "FROM": "FROM",
        "BY": "BY",
        "NULL": "NULL",
        "NULLS": "NULLS",
        "NOT": "NOT",
        "AND": "AND",
        "OR": "OR",
        "CASE": "CASE",
        "WHEN": "WHEN",
        "THEN": "THEN",
        "ELSE": "ELSE",
        "END": "END",
        "DISTINCT": "DISTINCT",
        "BETWEEN": "BETWEEN",
        "TRUE": "TRUE",
        "FALSE": "FALSE",
        "OVER": "OVER",
        "IGNORE": "IGNORE",
        "PARTITION": "PARTITION",
        "USING": "USING",
        "PARAMETERS": "PARAMETERS",
        "PERCENTILE": "PERCENTILE",
        "ORDER": "ORDER",
        "ASC": "ASC",
        "DESC": "DESC",
        # Special Functions
        "CAST": "CAST",
        "APPROXIMATE_PERCENTILE": "APPROXIMATE_PERCENTILE",
        "EXTRACT": "EXTRACT",
        "LIKE": "LIKE",
        "ILIKE": "ILIKE",
        # TYPES
        "INTEGER": "INTEGER_TYPE",
        "FLOAT": "FLOAT_TYPE",
        "NUMERIC": "NUMERIC_TYPE",
        "SIGNED": "SIGNED_TYPE",
        "UNSIGNED": "UNSIGNED_TYPE",
        "BOOLEAN": "BOOLEAN_TYPE",
        "CHAR": "CHAR_TYPE",
        "VARCHAR": "VARCHAR_TYPE",
        "BINARY": "BINARY_TYPE",
        "VARBINARY": "VARBINARY_TYPE",
        "LONG": "LONG_TYPE",
        # TIME UNITS
        "YEAR": "YEAR",
        "QUARTER": "QUARTER",
        "MONTH": "MONTH",
        "WEEK": "WEEK",
        "DAY": "DAY",
        "HOUR": "HOUR",
        "MINUTE": "MINUTE",
        "SECOND": "SECOND",
        "MICROSECOND": "MICROSECOND",
    }

    literals = {r".", r",", r"(", r")", r'"', r"'"}

    # String containing ignored characters
    ignore = " \t"

    @_(r'\"([^"\n]|"")*\"')
    def QUOTED_NAME(self, t):
        t.value = t.value[1:-1]
        return t

    @_(r"\'([^'\n]|'')*\'")
    def STRING(self, t):
        t.value = t.value[1:-1].replace("''", "'")
        return t

    @_(r"(\d*\.\d+)([eE][-+]?[0-9]+)?", r"(\d+\.\d*)([eE][-+]?[0-9]+)?", r"(\d+)[eE][-+]?[0-9]+")
    def DECIMAL(self, t):
        t.value = float(t.value)
        return t

    @_(r"\d+")
    def INTEGER(self, t):
        t.value = int(t.value)
        return t

    # Regular expression rules for tokens
    PLUS = r"\+"
    MINUS = r"-"
    TIMES = r"\*"
    DIVIDE = r"/"
    MODULO = r"%"
    EQ = r"="
    NE = r"<>"
    NE2 = r"!="
    LE = r"<="
    LT = r"<"
    GE = r">="
    GT = r">"
    DBL_PIPE = r"\|\|"

    @_(r"[a-zA-Z][a-zA-Z0-9_@#]*")
    def NAME(self, t):
        upper_value = t.value.upper()
        if upper_value in self.special_tokens:
            t.type = self.special_tokens[upper_value]
        return t

    @_(r"\n+")
    def newline(self, t):
        self.lineno += t.value.count("\n")

    def error(self, t):
        raise ExpressionSyntaxError(
            f"Syntax Error: illegal value '{t.value}' on line {self.lineno}:{self.index}"
        )
