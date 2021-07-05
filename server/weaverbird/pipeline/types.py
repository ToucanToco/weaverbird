from typing import Any, Callable

from pandas import DataFrame

ColumnName = str
# Pipeline = List[dict]
TemplatedVariable = Any


class PopulatedWithFieldnames:
    allow_population_by_field_name = True
