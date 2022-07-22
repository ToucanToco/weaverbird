from pandas import DataFrame

from weaverbird.backends.utils.formula import PandasFormulaBuilder


def translate_formula(formula: str) -> str:
    return PandasFormulaBuilder.translate_formula(formula)


def build_formula_tree(df: DataFrame, formula_str: str) -> DataFrame:
    return PandasFormulaBuilder.build_formula_tree(df, formula_str)
