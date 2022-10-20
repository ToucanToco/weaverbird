from datetime import datetime

import pytest


@pytest.fixture
def available_variables():
    return {
        "TODAY": datetime(2022, 10, 17, 17, 30, 12),
        "ONE": 1,
        "ONE_POINT_ONE": 1.1,
        "TRUE": True,
    }
