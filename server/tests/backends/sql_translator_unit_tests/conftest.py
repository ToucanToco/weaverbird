from typing import Any

import pytest
from pypika.queries import QueryBuilder


@pytest.fixture
def default_step_kwargs() -> dict[str, Any]:
    return {'builder': QueryBuilder(), 'prev_step_name': 'previous_with'}
