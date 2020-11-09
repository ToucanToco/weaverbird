from pandas import DataFrame
from pydantic import Field

from weaverbird.formula import clean_formula
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName


class FormulaStep(BaseStep):
    name = Field('formula', const=True)
    new_column: ColumnName
    formula: str

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        serie = df.eval(clean_formula(self.formula))
        return df.assign(**{self.new_column: serie})
