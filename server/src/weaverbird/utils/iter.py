import itertools
from typing import Any


def combinations(items: list[Any]) -> list[tuple[Any, ...]]:
    # combinations of all lenghts must be included. return is ordered by combination lenght
    result = []
    for i in range(1, len(items) + 1):
        result += list(itertools.combinations(items, i))
    return result
