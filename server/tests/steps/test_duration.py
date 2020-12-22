from datetime import datetime, timedelta
from typing import Dict

import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.steps.duration import DurationStep


@pytest.mark.parametrize(
    "time_delta_parameters,duration_in, expected_result",
    [
        ({'days': 30}, 'hours', 30.0 * 24),
        ({'days': 1, 'hours': 12}, 'hours', 36),
        ({'hours': 1}, 'days', 1 / 24.0),
    ],
)
def test_duration(time_delta_parameters: Dict[str, int], duration_in: str, expected_result: float):
    step = DurationStep(
        name='duration',
        newColumnName='DURATION',
        startDateColumn='START_DATE',
        endDateColumn='END_DATE',
        durationIn=duration_in,
    )

    now = datetime.now()
    delta = timedelta(**time_delta_parameters)
    sample_df = pd.DataFrame({'START_DATE': [now], 'END_DATE': [now + delta]})

    result_df = step.execute(sample_df)

    expected_result = pd.DataFrame(
        {
            'START_DATE': [now],
            'END_DATE': [now + delta],
            'DURATION': [expected_result],
        }
    )

    assert_dataframes_equals(result_df, expected_result)
