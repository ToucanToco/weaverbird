from typing import Callable, List

from pandas import DataFrame

DomainRetriever = Callable[[str], DataFrame]
PipelineExecutor = Callable[[List[dict]], DataFrame]
