from typing import Callable

from pandas import DataFrame

DomainRetriever = Callable[[str], DataFrame]
