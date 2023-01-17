from typing import List, Tuple

from pypika import Table

from .lexer import PyPikaLexer
from .parser import PyPikaParser


class ExpressionEvaluator(object):
    def __init__(self, tables):
        self.lexer = PyPikaLexer()
        self.parser = PyPikaParser(
            {table._table_name: table for table in self._maybe_convert_pypika_tables(tables)}
        )

    def _maybe_convert_pypika_tables(self, tables: List[Tuple]):
        ptables = [
            table if isinstance(table, Table) else Table(table[0], alias=table[1])
            for table in tables
        ]
        return ptables

    def eval(self, expression):
        assert expression is not None
        tokens = self.lexer.tokenize(expression)
        result = self.parser.parse(tokens)
        if result is None:
            raise Exception("Unable to parse. Either expression is invalid or unsupported.")
        return result
