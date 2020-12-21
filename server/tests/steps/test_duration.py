import datetime
from datetime import datetime, timedelta

import pandas as pd

from tests.utils import assert_dataframes_equals
from weaverbird.steps.duration import DurationStep


def test_duration():
    step = DurationStep(
        name='duration',
        newColumnName='DURATION',
        startDateColumn='START_DATE',
        endDateColumn='END_DATE',
        durationIn='days',
    )

    now = datetime.now()
    sample_df = pd.DataFrame(
        {
            'START_DATE': [now, now],
            'END_DATE': [now + timedelta(days=30, hours=12), now + timedelta(days=365)],
        }
    )

    result_df = step.execute(sample_df)

    expected_result = pd.DataFrame(
        {
            'START_DATE': [now, now],
            'END_DATE': [now + timedelta(days=30, hours=12), now + timedelta(days=365)],
            'DURATION': [30.0, 365.0],
        }
    )

    assert_dataframes_equals(result_df, expected_result)
