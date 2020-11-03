from typing import Callable, List

from pandas import DataFrame

ColumnName = str
DomainRetriever = Callable[[str], DataFrame]
PipelineExecutor = Callable[[List[dict]], DataFrame]
