import datetime
import random

import numpy as np
from pandas import DataFrame

from weaverbird.backends.pandas_executor.steps.todate import execute_todate
from weaverbird.pipeline.steps import ToDateStep


def test_benchmark_sort(benchmark):
    now = datetime.datetime.today()
    today = datetime.datetime(year=now.year, month=now.month, day=now.day)
    groups = ["group_1", "group_2"]
    df = DataFrame(
        {
            "value": np.random.random(1000),
            "id": list(range(1000)),
            "date": [(today + datetime.timedelta(days=nb_day)).strftime("%Y-%m-%d") for nb_day in list(range(1000))],
            "group": [random.choice(groups) for _ in range(1000)],
        }
    )

    step = ToDateStep(name="todate", column="date")

    benchmark(execute_todate, step, df)
