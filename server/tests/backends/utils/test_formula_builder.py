import ast

import pytest

from weaverbird.backends.utils.formula_builder import (
    AthenaFormulaBuilder,
    ColumnBuilder,
    FormulaBuilder,
    GoogleBigqueryFormulaBuilder,
    MongoFormulaBuilder,
    MysqlFormulaBuilder,
    SnowflakeFormulaBuilder,
    SqlFormulaBuilder,
)


def test_column_builder():
    """some basic column build"""
    assert ColumnBuilder('"', 'test').__str__() == '"test"'
    assert ColumnBuilder('$', 'test').__str__() == '$test'
    assert ColumnBuilder('${', 'test').__str__() == '${test}'
    assert ColumnBuilder('[', 'test').__str__() == '[test]'


def test_formula_builders():
    """some basic checks on various formulas"""

    assert type(FormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')) == ast.Expr

    assert FormulaBuilder.evaluate('1 - 3 / (12 - 5 / (9 -1) - 23)') == 1.2580645161290323

    assert SqlFormulaBuilder.sanitize_formula('1 - "3" / 12 - 5 / askk') == (
        {},
        '1 - 3 / NULLIF(12, 0) - 5 / NULLIF("askk", 0)',
    )

    assert (
        SnowflakeFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
        == "1 - 3 / NULLIF(12, 0) - 5 / NULLIF('askk', 0)"
    )

    assert (
        MysqlFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
        == '1 - 3 / NULLIF(12, 0) - 5 / NULLIF(`askk`, 0)'
    )

    assert (
        AthenaFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
        == '1 - 3 / NULLIF(12, 0) - 5 / NULLIF("askk", 0)'
    )

    assert (
        GoogleBigqueryFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
        == '1 - 3 / NULLIF(12, 0) - 5 / NULLIF(`askk`, 0)'
    )

    assert MongoFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk') == {
        "$subtract": [
            {
                "$subtract": [
                    1,
                    {"$cond": [{"$in": [12, [0, None]]}, None, {"$divide": ["3", 12]}]},
                ]
            },
            {"$cond": [{"$in": ["$askk", [0, None]]}, None, {"$divide": [5, "$askk"]}]},
        ]
    }


def test_formula_builders_errors():
    with pytest.raises(TypeError):
        assert FormulaBuilder.evaluate('"1" - 3')

    with pytest.raises(SyntaxError):
        assert MongoFormulaBuilder.evaluate('"1" ~ 3')

    with pytest.raises(SyntaxError):
        assert FormulaBuilder.build_formula_tree('1 ~+ "3"')
