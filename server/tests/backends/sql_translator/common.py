import math
from contextlib import suppress
from decimal import Decimal
from typing import Any

import pandas as pd


def standardized_columns(df: pd.DataFrame, colname_lowercase: bool = False):
    df.columns = [
        (c.replace("-", "_").lower() if colname_lowercase else c.replace("-", "_"))
        for c in df.columns
    ]


def standardized_values(df: pd.DataFrame, convert_nan_to_none: bool = False) -> None:
    # We can standardized the floating point

    def _clean_float(first_value: Any, colname: str) -> None:
        with suppress(Exception):
            for i, v in enumerate(df[colname].values):
                # we truncate the decimal part to have only 10 values (withouth
                # rounding it)
                df[colname].values[i] = math.floor(v * 10**10) / 10**10

    for colname in df:
        if df[colname].dtype == "object":
            # get the first non-null value in the series.
            # if it's a float, try to convert the whole serie with the
            # precision we want.
            s = df[colname]
            idx = s.first_valid_index()
            if idx is not None and (first_value := s.loc[idx]) is not None:
                if isinstance(first_value, Decimal | float) and "." in str(first_value):
                    _clean_float(first_value, colname)
