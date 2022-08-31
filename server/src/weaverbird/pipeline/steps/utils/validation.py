from collections.abc import Sequence

from weaverbird.exceptions import DuplicateColumnError


def validate_unique_columns(columns: Sequence[str]) -> Sequence[str]:
    if len(set(columns)) < len(columns):
        raise DuplicateColumnError
    else:
        return columns
