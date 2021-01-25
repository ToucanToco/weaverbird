from typing import Any, Callable, List

from pandas import DataFrame

ColumnName = str
Pipeline = List[dict]
DomainRetriever = Callable[[str], DataFrame]
PipelineExecutor = Callable[[List[dict]], DataFrame]
TemplatedVariable = Any


class PopulatedWithFieldnames:
    allow_population_by_field_name = True
