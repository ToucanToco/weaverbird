from pandas import Series, to_datetime, to_numeric


def cast_to_float(s: Series) -> Series:
    return to_numeric(s, errors='coerce')  # cast errors will result in NaN values


def cast_to_int(s: Series) -> Series:
    s_float = cast_to_float(s)
    # Since .astype(int) would fail on NaN values, treat them separately:
    s_integer = s_float[s_float.notna()].astype(int)
    s_nan = s_float[s_float.isna()]
    # Pandas operate on NanoSecond Timestamp but we want to output MilliSecond Timestamps
    if s.dtype == 'datetime64[ns]':
        s_integer = s_integer // 10 ** 6
    return s_integer.append(s_nan).sort_index()


def cast_to_str(s: Series) -> Series:
    return s.astype(str)


def cast_to_datetime(s: Series) -> Series:
    timestamp_unit = 'ms' if s.dtype == 'int64' else None
    return to_datetime(
        s, errors='coerce', unit=timestamp_unit
    )  # cast errors will result in NaT values


def cast_to_bool(s: Series) -> Series:
    return s.astype(bool)
