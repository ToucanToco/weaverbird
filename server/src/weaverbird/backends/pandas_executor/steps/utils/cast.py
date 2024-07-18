from typing import Any

from pandas import Series, to_datetime, to_numeric
from pandas import concat as pd_concat


def cast_to_float(s: Series) -> Series:
    return to_numeric(s, errors="coerce")  # cast errors will result in NaN values


def cast_to_int(s: Series) -> Series:
    s_float = cast_to_float(s)
    # Since .astype(int) would fail on NaN values, treat them separately:
    s_integer = s_float[s_float.notna()].astype(int)
    s_nan = s_float[s_float.isna()]
    # Pandas operate on NanoSecond Timestamp but we want to output MilliSecond Timestamps
    if str(s.dtype).startswith("datetime64"):
        s_integer = s_integer // 10**6
    return pd_concat([s_integer, s_nan]).sort_index()


def cast_to_str(s: Series) -> Series:
    return s.astype(str)


def cast_to_datetime(s: Series) -> Series:
    is_casting_timestamps = str(s.dtype).startswith("int")

    # ValueError('cannot specify both format and unit')
    extra_kwargs: dict[str, Any] = {"unit": "ms"} if is_casting_timestamps else {"format": "mixed", "unit": None}
    return to_datetime(
        s,
        errors="coerce",  # cast errors will result in NaT values
        **extra_kwargs,
    )


def cast_to_bool(s: Series) -> Series:
    return s.astype(bool)
